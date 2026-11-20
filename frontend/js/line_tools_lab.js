(async()=>{
  const $=id=>document.getElementById(id),host=$('lab-chart');
  const chart=LightweightCharts.createChart(host,{autoSize:true,layout:{background:{color:'#c2baae'},textColor:'#211f1d',fontFamily:'"Trebuchet MS", "Fira Sans", sans-serif'},timeScale:{timeVisible:true,rightOffset:15}});
  const series=chart.addSeries(LightweightCharts.CandlestickSeries,{upColor:'#e8e4dc',downColor:'#211f1d',borderColor:'#211f1d',wickColor:'#211f1d'});
  const tools=LightweightChartsLineToolsCore.createLineToolsPlugin(chart,series);
  tools.registerLineTool('Rectangle',LightweightChartsLineToolsRectangle.LineToolRectangle);
  tools.registerLineTool('FibRetracement',LightweightChartsLineToolsFibRetracement.LineToolFibRetracement);
  tools.registerLineTool('LongShortPosition',LightweightChartsLineToolsLongShortPosition.LineToolLongShortPosition);
  const report=text=>$('lab-report').textContent=text;
  let symbol=$('lab-symbol').value,bars=[],snapshots=new Map();
  const storageKey=()=> 'line_tools_lab_'+symbol;
  const save=()=>{const json=tools.exportLineTools();Workspace.write(storageKey(),JSON.parse(json));report(`Saved ${JSON.parse(json).length} drawings in preview.`);};
  tools.subscribeLineToolsAfterEdit(save);
  tools.subscribeLineToolsDoubleClick(({selectedLineTool})=>{$('lab-options').value=JSON.stringify(selectedLineTool,null,2);$('lab-options').closest('details').open=true;});
  const restore=()=>{tools.removeAllLineTools();const saved=Workspace.read(storageKey(),[]);if(!tools.importLineTools(JSON.stringify(saved)))throw Error('Plugin could not import the saved snapshot');};
  restore();
  for(const button of document.querySelectorAll('[data-tool]'))button.onclick=()=>{tools.addLineTool(button.dataset.tool,[],{});report('Click the chart to place points.');};
  $('lab-save').onclick=save;
  $('lab-roundtrip').onclick=()=>{
    const before=tools.exportLineTools(),expected=JSON.parse(before);
    const ok=tools.importLineTools(before),after=JSON.parse(tools.exportLineTools());
    const equal=ok&&expected.length===after.length&&expected.every(a=>after.some(b=>JSON.stringify(a)===JSON.stringify(b)));
    report(equal?`PASS: ${after.length} drawings preserved IDs/coordinates/options after export/import.`:'FAIL: export/import differs from snapshot; original preserved for inspection.');
  };
  $('lab-import').onclick=()=>{
    const id=$('lab-source').value,original=Workspace.read('drawings_'+id+'_'+symbol,Workspace.read('drawings_'+symbol,[]));
    const converted=LineToolsBridge.convert(original);
    Workspace.write('line_tools_lab_original_'+id+'_'+symbol,converted.originals);
    const ok=tools.importLineTools(JSON.stringify(converted.tools));
    const issues=LineToolsBridge.audit(converted.tools,JSON.parse(tools.exportLineTools()));
    report(`${ok?'Read':'Could not import'} ${converted.tools.length}/${original.length} drawings from ${id}/${symbol}.\n${[...converted.warnings,...issues].join('\n')}${issues.length?'':'\nConverted coordinates/options match the plugin snapshot.'}`);
  };
  $('lab-seed').onclick=()=>{
    if(bars.length<80)return report('Wait for at least 80 source bars before creating test drawings.');
    const a=bars.at(-75),b=bars.at(-40),c=bars.at(-12),range=Math.max(a.high-a.low,Math.abs(a.close-b.close),1);
    const base=[{id:'check-box',type:'box',p1:{time:a.time,price:a.close+range},p2:{time:b.time,price:a.close-range},middleLine:{enabled:false},text:'Rectangle test'},
      {id:'check-fib',type:'fib',p1:{time:b.time,price:b.low},p2:{time:c.time,price:c.high}},
      {id:'check-position',type:'position',p1:{time:b.time,price:b.close},p2:{time:c.time,price:b.close+range*2},riskReward:2}];
    const converted=LineToolsBridge.convert(base);tools.importLineTools(JSON.stringify(converted.tools));const issues=LineToolsBridge.audit(converted.tools,JSON.parse(tools.exportLineTools()));report(issues.length?issues.join('\n'):'Added 3 test drawings on source bars; coordinates/options match the adapter. Drag anchors, double-click for JSON, or test export/import.');
  };
  $('lab-symbol').onchange=()=>{save();symbol=$('lab-symbol').value;bars=snapshots.get(symbol)||[];series.setData(bars);chart.timeScale().fitContent();restore();};
  let socket,reconnectTimer=null;
  const scheduleReconnect=()=>{clearTimeout(reconnectTimer);reconnectTimer=setTimeout(connect,3000);};
  async function connect(){
    clearTimeout(reconnectTimer);
    try {const health=await(await fetch('/health')).json();const wsHost=location.hostname==='localhost'?'127.0.0.1':location.hostname;socket=new WebSocket(`ws://${wsHost}:${health.ws_port}`);
      socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.timeframe!=='1m'||!['history','tick'].includes(m.type))return;
        const incoming=m.type==='history'?m.bars:[m.bar],merged=[...(snapshots.get(m.symbol)||[]),...(incoming||[])],clean=MarketData.clean(merged);snapshots.set(m.symbol,clean);
        if(m.symbol===symbol){const initial=!bars.length;bars=clean;series.setData(bars);if(initial)chart.timeScale().fitContent();$('lab-status').textContent=`${symbol} · ${bars.length} 1m bars from bridge`;}
      };
      socket.onclose=()=>{$('lab-status').textContent='Disconnected · Received data retained';scheduleReconnect();};
    }catch(error){$('lab-status').textContent=error.message;scheduleReconnect();}
  }
  connect();window.addEventListener('pagehide',()=>{if(socket){socket.onclose=null;socket.close();}tools.destroy();chart.remove();},{once:true});
})().catch(error=>{document.getElementById('lab-report').textContent='Plugin error: '+error.message;console.error(error);});
