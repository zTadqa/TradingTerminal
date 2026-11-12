"""Local TradingView memory bridge. Never changes the source chart's resolution."""
import asyncio
import copy
import ctypes
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import logging
import os
import subprocess
from pathlib import Path
import threading
import time
from urllib.request import urlopen
from urllib.parse import urlencode, parse_qs, urlsplit

import websockets
from websockets.sync.client import connect as sync_connect
from market_store import MarketStore, RESOLUTIONS, SYMBOLS
from companion_services import EconomicCalendar, music_metadata, resolve_music_share
calendar_service = EconomicCalendar()

ROOT = Path(__file__).resolve().parent
HTTP_PORT = int(os.getenv('TERMINAL_HTTP_PORT', '3000'))
WS_PORT = int(os.getenv('TERMINAL_WS_PORT', '8080'))
CDP_PORT = int(os.getenv('TERMINAL_CDP_PORT', '9222'))
store = MarketStore(os.getenv('TERMINAL_DATA_DIR', str(ROOT)))
clients = set()
refresh = asyncio.Event()
status = {'type': 'bridge_status', 'state': 'connecting', 'last_update': None,
          'message': 'Đang kết nối TradingView', 'symbols': [],
          'service': 'trading-terminal', 'protocol_version': 2, 'pid': os.getpid()}
history_progress = {}
subscriptions = {}
source_updates = {}
source_config = Path(os.getenv('TERMINAL_DATA_DIR', str(ROOT))) / 'source_requests.json'
try:
    last_requests = json.loads(source_config.read_text(encoding='utf-8'))
    last_requests = {(s, tf) for s, tf in last_requests if s in SYMBOLS and tf in RESOLUTIONS.values()}
except (OSError, ValueError, TypeError):
    last_requests = set()

# Read actual chart state, including manual/unmarked charts. Never navigate a user's chart.
SOURCE_INFO_JS = r'''(() => {
 const c=window._exposed_chartWidgetCollection;if(!c)return null;
 const widgets=typeof c.getAll==='function'?c.getAll():[c.activeChartWidget.value()];
 const charts=[];
 for(const widget of widgets){
   const series=widget?.model()?.mainSeries(),info=series?.symbolInfo();
   const symbol=info?.name||info?.ticker,resolution=series?.interval();
   if(symbol&&resolution)charts.push({symbol:String(symbol).split(':').pop(),resolution:String(resolution)});
 }
 return charts.length?charts:null;
})()'''


def is_chart_target(target):
    url = urlsplit(target.get('url', ''))
    return (target.get('type') == 'page' and url.scheme == 'https'
            and url.hostname in ('www.tradingview.com', 'tradingview.com')
            and url.path.startswith('/chart/') and bool(target.get('webSocketDebuggerUrl')))


def source_pairs(target):
    if not is_chart_target(target):
        return set()
    with sync_connect(target['webSocketDebuggerUrl'], open_timeout=3, close_timeout=1) as connection:
        connection.send(json.dumps({'id':1, 'method':'Runtime.evaluate', 'params':{'expression':SOURCE_INFO_JS, 'returnByValue':True}}))
        while True:
            response = json.loads(connection.recv(timeout=4))
            if response.get('id') == 1:
                values = response.get('result', {}).get('result', {}).get('value')
                if not isinstance(values, list):
                    raise RuntimeError('TradingView chart metadata is not ready')
                return {(v.get('symbol'), RESOLUTIONS.get(v.get('resolution'))) for v in values if v.get('symbol') in SYMBOLS and v.get('resolution') in RESOLUTIONS}

def remember_requests():
    global last_requests
    if subscriptions:
        last_requests = set().union(*subscriptions.values())
        try:
            temporary = source_config.with_suffix('.tmp')
            temporary.write_text(json.dumps(sorted(last_requests)), encoding='utf-8')
            temporary.replace(source_config)
        except OSError:
            logging.exception('Could not persist source configuration')



def validate_subscription(charts):
    if not isinstance(charts, list) or len(charts) > 16:
        raise ValueError('Invalid chart subscriptions')
    result = set()
    for chart in charts:
        if not isinstance(chart, dict) or chart.get('symbol') not in SYMBOLS or chart.get('timeframe') not in RESOLUTIONS.values():
            raise ValueError('Invalid symbol/timeframe')
        result.add((chart['symbol'], chart['timeframe']))
    return result


