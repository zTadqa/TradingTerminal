"""Provider-owned calendar export and oEmbed metadata; no audio extraction."""
import json
import threading
import time
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode, urljoin, urlsplit
from email.utils import parsedate_to_datetime
from datetime import datetime

CALENDAR_URL = 'https://showmytrades.com/api/public/calendar/v1?impact=all&days=7'
CALENDAR_WEBSITE = 'https://showmytrades.com/tools/economic-calendar'
CALENDAR_REFRESH_SECONDS = 900


def normalize_events(values):
    if not isinstance(values, list):
        raise ValueError('Invalid calendar events')
    result = []
    for value in values[:3000]:
        if not isinstance(value, dict) or not isinstance(value.get('title'), str):
            continue
        date = value.get('time')
        try:
            parsed = datetime.fromisoformat(date.replace('Z', '+00:00'))
            if parsed.tzinfo is None:
                continue
            timestamp = parsed.timestamp()
        except (ValueError, TypeError, AttributeError):
            continue
        result.append({'title': value['title'][:250], 'currency': str(value.get('currency', ''))[:8].upper(),
                       'time': timestamp, 'impact': str(value.get('impact', ''))[:24].title(),
                       'tentative': value.get('status') == 'tentative',
                       **{key: ('' if value.get(key) is None else str(value[key]))[:100] for key in ('actual', 'forecast', 'previous')}})
    return sorted(result, key=lambda value: value['time'])


class EconomicCalendar:
    def __init__(self, fetch=None, clock=time.time):
        self.fetch = fetch or self._fetch
        self.clock = clock
        self.lock = threading.Lock()
        self.events = []
        self.checked = None
        self.updated = None
        self.error = None
        self.next_check = None

    @staticmethod
    def _fetch():
        with urlopen(Request(CALENDAR_URL, headers={'Accept': 'application/json'}), timeout=12) as response:
            payload = json.loads(response.read(2_000_000))
        if not isinstance(payload, dict):
            raise ValueError('Invalid calendar response')
        return payload

    def get(self):
        with self.lock:
            now = self.clock()
            if self.next_check is None or now >= self.next_check:
                self.checked = now
                self.next_check = now + CALENDAR_REFRESH_SECONDS
                try:
                    payload = self.fetch()
                    events = normalize_events(payload.get('events'))
                    generated = datetime.fromisoformat(payload['generated_at'].replace('Z', '+00:00'))
                    if generated.tzinfo is None:
                        raise ValueError('Calendar update time has no UTC offset')
                    self.events = events
                    self.updated = generated.timestamp()
                    self.error = None
                except Exception as exc:
                    self.error = 'Calendar feed unavailable: ' + str(exc)[:180]
                    if isinstance(exc, HTTPError) and exc.code in (403, 429, 503):
                        retry = exc.headers.get('Retry-After') if exc.headers else None
                        if retry:
                            try:
                                after = now + int(retry) if retry.isdecimal() else parsedate_to_datetime(retry).timestamp()
                                self.next_check = max(self.next_check, after)
                            except (TypeError, ValueError, OverflowError):
                                pass
            return {'source': 'ShowMyTrades', 'url': CALENDAR_URL, 'website': CALENDAR_WEBSITE,
                    'events': self.events, 'checked_at': self.checked, 'updated_at': self.updated,
                    'error': self.error, 'next_check_at': self.next_check,
                    'realtime': False, 'actual_available': any(e['actual'] for e in self.events),
                    'notice': 'Calendar feed cached for 15 minutes. Actual values appear when supplied.'}


_SHARE_HOSTS = {
    'vm.tiktok.com': {'tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'},
    'vt.tiktok.com': {'tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'},
    'on.soundcloud.com': {'soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com', 'on.soundcloud.com'},
    'spotify.link': {'open.spotify.com', 'spotify.link'},
}


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def resolve_music_share(url, opener=None):
    """Resolve official short links without following redirects outside that provider."""
    allowed = _SHARE_HOSTS.get(urlsplit(url).hostname, set())
    open_request = opener or build_opener(_NoRedirect()).open
    for _ in range(5):
        parsed = urlsplit(url)
        if (len(url) > 2048 or parsed.scheme != 'https' or parsed.hostname not in allowed
                or parsed.username is not None or parsed.password is not None or parsed.port not in (None, 443)):
            raise ValueError('Share link must stay on its official provider')
        if parsed.hostname not in _SHARE_HOSTS:
            return url
        try:
            with open_request(Request(url), timeout=3):
                break
        except HTTPError as exc:
            try:
                location = exc.headers.get('Location') if exc.headers else None
                if exc.code not in (301, 302, 303, 307, 308) or not location:
                    raise ValueError('Provider could not resolve this share link') from exc
                url = urljoin(url, location)
            finally:
                exc.close()
    raise ValueError('Paste the full link from the provider')


# Only known provider oEmbed endpoints; never fetch a user-supplied host.
def metadata_endpoint(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.username or parsed.password:
        raise ValueError('Use an official HTTPS provider link')
    host = parsed.hostname
    endpoints = {'www.youtube.com': 'https://www.youtube.com/oembed', 'youtube.com': 'https://www.youtube.com/oembed',
                 'youtu.be': 'https://www.youtube.com/oembed', 'open.spotify.com': 'https://open.spotify.com/oembed',
                 'soundcloud.com': 'https://soundcloud.com/oembed', 'www.soundcloud.com': 'https://soundcloud.com/oembed',
                 'www.tiktok.com': 'https://www.tiktok.com/oembed', 'tiktok.com': 'https://www.tiktok.com/oembed'}
    if host not in endpoints or parsed.port not in (None, 443):
        raise ValueError('Unsupported music provider')
    return endpoints[host] + '?' + urlencode({'url': url, 'format': 'json'})


_metadata = {}
_metadata_lock = threading.Lock()


def music_metadata(url):
    endpoint = metadata_endpoint(url)
    with _metadata_lock:
        cached = _metadata.get(endpoint)
        if cached and time.time()-cached[0] < 3600:
            return cached[1]
    with urlopen(Request(endpoint, headers={'Accept': 'application/json'}), timeout=10) as response:
        value = json.loads(response.read(300_000))
    result = {key: str(value.get(key, ''))[:2000] for key in ('title', 'author_name', 'thumbnail_url')}
    if not result['thumbnail_url'].startswith('https://'):
        result['thumbnail_url'] = ''
    with _metadata_lock:
        if len(_metadata) > 128:
            _metadata.clear()
        _metadata[endpoint] = (time.time(), result)
    return result
