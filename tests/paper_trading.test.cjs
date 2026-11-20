const test=require('node:test'),assert=require('node:assert/strict');
const Paper=require('../frontend/js/paper_trading.js');
const meta={pointValue:20,tickSize:.25};
function setup(balance=100000){const p=new Paper();p.create('Demo',balance,10);p.tick('NQ1!',100);return p;}
const order=(side='buy',qty=1,extra={})=>({symbol:'NQ1!',side,type:'market',qty,...extra});
test('scale in averages price, opposite trades reduce then reverse one symbol',()=>{const p=setup();p.place(order('buy',2),meta);p.tick('NQ1!',102);p.place(order('buy',2),meta);assert.equal(p.account.positions.length,1);assert.equal(p.account.positions[0].qty,4);assert.equal(p.account.positions[0].price,101);p.place(order('sell',5),meta);assert.equal(p.account.positions.length,1);assert.equal(p.account.positions[0].side,'sell');assert.equal(p.account.positions[0].qty,1);assert.equal(p.account.balance,100080);assert.equal(p.summary().realized,80);});
test('a reducing trade works even when equity is below initial balance',()=>{const p=setup(200);p.place(order(),meta);p.tick('NQ1!',99);p.place(order('sell'),meta);assert.equal(p.account.positions.length,0);assert.equal(p.account.balance,180);});
test('large reversal executes atomically without margin rejection',()=>{const p=setup(1000);p.place(order(),meta);p.tick('NQ1!',90);p.place(order('sell',100),meta);assert.equal(p.account.positions.length,1);assert.equal(p.account.positions[0].side,'sell');assert.equal(p.account.positions[0].qty,99);assert.equal(p.account.balance,800);});
test('marketable limit fills immediately at the observed better last price and validates SL against fill quote',()=>{
  const p=setup();
  assert.throws(()=>p.place(order('buy',1,{type:'limit',price:102,sl:101}),meta));
  assert.equal(p.account.positions.length,0);
  p.place(order('buy',1,{type:'limit',price:101,sl:98}),meta);
  assert.equal(p.account.orders.length,0);
  assert.equal(p.account.positions[0].price,100);
});
test('PaperPanel guard blocks Live chart orders from routing into Replay when Replay scope is Current chart',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const ctx=vm.createContext({document:{getElementById:()=>null,addEventListener(){}}});
  vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.PaperPanel=PaperPanel;',ctx);
  const panel=Object.assign(Object.create(ctx.PaperPanel.prototype),{
    isReplay:()=>true,
    charts:[{symbol:'NQ1!',replayMode:true}],
    paper:setup()
  });
  assert.throws(()=>panel.guard('NQ1!',{symbol:'NQ1!',replayMode:false}),/Live/);
  assert.doesNotThrow(()=>panel.guard('NQ1!',{symbol:'NQ1!',replayMode:true}));
});
test('stop gaps fill at the observed last and cancelled orders remain in the journal',()=>{const p=setup();p.place(order('buy',1,{type:'stop',price:101}),meta);p.tick('NQ1!',103);assert.equal(p.account.positions[0].price,103);const item=p.place(order('buy',1,{type:'limit',price:99}),meta);p.cancel(item.id);assert.equal(p.account.history.at(-1).event,'cancelled');assert.equal(p.account.orders.length,0);});
test('tick size, stop side and bracket side validate before changing the account',()=>{const p=setup();for(const item of [order('buy',1,{type:'limit',price:99.1}),order('buy',1,{type:'stop',price:99}),order('buy',1,{sl:101}),order('sell',1,{tp:101})])assert.throws(()=>p.place(item,meta));assert.equal(p.account.positions.length,0);assert.equal(p.account.orders.length,0);});
test('partial close realizes only closed size',()=>{const p=setup();p.place(order('buy',4),meta);const item=p.account.positions[0];p.tick('NQ1!',102);p.close(item.id,'manual',1);assert.equal(p.account.balance,100040);assert.equal(item.qty,3);assert.equal(p.account.history.at(-1).qty,1);assert.throws(()=>p.close(item.id,'manual',4));});
test('an existing long can move stop above entry but below live price',()=>{const p=setup();p.place(order('buy',1,{sl:95,tp:120}),meta);const item=p.account.positions[0];p.tick('NQ1!',110);p.amendPosition(item.id,{sl:105});assert.equal(item.sl,105);assert.equal(item.price,100);assert.throws(()=>p.amendPosition(item.id,{sl:111}));p.tick('NQ1!',104);assert.equal(p.account.positions.length,0);assert.equal(p.account.balance,100080);});
test('amending a pending limit is persistent and can make it immediately executable',()=>{const p=setup();const item=p.place(order('buy',1,{type:'limit',price:95,sl:90,tp:110}),meta);p.amendOrder(item.id,{qty:2,price:100});assert.equal(p.account.orders.length,0);assert.equal(p.account.positions[0].qty,2);assert.equal(p.account.positions[0].price,100);assert.ok(p.account.history.some(h=>h.event==='modified'));});
test('failed persistence rolls back placement, closing, account selection and cancellation',()=>{const p=setup();p.place(order(),meta);const id=p.account.positions[0].id;const before=structuredClone(p.state);p.persist=()=>false;assert.throws(()=>p.close(id),/lưu/);assert.deepEqual(p.state,before);assert.throws(()=>p.place(order('buy'),meta),/lưu/);assert.deepEqual(p.state,before);});
test('background pending fills work across accounts and keep the selected account unchanged',()=>{const p=setup(300);const a=p.account;p.place(order('buy',2,{type:'limit',price:99}),meta);const b=p.create('Second',10000,0);p.tick('NQ1!',98);assert.equal(a.orders.length,0);assert.equal(a.positions.length,1);assert.equal(a.history.at(-1).event,'filled');assert.equal(p.state.active,b.id);});
test('idle price samples never rewrite storage and stale quotes cannot fill or close',()=>{let saved=0;const p=new Paper(undefined,()=>{saved++;});p.create('A',10000,0);const count=saved;p.tick('NQ1!',100);p.tick('NQ1!',101);assert.equal(saved,count);p.quotes.get('NQ1!').received=Date.now()-6000;assert.throws(()=>p.place(order(),meta),/live/);p.tick('NQ1!',NaN);assert.equal(p.quotes.get('NQ1!').price,101);});
test('multiple legacy lots and saved account history are retained during reconstruction',()=>{const p=setup();p.account.positions=[{id:'a',symbol:'NQ1!',side:'buy',qty:1,price:100,pointValue:20,margin:200},{id:'b',symbol:'NQ1!',side:'sell',qty:1,price:110,pointValue:20,margin:220}];const before=structuredClone(p.state),restored=new Paper(before);assert.equal(restored.account.positions.length,2);assert.equal(restored.account.positions[1].price,110);});
test('checkMargin allows orders without margin blocking when account is valid',()=>{
  const p=setup(300);
  assert.doesNotThrow(()=>p.checkMargin(order('buy',2),meta,100));
  assert.doesNotThrow(()=>p.checkMargin(order('buy',2,{type:'limit',price:95}),meta,100));
  assert.doesNotThrow(()=>p.checkMargin(order('buy',2,{type:'stop',price:105}),meta,100));
  assert.equal(p.usedMargin(),0);
});
test('amendPosition can clear SL or TP individually without losing the other',()=>{
  const p=setup();
  p.place(order('buy',1,{sl:95,tp:110}),meta);
  const pos=p.account.positions[0];
  p.amendPosition(pos.id,{sl:null});
  assert.equal(pos.sl,null);
  assert.equal(pos.tp,110);
  p.amendPosition(pos.id,{tp:null});
  assert.equal(pos.tp,null);
});
test('TopstepX PaperChartOrders draws zones, right-aligned badges, execution arrows, 1-click close and deletes SL/TP/orders via ×',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const makeNode=(tag='div')=>({tagName:tag.toUpperCase(),children:[],style:{},dataset:{},attributes:{},hidden:false,
    setAttribute(k,v){this.attributes[k]=String(v);},appendChild(x){this.children.push(x);return x;},remove(){}});
  const fakeDoc={createElement:tag=>makeNode(tag),getElementById:id=>id==='left-sidebar'?{getBoundingClientRect:()=>({left:0,right:1000,top:350,bottom:400,width:1000,height:50})}:null};
  const ctx=vm.createContext({document:fakeDoc,ChartContextMenu:{formatPrice:p=>Number(p).toFixed(2)},TerminalTime:{end:b=>b.time+60}});
  vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.PaperChartOrders=PaperChartOrders;',ctx);
  const paper=setup();
  paper.now=()=>120000;
  paper.place(order('buy',2,{sl:95,tp:115}),meta);
  const pending=paper.place(order('buy',1,{type:'limit',price:90}),meta);
  const fills=[],texts=[],strokes=[],paths=[];let path=[];
  const canvasCtx={save(){},restore(){},beginPath(){path=[];},rect(){},clip(){},setLineDash(){},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},
    stroke(){strokes.push(this._stroke);paths.push({color:this._stroke,points:path.slice()});},strokeRect(){},strokeText(){},
    measureText(t){return {width:String(t).length*(parseFloat(this.font.match(/[\d.]+px/)?.[0])||11)*.5};},
    set fillStyle(v){this._fill=v;},get fillStyle(){return this._fill;},
    set strokeStyle(v){this._stroke=v;},get strokeStyle(){return this._stroke;},
    fillRect(x,y,w,h){fills.push({fill:this._fill,x,y,w,h});},
    fill(){fills.push({fill:this._fill});},
    fillText(t,x){texts.push({t:String(t),x});}};
  const chart={symbol:'NQ1!',plotBottom:400,replayMode:true,replayClock:120,bars:[{time:0,low:98,high:102,close:100},{time:60,low:99,high:103,close:100}],metadata:meta,displaySessionMetadata:()=>meta,
    appearance:{bg:'#050505',extendedLines:false,bracketPnl:true,oneClick:true,executionMarks:true,executionLabels:true,alignment:'Left'},
    container:{appendChild(){},getBoundingClientRect:()=>({left:0,top:0,right:800,bottom:420})},
    chart:{priceScale:()=>({width:()=>70}),timeScale:()=>({timeToCoordinate:()=>100,getVisibleLogicalRange:()=>({from:0,to:10})})},
    series:{priceToCoordinate:p=>300-(p-85)*10},renderDrawings(){}};
  let amended=null,cancelled=null,closeDialogs=0;
  const origAmend=paper.amendPosition.bind(paper),origCancel=paper.cancel.bind(paper);
  paper.amendPosition=(id,ch)=>{amended=[id,ch];return origAmend(id,ch);};
  paper.cancel=id=>{cancelled=id;return origCancel(id);};
  const panel={paper,isReplay:()=>true,money:v=>'$'+v.toFixed(2),price:v=>String(v),
    guard(){},action(fn){fn();},edit(){},closeDialog(){closeDialogs++;}};
  const overlay=new ctx.PaperChartOrders(panel,chart);
  overlay.draw(canvasCtx,{width:800,height:420});
  assert.equal(fills.some(f=>f.fill==='rgba(255,27,27,.22)'||f.fill==='rgba(0,200,150,.28)'),false);
  const limitText=texts.find(x=>x.t.includes('Limit Buy'));
  const slText=texts.find(x=>x.t.startsWith('~ -'));
  const entryText=texts.find(x=>x.t==='$0.00');
  assert.ok(limitText && limitText.x>400);
  assert.ok(entryText && slText);
  assert.equal(entryText.x,slText.x,'entry and brackets align in the same compact PnL column');
  assert.ok(texts.some(x=>x.t.startsWith('~ ')));
  assert.ok(strokes.includes('#2962ff'));
  for(const color of ['#20a860','#e0301e','rgba(222,227,234,.85)'])assert.ok(paths.some(p=>p.color===color&&p.points.length===2&&p.points[0][0]===0&&p.points[1][0]===730),'position/bracket line crosses entire chart: '+color);
  assert.ok(texts.some(x=>x.t==='+ 2 @ 100.00'));
  assert.equal(overlay.execMarks.length,1);
  const m=overlay.execMarks[0];
  let redrawn=0;chart.renderDrawings=()=>{redrawn++;};
  overlay.onHoverMove({clientX:m.x,clientY:m.tipY});
  assert.equal(overlay.hoverExec,m.id);
  assert.equal(redrawn,1);
  fills.length=0;
  overlay.draw(canvasCtx,{width:800,height:420});
  assert.ok(fills.some(f=>f.fill==='rgba(41,98,255,.22)'));
  const posId=paper.account.positions[0].id;
  const entryHit=overlay.buttons.get(posId+':entry');
  assert.equal(entryHit.style.height,'16px');
  assert.equal(entryHit.style.width,'66px');
  assert.ok(parseFloat(entryHit.style.left)+66<730,'horizontal dock cannot push entry controls out of chart');
  overlay.start({button:0,preventDefault(){},stopPropagation(){}},posId,'delsl');
  assert.equal(amended[0],posId);
  assert.equal(amended[1].sl,null);
  assert.equal(paper.account.positions[0].sl,null);
  overlay.start({button:0,preventDefault(){},stopPropagation(){}},pending.id,'cancel');
  assert.equal(cancelled,pending.id);
  assert.equal(paper.account.orders.length,0);
  overlay.start({button:0,preventDefault(){},stopPropagation(){}},posId,'close');
  assert.equal(closeDialogs,0);
  assert.equal(paper.account.positions.length,0);
});