def requested_pairs():
    wanted = set().union(*subscriptions.values()) if subscriptions else last_requests
    return {pair for pair in wanted if pair[1] not in ('6h', '12h')}


def source_marker(target):
    url = urlsplit(target.get('url', ''))
    if url.scheme != 'https' or url.hostname not in ('www.tradingview.com', 'tradingview.com') or not url.path.startswith('/chart/'):
        return None
    key = parse_qs(url.query).get('terminal_live', [None])[0]
    if not key or ':' not in key:
        return None
    symbol, tf = key.rsplit(':', 1)
    return key if symbol in SYMBOLS and tf in RESOLUTIONS.values() else None


def memory_available():
    if os.name != 'nt':
        return None
    class Memory(ctypes.Structure):
        _fields_ = [('length', ctypes.c_ulong), ('load', ctypes.c_ulong)] + [(name, ctypes.c_ulonglong) for name in
            ('total', 'available', 'total_page', 'available_page', 'total_virtual', 'available_virtual', 'extended')]
    memory = Memory()
    memory.length = ctypes.sizeof(memory)
    return memory.available if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(memory)) else None


HISTORY_JS = r'''(() => {
 const w=window._exposed_chartWidgetCollection?.activeChartWidget.value();
 if(!w)return null;
 const s=w.model().mainSeries(), bars=s.bars();
 if(!bars?.size())return null;
 const symbol=String(s.symbolInfo()?.name||'').split(':').pop(), resolution=String(s.interval());
 const key=symbol+':'+resolution, now=Date.now();
 const state=window.__terminalHistoryState ||= {};
 const p=state[key] ||= {count:0,growth:now,request:0};
 if(p.count!==bars.size()){p.count=bars.size();p.growth=now;}
 const loading=s.isLoading(), available=s.requestMoreDataAvailable();
 const stalled=!!p.request && now-p.growth>45000 && !loading;
 const complete=!loading && (!available || stalled || !__ALLOW__);
 if(!complete && !loading && available && now-p.request>3000){s.requestMoreData(5000);p.request=now;}
 return {symbol,resolution,count:bars.size(),complete,loading:s.isLoading(),reason:!__ALLOW__?'memory':stalled?'stalled':!available?'source_limit':'loading'};
})()'''

# Symbol metadata is authoritative; titles and sds_N indexes are not symbols.
SNAPSHOT_JS = r'''(() => {
  const collection = window._exposed_chartWidgetCollection;
  if (!collection) throw new Error('TradingView chart collection unavailable');
  const widgets = typeof collection.getAll === 'function' ? collection.getAll() : [collection.activeChartWidget.value()];
  const result = new Map();
  for (const widget of widgets) for (const source of widget.model().dataSources()) {
    try {
      const info = source.symbolInfo?.();
      const resolution = source.interval?.();
      if (!info || !resolution) continue;
      const symbol = String(info.name || info.ticker || '').split(':').pop();
      if (!['NQ1!', 'ES1!', 'YM1!', 'CL1!'].includes(symbol)) continue;
      const bars = source.data?.()?.bars?.() || source.bars?.();
      if (!bars || !bars.size()) continue;
      const output = [];
      const append = value => {
        if (value && value.length >= 5) output.push({time:value[0],open:value[1],high:value[2],low:value[3],close:value[4],volume:value[5] || 0});
      };
      if (__FULL__) bars.each((index,value) => { append(value); });
      else append(bars.valueAt(bars.lastIndex()));
      const entry = {symbol, resolution, bars:output, metadata:{
        exchange:info.exchange || info.listed_exchange || '', description:info.description || symbol,
        timezone:info.timezone, session:info.session,
        sessionCorrections:info.corrections || info['session-correction'] || info.session_correction || '',
        tickSize:info.minmov / info.pricescale, pointValue:info.pointvalue,
        sessionRegular:(info.subsessions || []).filter(s => s.id === 'us_regular').map(s => ({session:s.session, corrections:s['session-correction'] || ''}))[0] || null,
        holidays:info.session_holidays || ''
      }};
      const key = symbol + ':' + resolution, previous = result.get(key);
      const last = output.at(-1)?.time ?? -1, priorLast = previous?.bars.at(-1)?.time ?? -1;
      if (!previous || last > priorLast || last === priorLast && output.length > previous.bars.length) result.set(key, entry);
    } catch (error) { result.set('error:' + result.size, {error:String(error)}); }
  }
  return [...result.values()];
})()'''


