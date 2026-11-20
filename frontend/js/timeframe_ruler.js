/* Directional ruler marker; chart/timeframe events remain owned by the app. */
(()=>{
 const group=document.querySelector('#topbar .timeframe-group'),fav=document.getElementById('timeframe-favourites');if(!group||!fav)return;
 const make=cls=>{const e=document.createElement('i');e.className=cls;e.setAttribute('aria-hidden','true');group.append(e);return e};
 const head=make('tf-ruler-head'),tails=Array.from({length:7},()=>make('tf-ruler-tail'));
 let x=null,target=null,from=0,start=0,frame=0,y=0,queued=0,headHeight=11,fromHeight=11;
 const duration=460,delay=28;
 const ease=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
 const at=t=>from+(target-from)*ease((t-start)/duration);
 function paint(e,px,h,opacity){e.style.transform=`translate3d(${px}px,${y-h}px,0)`;e.style.height=h+'px';e.style.opacity=String(opacity)}
 function settle(){cancelAnimationFrame(frame);frame=0;x=target;headHeight=11;paint(head,x,11,1);tails.forEach(e=>e.style.opacity='0')}
 function animate(t){
  if(document.body.classList.contains('reduce-motion')){settle();return}
  const progress=Math.max(0,Math.min(1,(t-start)/duration));
  headHeight=progress<.5?fromHeight+(5-fromHeight)*Math.sin(progress*Math.PI):5+6*Math.sin((progress-.5)*Math.PI);
  x=at(t);paint(head,x,headHeight,1);
  tails.forEach((e,i)=>{const px=at(t-(i+1)*delay),distance=Math.abs(x-px),fade=Math.min(1,distance/4);paint(e,px,Math.min(headHeight-1,9-i),fade*(.8-i*.075))});
  if(t-start<duration+tails.length*delay)frame=requestAnimationFrame(animate);else settle();
 }
 function sync(instant=false){
  queued=0;const active=fav.querySelector('.tf-btn.active');if(!active){head.style.opacity='0';tails.forEach(e=>e.style.opacity='0');return}
  // Measure both elements in the same viewport, then undo toolbar zoom/scale.
  const groupRect=group.getBoundingClientRect(),buttonRect=active.getBoundingClientRect();
  const scale=groupRect.width/(group.offsetWidth||groupRect.width)||1;
  const center=(buttonRect.left+buttonRect.width/2-groupRect.left)/scale-group.clientLeft;
  const next=center-.5;y=group.clientHeight-5;
  group.style.setProperty('--ruler-phase',(((next-4)%7)+7)%7+'px');
  if(x===null||instant||document.body.classList.contains('reduce-motion')){target=next;settle();return}
  if(target!==null&&Math.abs(next-target)<.25)return;
  from=x;fromHeight=headHeight;target=next;start=performance.now();cancelAnimationFrame(frame);frame=requestAnimationFrame(animate);
 }
 const schedule=()=>{if(!queued)queued=requestAnimationFrame(()=>sync())};
 new MutationObserver(schedule).observe(fav,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(document.body.classList.contains('reduce-motion')&&target!==null)settle()}).observe(document.body,{attributes:true,attributeFilter:['class']});
 fav.addEventListener('scroll',()=>sync(true),{passive:true});addEventListener('resize',()=>sync(true));
 const resize=new ResizeObserver(()=>sync());resize.observe(group);resize.observe(fav);
 document.fonts?.ready.then(()=>sync(true));requestAnimationFrame(()=>sync(true));
})();