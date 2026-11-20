const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
let now=130500;
const c=vm.createContext({Intl,Date:class extends Date{static now(){return now;}},document:{body:{classList:{contains:()=>false}}},matchMedia:()=>({matches:false}),MarketData:{durations:{}}});
vm.runInContext(fs.readFileSync('frontend/js/chart_engine.js','utf8')+';this.Engine=ChartEngine;',c);
const top=(desired,h,max,r)=>c.Engine.priceLabelTop(desired,h,max,r);
test('current price keeps its actual position after paper tags clear',()=>{assert.equal(top(88,24,300,[]),88);});
test('current price moves above an overlapping PnL tag with a clear gap',()=>{assert.equal(top(88,24,300,[{top:90,bottom:110}]),62);});
test('current price moves down when an overlapping tag touches the top edge',()=>{assert.equal(top(0,24,300,[{top:0,bottom:20}]),24);});
test('current price moves up when an overlapping tag touches the bottom edge',()=>{assert.equal(top(276,24,300,[{top:280,bottom:300}]),252);});
test('current price avoids all clustered entry and bracket tags',()=>{const r=[{top:85,bottom:110},{top:112,bottom:140},{top:58,bottom:80}];const y=top(90,24,300,r);assert.equal(y,144);for(const b of r)assert.ok(y+24<=b.top-4||y>=b.bottom+4);});
function countdownEngine(){
 const arcs=Array.from({length:2},()=>({style:{},animations:[],getAnimations(){return this.animations;},animate(frames,options){const a={frames,options,cancelled:false,cancel(){this.cancelled=true;}};this.animations=[a];return a;}})),attrs=new Map();
 const ring={toggleAttribute:(k,v)=>attrs.set(k,v),querySelectorAll:()=>arcs};
 const engine=Object.assign(Object.create(c.Engine.prototype),{countdownLabel:{querySelector:()=>ring},replayMode:false});
 return {engine,arcs,attrs};
}
test('outline interpolates fractional real time and cancels stale animations at rollover',()=>{
 const h=countdownEngine();now=130500;h.engine.updateCountdownArc(30,60,100,false);
 const a=h.arcs[0].animations[0];assert.equal(a.options.duration,29500);assert.equal(a.options.easing,'linear');assert.equal(a.frames[1].strokeDashoffset,'-1');
 assert.ok(Math.abs(Number(h.arcs[0].style.strokeDashoffset)+(1-29.5/60))<1e-9);
 now=160500;h.engine.updateCountdownArc(60,60,160,false);assert.equal(a.cancelled,true);assert.equal(h.arcs[0].animations[0].options.duration,59500);
});
test('replay countdown clamps to its own clock and hidden rings do not animate',()=>{
 const h=countdownEngine();h.engine.replayMode=true;h.engine.updateCountdownArc(1800,3600,100,false);
 assert.equal(h.arcs[0].style.strokeDashoffset,'-0.5');assert.equal(h.arcs[0].animations.length,0);
 h.engine.updateCountdownArc(0,3600,100,true);assert.equal(h.arcs[0].style.strokeDashoffset,'-1');assert.equal(h.attrs.get('hidden'),true);
});
test('current-price dotted line skips overlapping position badges and merges covered spans',()=>{
 const segments=c.Engine.priceLineSegments(20,350,100,[{left:100,right:150,top:90,bottom:110},{left:140,right:190,top:90,bottom:110},{left:220,right:250,top:150,bottom:170}]);
 assert.deepEqual(JSON.parse(JSON.stringify(segments)),[[20,97],[193,350]]);
 assert.deepEqual(JSON.parse(JSON.stringify(c.Engine.priceLineSegments(20,350,200,[]))),[[20,350]]);
});
test('displaced-price connector uses axis gutter, avoids close button, and hides overlapping dot',()=>{
 const make=()=>({style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}}),line=make(),link=make(),dot=make();
 const tail={setAttribute(){},toggleAttribute(){},querySelector:s=>s==='.tail-line'?line:s==='.tail-link'?link:dot};
 const e=Object.assign({},{priceTail:tail,countdownLabel:{offsetLeft:300,offsetTop:140,offsetHeight:24},appearance:{symbolLine:'Value and line'},container:{clientWidth:400},plotBottom:300,bars:[{time:60}],chart:{timeScale:()=>({timeToCoordinate:()=>50}),priceScale:()=>({width:()=>65})},paperOverlay:{priceBadgeBounds:[{left:230,right:310,top:90,bottom:110}],axisLabelBounds:[{top:90,bottom:110}]}});
 c.Engine.prototype.positionPriceTail.call(e,100,152);assert.equal(link.attrs.x1,333);assert.equal(link.attrs.y2,140);assert.equal(dot.style.display,'none');assert.equal(line.attrs.d,'M55 100H227M313 100H333');
});