def discover_target():
    with urlopen(f'http://localhost:{CDP_PORT}/json', timeout=3) as response:
        targets = json.load(response)
    return next((t['webSocketDebuggerUrl'] for t in targets if t.get('type') == 'page'
                 and 'tradingview.com/chart/' in t.get('url', '')), None)


class CDPConnection:
    def __init__(self, socket):
        self.socket = socket
        self.pending = {}
        self.sequence = 0

    async def read(self):
        try:
            async for raw in self.socket:
                value = json.loads(raw)
                future = self.pending.get(value.get('id'))
                if future and not future.done():
                    if 'error' in value:
                        future.set_exception(RuntimeError(str(value['error'])))
                    else:
                        future.set_result(value.get('result', {}))
        finally:
            for future in self.pending.values():
                if not future.done():
                    future.set_exception(ConnectionError('CDP disconnected'))

    async def evaluate(self, expression):
        self.sequence += 1
        request_id = self.sequence
        future = asyncio.get_running_loop().create_future()
        self.pending[request_id] = future
        try:
            await self.socket.send(json.dumps({'id': request_id, 'method': 'Runtime.evaluate',
                                              'params': {'expression': expression, 'returnByValue': True}}))
            result = await asyncio.wait_for(future, timeout=6)
            if result.get('exceptionDetails'):
                raise RuntimeError(str(result['exceptionDetails']))
            return result.get('result', {}).get('value')
        finally:
            self.pending.pop(request_id, None)


def publish(message):
    encoded = json.dumps(message, allow_nan=False)
    for queue in list(clients):
        try:
            queue.put_nowait(encoded)
        except asyncio.QueueFull:
            clients.discard(queue)
            while not queue.empty():
                queue.get_nowait()
            queue.put_nowait(None)


def set_status(state, message, **fields):
    status.update(state=state, message=message, **fields)
    publish(status)


async def poll_source(source_url=None, expected=None):
    delay = 1
    while True:
        reader = None
        try:
            target = source_url or await asyncio.to_thread(discover_target)
            if not target:
                raise ConnectionError('Không tìm thấy chart TradingView đang mở')
            async with websockets.connect(target, max_size=20 * 1024 * 1024,
                                          open_timeout=5, close_timeout=2) as socket:
                cdp = CDPConnection(socket)
                reader = asyncio.create_task(cdp.read())
                next_full = 0
                delay = 1
                while True:
                    full = refresh.is_set() or time.monotonic() >= next_full
                    refresh.clear()
                    values = await cdp.evaluate(SNAPSHOT_JS.replace('__FULL__', 'true' if full else 'false'))
                    if source_url and full:
                        available_memory = memory_available()
                        try:
                            progress = await cdp.evaluate(HISTORY_JS.replace('__ALLOW__', 'true' if available_memory is None or available_memory > 2 * 1024**3 else 'false'))
                        except RuntimeError:
                            progress = None
                        if progress:
                            if progress.get('count') != history_progress.get(source_url, {}).get('count'):
                                next_full = 0
                            history_progress[source_url] = progress
                    available = []
                    for entry in values or []:
                        if entry.get('error'):
                            logging.warning('Source extraction: %s', entry['error'])
                            continue
                        symbol = entry.get('symbol')
                        tf = RESOLUTIONS.get(str(entry.get('resolution')))
                        if symbol not in SYMBOLS or not tf:
                            continue
                        if expected and (symbol, tf) != expected:
                            continue
                        last_bar = entry.get('bars', [])[-1] if entry.get('bars') else {}
                        source_updates[symbol+':'+tf] = {'symbol':symbol,'timeframe':tf,'updated':time.time(),
                            'last_bar_time':last_bar.get('time'),'close':last_bar.get('close'),'volume':last_bar.get('volume')}
                        available.append({'symbol': symbol, 'timeframe': tf})
                        store.metadata[symbol] = entry.get('metadata', {})
                        changed = store.merge(symbol, tf, entry.get('bars', []))
                        if full and changed:
                            publish({'type': 'history', 'symbol': symbol, 'timeframe': tf,
                                     'bars': changed, 'metadata': store.metadata[symbol], 'source': 'live'})
                        else:
                            for bar in changed:
                                publish({'type': 'tick', 'symbol': symbol, 'timeframe': tf, 'bar': bar})
                    if not available:
                        raise RuntimeError('Chart chưa có nến NQ/ES/YM/CL với metadata hợp lệ')
                    combined = [item for item in status.get('symbols', [])
                                if (item['symbol'],item['timeframe']) not in {(item['symbol'],item['timeframe']) for item in available}]
                    set_status('connected', 'TradingView · đang nhận dữ liệu', symbols=combined + available,
                               last_update=time.time(), sources=list(source_updates.values()))
                    if full:
                        next_full = time.monotonic() + 20
                    try:
                        await asyncio.wait_for(refresh.wait(), timeout=1)
                    except asyncio.TimeoutError:
                        pass
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logging.warning('TradingView connection: %s', exc)
            if expected:
                key = ':'.join(expected)
                source_updates[key] = {**source_updates.get(key, {}), 'symbol': expected[0], 'timeframe': expected[1], 'updated': 0, 'error': str(exc)}
                set_status(status['state'], 'Một nguồn TradingView gián đoạn', sources=list(source_updates.values()))
            if not source_url:
                set_status('disconnected', str(exc), symbols=[])
        finally:
            if reader:
                reader.cancel()
                await asyncio.gather(reader, return_exceptions=True)
        await asyncio.sleep(delay)
        delay = min(delay * 2, 15)