test('Paper-Entry-UI v11: dragging from entry PnL box sets TP/SL, locks direction, and dragging back to entry line cancels/deletes', () => {
  const fs=require('node:fs'),vm=require('node:vm');
  const makeNode=(tag='div')=>({tagName:tag.toUpperCase(),children:[],style:{},dataset:{},attributes:{},hidden:false,
    setAttribute(k,v){this.attributes[k]=String(v);},appendChild(x){this.children.push(x);return x;},remove(){}});
  const fakeDoc={createElement:tag=>makeNode(tag),getElementById:()=>null};
  const ctx=vm.createContext({document:fakeDoc,ChartContextMenu:{formatPrice:p=>Number(p).toFixed(2)},TerminalTime:{end:b=>b.time+60}});
  vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.PaperChartOrders=PaperChartOrders;',ctx);
  const paper=setup();
  paper.place(order('buy',2),meta);
  let amended=null;
  const origAmend=paper.amendPosition.bind(paper);
  paper.amendPosition=(id,ch)=>{amended=[id,ch];return origAmend(id,ch);};
  const chart={symbol:'NQ1!',plotBottom:400,replayMode:false,bars:[{time:0,low:98,high:102,close:100}],metadata:meta,
    appearance:{bg:'#050505',bracketPnl:true,oneClick:true},
    container:{appendChild(){},getBoundingClientRect:()=>({left:0,top:0,right:800,bottom:420})},
    chart:{priceScale:()=>({width:()=>70}),timeScale:()=>({timeToCoordinate:()=>100,getVisibleLogicalRange:()=>({from:0,to:10})})},
    series:{priceToCoordinate:p=>300-(p-85)*10},coordinateToPrice:y=>85+(300-y)/10,renderDrawings(){}};
  const panel={paper,isReplay:()=>false,money:v=>'$'+v.toFixed(2),price:v=>String(v),
    guard(){},action(fn){fn();},edit(){},closeDialog(){}};
  const overlay=new ctx.PaperChartOrders(panel,chart);
  const posId=paper.account.positions[0].id;

  // 1. Drag up from entry PnL (Long) -> creates TP
  overlay.start({button:0,clientY:150,preventDefault(){},stopPropagation(){}},posId,'entry');
  assert.equal(overlay.drag.mode,'create');
  overlay.move({clientY:100,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.targetKind,'tp');
  assert.equal(overlay.drag.price,105);

  // 2. Lock direction: moving down past entry does not switch to SL
  overlay.move({clientY:200,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.price,null);

  // Move back up -> TP reappears
  overlay.move({clientY:110,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.price,104);
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(amended[0],posId);
  assert.equal(amended[1].tp,104);
  assert.equal(paper.account.positions[0].tp,104);

  // 3. Move existing TP: drag back to coincide with entry line (< 1 tick) -> DELETES TP
  overlay.start({button:0,clientY:110,preventDefault(){},stopPropagation(){}},posId,'tp');
  assert.equal(overlay.drag.mode,'move');
  overlay.move({clientY:150,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.canceled,true);
  assert.equal(overlay.drag.price,null);
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(amended[1].tp,null);
  assert.equal(paper.account.positions[0].tp,null);

  // 4. Drag down from entry PnL (Long) -> creates SL
  overlay.start({button:0,clientY:150,preventDefault(){},stopPropagation(){}},posId,'entry');
  overlay.move({clientY:200,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.targetKind,'sl');
  assert.equal(overlay.drag.price,95);
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(amended[1].sl,95);
  assert.equal(paper.account.positions[0].sl,95);

  // Start near the bottom of PnL: line follows pointer DELTA, not the click's price.
  const pos=paper.account.positions[0];
  overlay.start({button:0,clientY:161,preventDefault(){},stopPropagation(){}},posId,'entry');
  overlay.move({clientY:141,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.price,102);
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(pos.tp,102);
  // Reusing an existing bracket and returning to the entry line clears it.
  overlay.start({button:0,clientY:161,preventDefault(){},stopPropagation(){}},posId,'entry');
  overlay.move({clientY:121,preventDefault(){},stopPropagation(){}});
  overlay.move({clientY:161,preventDefault(){},stopPropagation(){}});
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(pos.tp,null);
  assert.equal(pos.sl,95);

  // Short: up means SL, down means TP, with direction locked for the gesture.
  pos.side='sell';pos.sl=null;
  overlay.start({button:0,clientY:161,preventDefault(){},stopPropagation(){}},posId,'entry');
  overlay.move({clientY:141,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.targetKind,'sl');assert.equal(overlay.drag.price,102);
  overlay.move({clientY:181,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.price,null);assert.equal(overlay.drag.targetKind,'sl');
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(pos.tp,null);assert.equal(pos.sl,null);
  overlay.start({button:0,clientY:161,preventDefault(){},stopPropagation(){}},posId,'entry');
  overlay.move({clientY:181,preventDefault(){},stopPropagation(){}});
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(pos.tp,98);
  // Existing TP clicked off-center still reaches entry after exactly 20px.
  overlay.start({button:0,clientY:175,preventDefault(){},stopPropagation(){}},posId,'tp');
  overlay.move({clientY:155,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.canceled,true);
  overlay.move({clientY:195,preventDefault(){},stopPropagation(){}});
  assert.equal(overlay.drag.canceled,true,'deleted bracket cannot reappear in the same move gesture');
  overlay.end({preventDefault(){},stopPropagation(){}});
  assert.equal(pos.tp,null);
});

test('paper price tags use native axis labels, update in place and remove stale labels',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.PaperChartOrders=PaperChartOrders;',context);
  const created=[],removed=[],updated=[];
  const series={createPriceLine(options){const line={applyOptions(next){updated.push(next);}};created.push({options,line});return line;},removePriceLine(line){removed.push(line);}};
  const overlay=Object.assign(Object.create(context.PaperChartOrders.prototype),{chart:{series},axisTags:new Map(),visibleAxisTags:new Set()});
  // No canvas is needed: the same native renderer as the price ticks draws these labels.
  overlay.drawAxisTag(null,500,65,400,150,7433.5,'#e0301e',null,'#fff',true,'position:sl');
  assert.equal(created.length,1);assert.equal(created[0].options.price,7433.5);
  assert.equal(created[0].options.lineVisible,false);assert.equal(created[0].options.axisLabelVisible,true);
  overlay.drawAxisTag(null,500,65,400,150,7433.5,'#e0301e',null,'#fff',true,'position:sl');
  assert.equal(created.length,1);assert.equal(updated.length,0,'unchanged draws must not request another chart update');
  overlay.drawAxisTag(null,500,65,400,160,7434,'#e0301e',null,'#fff',true,'position:sl');
  assert.equal(updated.length,1);assert.equal(updated[0].price,7434);
  overlay.visibleAxisTags.clear();overlay.pruneAxisTags();
  assert.equal(removed.length,1);assert.equal(overlay.axisTags.size,0);
});

test('one-click placement skips confirmation only when enabled and still validates orders',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),context=vm.createContext({});
  vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.PaperPanel=PaperPanel;',context);
  const paper=setup(),chart={metadata:meta,appearance:{oneClick:false,projectOrder:false}};let confirmations=0;
  const panel=Object.assign(Object.create(context.PaperPanel.prototype),{paper,guard(){},unlockExecutionAudio(){},toast(){},confirmOrder(){confirmations++;}});
  panel.placeFromChart(chart,order());
  assert.equal(confirmations,1);assert.equal(paper.account.positions.length,0,'confirmation mode cannot place before confirming');
  chart.appearance.oneClick=true;
  panel.placeFromChart(chart,order());
  assert.equal(confirmations,1);assert.equal(paper.account.positions.length,1);assert.equal(paper.account.positions[0].qty,1);
  assert.throws(()=>panel.placeFromChart(chart,order('buy',0)));
  assert.equal(paper.account.positions[0].qty,1,'invalid size cannot change the account in one-click mode');
  chart.appearance.projectOrder=true;
  panel.placeFromChart(chart,order());
  assert.equal(confirmations,2,'projection mode continues to require confirmation');
});

test('entry execution label shows signed short quantity and grouped fill price without changing fills',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const sandbox=vm.createContext({TerminalTime:{end:b=>b.time+60},ChartContextMenu:{formatPrice:p=>Number(p).toFixed(2)}});
 vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.Orders=PaperChartOrders;',sandbox);
 const overlay=Object.create(sandbox.Orders.prototype),texts=[];
 const event={id:'short-fill',event:'filled',symbol:'YM1!',side:'sell',qty:5,price:27199.5,at:60000};
 overlay.panel={paper:{account:{history:[event]}}};overlay.chart={symbol:'YM1!',replayMode:true,replayClock:120,bars:[{time:60,low:27190,high:27205}],appearance:{bg:'#bdbdbd'},chart:{timeScale:()=>({timeToCoordinate:()=>200})},series:{priceToCoordinate:()=>100}};
 const canvas={save(){},restore(){},beginPath(){},rect(){},clip(){},moveTo(){},lineTo(){},stroke(){},strokeText(){},fillText:t=>texts.push(t)};
 overlay.drawExecutions(canvas,600,400,{executionMarks:true,executionLabels:true});
 assert.deepEqual(texts,['- 5 @ 27,199.50']);assert.equal(overlay.execMarks[0].buy,false);assert.equal(overlay.execMarks[0].color,'#f23645');assert.equal(Math.abs(overlay.execMarks[0].tailY-overlay.execMarks[0].tipY),18);assert.equal(event.price,27199.5);assert.equal(event.qty,5);
});

test('execution artwork uses regular unoutlined labels and theme colors for entries and exits',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const colors={'--text':'#123456','--accent':'#2468ac','--trade-sell-bg':'#b35779'};
 const sandbox=vm.createContext({document:{documentElement:{}},getComputedStyle:()=>({getPropertyValue:k=>colors[k]||''}),TerminalTime:{end:b=>b.time+60},ChartContextMenu:{formatPrice:p=>Number(p).toFixed(2)}});
 vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.Orders=PaperChartOrders;',sandbox);
 const overlay=Object.create(sandbox.Orders.prototype),texts=[],strokes=[];
 overlay.panel={paper:{account:{history:[{id:'entry',event:'filled',symbol:'YM1!',side:'sell',qty:15,price:27741.25,at:60000},{id:'exit',event:'closed',reason:'manual',symbol:'YM1!',side:'sell',qty:15,exit:27718.5,at:60000}]}}};
 overlay.chart={symbol:'YM1!',replayMode:true,replayClock:120,bars:[{time:60,low:27710,high:27750}],appearance:{bg:'#bdbdbd'},chart:{timeScale:()=>({timeToCoordinate:()=>200})},series:{priceToCoordinate:()=>100}};
 const canvas={save(){},restore(){},beginPath(){},rect(){},clip(){},moveTo(){},lineTo(){},stroke(){strokes.push([this.strokeStyle,this.lineWidth])},strokeText(){throw Error('Labels must not have an outline')},fillText(t){texts.push({text:t,font:this.font,color:this.fillStyle})}};
 overlay.drawExecutions(canvas,600,400,{executionMarks:true,executionLabels:true});
 assert.deepEqual(texts.map(t=>t.text),['- 15 @ 27,741.25','+ 15 @ 27,718.50']);
 assert(texts.every(t=>t.font==='400 12px Arial, Helvetica, sans-serif'&&t.color==='#123456'));
 assert.deepEqual(strokes,[['#b35779',1.35],['#2468ac',1.35]]);
});

test('execution labels avoid candle wicks, other labels and chart edges without moving arrows',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),sandbox=vm.createContext({});
 vm.runInContext(fs.readFileSync('frontend/js/paper_panel.js','utf8')+';this.Orders=PaperChartOrders;',sandbox);
 const place=sandbox.Orders.executionLabelBox;
 const obstacles=[{left:135,right:145,top:30,bottom:220},{left:160,right:170,top:70,bottom:230},{left:195,right:205,top:90,bottom:240}];
 const a=place(170,140,112,16,400,300,obstacles,1);
 assert(a);const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 assert(obstacles.every(o=>!overlap(a,o)),'label clears candle high/low extents');
 const b=place(170,140,112,16,400,300,[...obstacles,a],1);
 assert(b);assert(!overlap(a,b),'multiple execution labels do not overlap');
 for(const x of [0,399]){const box=place(x,3,112,16,400,300,[], -1);assert(box.left>=4&&box.right<=396&&box.top>=4&&box.bottom<=296);}
 assert.equal(place(100,100,112,16,400,300,[{left:0,right:400,top:0,bottom:300}],1),null,'no forced overlap when the viewport has no room');
});