async def automatic_sources():
    """Keep one stable native source for every requested symbol/timeframe."""
    workers = {}
    owned = {}
    pending_creation = {}
    reverse = {tf: resolution for resolution, tf in RESOLUTIONS.items()}
    while True:
        try:
            wanted = requested_pairs()
            may_create = bool(subscriptions)
            def ensure():
                with urlopen(f'http://localhost:{CDP_PORT}/json/list', timeout=3) as response:
                    targets = json.load(response)
                actual = {}
                verified = []
                unverified = set()
                for target in targets:
                    if not is_chart_target(target):
                        continue
                    url = target['webSocketDebuggerUrl']
                    try:
                        for pair in source_pairs(target):
                            if pair not in actual or owned.get(':'.join(pair)) == url:
                                actual[pair] = url
                        verified.append(target)
                    except Exception:
                        unverified.add(url)
                now = time.monotonic()
                for key, (opened_at, previous_targets) in list(pending_creation.items()):
                    new_tab = any(source_marker(target) == key and target.get('id') not in previous_targets
                                  for target in targets)
                    if not new_tab and now - opened_at >= 60:
                        del pending_creation[key]
                result = {}
                for symbol, tf in sorted(wanted):
                    key = symbol + ':' + tf
                    url = actual.get((symbol, tf))
                    if url:
                        pending_creation.pop(key, None)
                        result[key] = url
                        continue
                    if owned.get(key) in unverified:
                        result[key] = owned[key]
                        continue
                    if not may_create or unverified or not verified or key in pending_creation:
                        continue
                    exchange = 'CBOT_MINI:' if symbol == 'YM1!' else 'NYMEX:' if symbol == 'CL1!' else 'CME_MINI:'
                    url = 'https://www.tradingview.com/chart/?' + urlencode({'symbol': exchange+symbol, 'interval':reverse[tf], 'terminal_live':key})
                    pending_creation[key] = (now, {target.get('id') for target in targets})
                    try:
                        with sync_connect(verified[0]['webSocketDebuggerUrl'], open_timeout=5, close_timeout=1) as connection:
                            connection.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{'expression':'window.open('+json.dumps(url)+', "_blank")','userGesture':True}}))
                            connection.recv(timeout=5)
                    except Exception:
                        logging.exception('Could not open TradingView chart %s', key)
                return result
            previous_owned = owned
            owned = await asyncio.to_thread(ensure)
            for key in set(workers)-set(owned) | {k for k in owned if k in previous_owned and owned[k] != previous_owned[k]}:
                workers.pop(key).cancel()
                source_updates.pop(key,None)
            for key,target in owned.items():
                if key not in workers or workers[key].done():
                    symbol, tf = key.rsplit(':', 1)
                    workers[key] = asyncio.create_task(poll_source(target, (symbol, tf)))
        except Exception:
            logging.exception('Live source subscription')
        try:
            await asyncio.sleep(3)
        except asyncio.CancelledError:
            for task in workers.values(): task.cancel()
            await asyncio.gather(*workers.values(),return_exceptions=True)
            raise


async def frontend_ws_handler(socket):
    queue = asyncio.Queue(maxsize=64)

    async def send_loop():
        try:
            while True:
                message = await queue.get()
                if message is None:
                    await socket.close(code=1013, reason='Client too slow; reconnect for snapshot')
                    return
                await asyncio.wait_for(socket.send(message), timeout=5)
        except websockets.exceptions.ConnectionClosedOK:
            return
        except Exception as exc:
            logging.warning('Frontend send failed: %s', exc)
            await socket.close(code=1011, reason='Send failed; reconnect for snapshot')

    sender = None
    try:
        queue.put_nowait(json.dumps(status))
        for tf, symbols in store.data.items():
            for symbol, bars in symbols.items():
                if bars:
                    queue.put_nowait(json.dumps({'type': 'history', 'symbol': symbol, 'timeframe': tf,
                                                'bars': bars, 'metadata': store.metadata.get(symbol), 'source': 'cache'}))
        clients.add(queue)
        sender = asyncio.create_task(send_loop())
        async for raw in socket:
            try:
                request = json.loads(raw)
                if not isinstance(request, dict):
                    raise ValueError('Expected an object')
                if request.get('action') == 'subscribe':
                    subscriptions[id(socket)] = validate_subscription(request.get('charts', []))
                    remember_requests()
                elif request.get('action') in ('refresh', 'refresh_htf'):
                    refresh.set()
                elif request.get('action') == 'ping':
                    queue.put_nowait(json.dumps({'type': 'pong', 'time': time.time()}))
            except (ValueError, TypeError, asyncio.QueueFull):
                await socket.close(code=1008, reason='Invalid request')
                break
    finally:
        subscriptions.pop(id(socket),None)
        if subscriptions:
            remember_requests()
        clients.discard(queue)
        if sender:
            sender.cancel()
            await asyncio.gather(sender, return_exceptions=True)


class HTTPHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path)
        if path.path in ('/api/calendar', '/api/music/metadata', '/api/music/resolve'):
            try:
                if path.path == '/api/calendar':
                    result = calendar_service.get()
                else:
                    url = parse_qs(path.query).get('url', [''])[0]
                    if len(url) > 2048:
                        raise ValueError('Link too long')
                    result = {'url': resolve_music_share(url)} if path.path.endswith('/resolve') else music_metadata(url)
                code = 200
            except ValueError as exc:
                result, code = {'error': str(exc)}, 400
            except Exception:
                result, code = {'error': 'Provider unavailable; try its full link'}, 502
            body = json.dumps(result).encode()
            self.send_response(code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == '/health':

            counts = {symbol: len(bars) for symbol, bars in dict(store.data['1m']).items()}
            body = json.dumps({**status, 'ws_port': WS_PORT, 'cached_1m': counts,
                'blocked_timeframes': {'6h':'TradingView Basic: custom intervals require upgraded plan','12h':'Requires custom interval entitlement'}, 'cache': {'mode':'ram', 'disk_backup':True, 'free_bytes':memory_available()},
                'history_loading':list(history_progress.values()),
                'coverage': {tf: {symbol: len(bars) for symbol, bars in values.items()} for tf, values in store.data.items()}}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, *_args):
        pass


async def save_loop():
    while True:
        await asyncio.sleep(20)
        try:
            await asyncio.to_thread(store.save, copy.deepcopy(store.data), copy.deepcopy(store.metadata))
        except OSError:
            logging.exception('Could not persist market data')


async def main():
    store.load()
    handler = partial(HTTPHandler, directory=str(ROOT.parent / 'frontend'))
    server = ThreadingHTTPServer(('127.0.0.1', HTTP_PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    tasks = []
    try:
        async with websockets.serve(frontend_ws_handler, '127.0.0.1', WS_PORT,
                                    max_size=8192, ping_interval=20, ping_timeout=15, close_timeout=2,
                                    origins=[None, f'http://localhost:{HTTP_PORT}', f'http://127.0.0.1:{HTTP_PORT}']):
            logging.info('Terminal http://localhost:%s · WebSocket %s', HTTP_PORT, WS_PORT)
            tasks.append(asyncio.create_task(save_loop()))
            if os.getenv('TERMINAL_OFFLINE') == '1':
                set_status('disconnected', 'Offline · dữ liệu đã lưu')
            else:
                if os.name == 'nt':
                    await asyncio.to_thread(subprocess.run, ['powershell', '-NoProfile',
                        '-ExecutionPolicy', 'Bypass', '-File', str(ROOT / 'launch_tv.ps1')],
                        creationflags=subprocess.CREATE_NO_WINDOW, timeout=30, check=False)
                tasks.append(asyncio.create_task(automatic_sources()))
            await asyncio.Event().wait()
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        await asyncio.to_thread(server.shutdown)
        server.server_close()
        store.save()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
