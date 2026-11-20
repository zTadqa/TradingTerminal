import {drawParticles,clearParticles,resetParticles} from "./ParticleDissolve";
import {originalIcon} from "./OriginalIcons";
import {memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {KeyboardEvent} from 'react';
import {motion, useMotionValue, useReducedMotion, animate, useTransform} from 'framer-motion';
import {Home, Heart, PlusCircle, User, Bell, Crosshair, TrendingUp, Minus, MoveVertical, Square, Type, SlidersHorizontal, ListFilter, Ruler, Paintbrush, Magnet, LockKeyhole, Eye, Trash2, Star, RotateCcw, ArrowUpRight, Play, Pause} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

export type NavItem = {id: string; label: string; icon: LucideIcon; badge?: number};
export type Props = {items?: NavItem[]; value?: string; defaultValue?: string; onChange?: (id: string) => void; className?: string; variant?: 'notch' | 'original'; tone?: 'drawing' | 'glass'; dir?: 'ltr' | 'rtl'; motionMode?: 'system' | 'on' | 'off'};
const defaults: NavItem[] = [{id:'home',label:'Home',icon:Home},{id:'heart',label:'Favorites',icon:Heart},{id:'add',label:'Create',icon:PlusCircle},{id:'user',label:'Profile',icon:User},{id:'bell',label:'Notifications',icon:Bell,badge:3}];
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const clamp = (v:number,lo:number,hi:number) => Math.min(Math.max(v,lo),hi);

/** Clockwise pill with independently fitted Bézier shoulders. At either edge
 * only the outer shoulder narrows; the inner shoulder keeps the visible valley. */
export function buildPath(width:number,height:number,cx:number,notchWidth:number,notchDepth:number,radius:number):string {
  const w=Math.max(1,width), h=Math.max(1,height), r=clamp(radius,0,Math.min(w/2,h/2));
  const x=clamp(cx,12,w-12),d=clamp(notchDepth,0,h-8);
  const half=clamp(notchWidth/2,0,w/2);
  const leftSpan=Math.min(half,Math.max(0,x-4)),rightSpan=Math.min(half,Math.max(0,w-x-4));
  const left=x-leftSpan,right=x+rightSpan;
  const topLeft=d>0?Math.min(r,left):r,topRight=d>0?Math.min(r,w-right):r;
  const valley=half<1 || d<1 ? `L ${right} 0` : `L ${left} 0 C ${left+leftSpan*.46} 0 ${x-leftSpan*.7} ${d} ${x} ${d} C ${x+rightSpan*.7} ${d} ${right-rightSpan*.46} 0 ${right} 0`;
  return `M ${topLeft} 0 ${valley} L ${w-topRight} 0 Q ${w} 0 ${w} ${topRight} L ${w} ${h-r} Q ${w} ${h} ${w-r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h-r} L 0 ${topLeft} Q 0 0 ${topLeft} 0 Z`;
}

function Badge({count}:{count:number|undefined}) {
  if(!count || count<0) return null;
  return <span className="badge" role="img" aria-label={`${count} notifications`}>{count>9?'9+':count}</span>;
}

const CurvedNavBar=memo(function CurvedNavBar({items=defaults,value,defaultValue,onChange,className='',variant='notch',tone='glass',dir,motionMode='system'}:Props) {
  const [internal,setInternal]=useState(defaultValue ?? items[0]?.id ?? '');
  const chosen=value === undefined ? internal : value;
  const index=Math.max(0,items.findIndex(item=>item.id===chosen));
  const selected=items[index];
  const host=useRef<HTMLElement>(null);
  const buttons=useRef<(HTMLButtonElement|null)[]>([]);
  const particleCanvas=useRef<HTMLCanvasElement>(null);
  const [geometry,setGeometry]=useState({width:720,rtl:dir==='rtl'});
  const systemReduced=useReducedMotion();
  const reduced=motionMode==='off' || (motionMode==='system' && systemReduced);
  const id=useId().replace(/:/g,'');
  const height=78;
  const inset=items.length>6?8:items.length>1?24:0;
  const cell=(geometry.width-inset*2)/Math.max(1,items.length);
  // Scale the valley on narrow layouts; a single shared clamped x drives both
  // the SVG valley and floating button, including interrupted spring movement.
  const half=Math.min(56,cell*.85);
  const radius=items.length>6?38:Math.min(38,Math.max(8,cell*.45));
  const visualIndex=geometry.rtl ? items.length-1-index:index;
  const target=inset+(visualIndex+.5)*cell;
  const x=useMotionValue(target);
  const dropY=useMotionValue(0);
  const dropOpacity=useMotionValue(1);
  const stretch=useMotionValue(1);
  const squash=useMotionValue(1);
  const glyphScale=useTransform(()=>Math.sqrt(Math.max(0,stretch.get()*squash.get())));
  const dropBlur=useMotionValue(0);
  const dropRadius=useMotionValue("50%");
  const blurFilter=useTransform(dropBlur,v=>`blur(${v}px)`);
  const [visibleId,setVisibleId]=useState(selected?.id);
  const lastGeometry=useRef(geometry.width);
  const lastSelection=useRef(selected?.id);
  const depth=items.length>1 && variant==='notch'?40:0;
  // The valley uses the very same animated width/height as the droplet.
  // At zero scale the top edge becomes flat instead of leaving a large hole.
  const path=useTransform(()=>buildPath(geometry.width,height,x.get(),half*2*clamp(stretch.get(),0,1.3),depth*clamp(squash.get(),0,1.1)+dropY.get(),radius));
  const circleX=useTransform(x,current=>current-30);
  const trackClip=useTransform(path,current=>`path("${current}")`);
  const fallbackPath=useMemo(()=>buildPath(geometry.width,height,target,half*2,depth,radius),[geometry.width,target,half,depth,radius]);

  useIsoLayoutEffect(()=>{
    const el=host.current;
    if(!el) return;
    const update=()=>setGeometry(previous=>{
      const width=el.clientWidth,rtl=getComputedStyle(el).direction==='rtl';
      return previous.width===width && previous.rtl===rtl ? previous:{width,rtl};
    });
    update();
    const observer=new ResizeObserver(update);
    observer.observe(el);
    // Handles inherited direction changes as well as this component's dir prop.
    const directionObserver=new MutationObserver(update);
    for(let parent:HTMLElement|null=el;parent;parent=parent.parentElement) directionObserver.observe(parent,{attributes:true,attributeFilter:['dir','class','style']});
    window.addEventListener('orientationchange',update);
    return ()=>{observer.disconnect();directionObserver.disconnect();window.removeEventListener('orientationchange',update);};
  },[dir,items.length]);
  useIsoLayoutEffect(()=>{
    const canvas=particleCanvas.current;if(!canvas)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round((geometry.width+240)*dpr);canvas.height=210*dpr;
    canvas.getContext('2d')?.setTransform(dpr,0,0,dpr,0,0);
  },[geometry.width,variant]);
  useIsoLayoutEffect(()=>{
    clearParticles(particleCanvas.current);
    const resized=lastGeometry.current!==geometry.width;
    const changed=lastSelection.current!==selected?.id;
    lastGeometry.current=geometry.width;
    lastSelection.current=selected?.id;
    const start=x.get(),delta=target-start;
    if(reduced || items.length<=1 || resized || !changed || Math.abs(delta)<1){
      x.set(target);dropY.set(0);dropOpacity.set(1);stretch.set(1);squash.set(1);dropBlur.set(0);dropRadius.set("50%");setVisibleId(selected?.id);return;
    }
    // Distance is measured from the actual in-flight position, so a new click
    // interrupts cleanly without jumping back to the previous selected item.
    const distance=Math.abs(delta),direction=Math.sign(delta);
    const energy=clamp((distance/cell-1)/9,0,1);
    const overshoot=direction*(2.5+energy*5.5);
    const duration=.569;
    const initialY=dropY.get();
    resetParticles(particleCanvas.current);
    let swapped=false;
    const ease=(v:number)=>v*v*(3-2*v);
    const flight=animate(0,1,{duration,ease:'linear',onUpdate:p=>{
      // Arrival and recovery have fixed phase boundaries for EVERY distance.
      // Do not add overshoot to the main travel delta: that made nearby moves
      // cross the destination earlier because their overshoot/distance was larger.
      // Match velocity across the arrival boundary instead of stopping at the
      // destination and starting a second animation. All distances arrive at 64%.
      const t=clamp(p/.64,0,1),q=clamp((p-.64)/.18,0,1);
      const tangent=(overshoot/delta)*(1.2/.18)*.64;
      const travel=p<.64 ? ease(t)+tangent*(t*t*t-t*t) : 1;
      const glide=ease(q)+1.2*(q*q*q-2*q*q+q);
      const recover=clamp((p-.82)/.18,0,1);
      const softReturn=recover*recover*recover*(recover*(recover*6-15)+10);
      const current=p<.64 ? start+delta*travel : p<.82 ? target+overshoot*glide : target+overshoot*(1-softReturn);
      x.set(current);
      if(!swapped && travel>=.66){swapped=true;setVisibleId(selected?.id);}
      {        const departing=travel>=.24 && travel<.66;
        const arriving=travel>=.72 && travel<.98;
        const breakup=departing?clamp((travel-.24)/.38,0,1):clamp((.98-travel)/.26,0,1);
        const pull=Math.sin(Math.PI*travel);
        // Shrink the whole droplet AND its fragments, so dissolution does not
        // leave a full-size particle cloud. Grow back only near position 3.
        const size=travel<.66 ? 1-ease(clamp((travel-.10)/.50,0,1)) : ease(clamp((travel-.74)/.26,0,1));
        // Braking compresses the whole painted button, then rebounds in Y.
        // The valley reads the same translation and scale, preserving its gap.
        const brake=clamp((p-.52)/.48,0,1),sink=.65+Math.pow(energy,1.15)*11.35,rebound=.12+energy*1.4;
        const y=p<.52 ? initialY*(1-ease(clamp(p/.22,0,1)))*size : brake<.25 ? sink*ease(brake/.25) : brake<.76 ? sink+(-rebound-sink)*ease((brake-.25)/.51) : -rebound*(1-ease((brake-.76)/.24));
        const compression=Math.max(0,y)/sink;
        dropY.set(y);
        const sx=size*(1+pull*(.20+energy*.24))*(1+compression*(.03+energy*.12));
        const sy=size*(1-pull*(.10+energy*.10))*(1-compression*(.04+energy*.18)-Math.min(0,y)*.018);
        const solid=travel<.24 || travel>=.98;
        dropOpacity.set(solid?1:0);
        stretch.set(sx);squash.set(sy);dropRadius.set("50%");dropBlur.set(0);
        if(departing||arriving)drawParticles(particleCanvas.current,current,breakup,direction,energy,sx,sy,dropY.get());
        else clearParticles(particleCanvas.current);
      }
    },onComplete:()=>{clearParticles(particleCanvas.current);x.set(target);dropY.set(0);dropOpacity.set(1);stretch.set(1);squash.set(1);dropBlur.set(0);dropRadius.set("50%");setVisibleId(selected?.id);}});
    return ()=>{flight.stop();clearParticles(particleCanvas.current);};
  },[target,geometry.width,selected?.id,reduced,items.length,cell,x,dropOpacity,stretch,squash,dropBlur,dropRadius,dropY]);
  const activate=useCallback((i:number)=>{const item=items[i];if(!item)return;if(value===undefined)setInternal(item.id);onChange?.(item.id);},[items,value,onChange]);
  const keydown=useCallback((event:KeyboardEvent<HTMLButtonElement>,i:number)=>{
    let next=i;
    if(event.key==='ArrowRight')next=(i+(geometry.rtl?-1:1)+items.length)%items.length;
    else if(event.key==='ArrowLeft')next=(i+(geometry.rtl?1:-1)+items.length)%items.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=items.length-1;
    else return;
    event.preventDefault();activate(next);buttons.current[next]?.focus();
  },[items.length,geometry.rtl,activate]);
  if(!selected)return null;
  const floatingItem=items.find(item=>item.id===visibleId)??selected;
  const Icon=floatingItem.icon;
  return <nav ref={host} dir={dir} aria-label="Main navigation" className={`curved-nav ${tone} ${variant} ${className}`}>
    <svg className="bar-surface" width="100%" height={height} viewBox={`0 0 ${geometry.width} ${height}`} aria-hidden="true">
      <defs><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={tone==='glass'?'#d9c8b7':'#2c1c1c'} stopOpacity={tone==='glass'?.53:1}/><stop offset="100%" stopColor={tone==='glass'?'#b68d68':'#1d1112'} stopOpacity={tone==='glass'?.69:1}/></linearGradient><clipPath id={`${id}-pill`}><rect x="0" y="0" width={geometry.width} height={height} rx={radius}/></clipPath></defs>
      <motion.path clipPath={`url(#${id}-pill)`} d={path} fill={`url(#${id}-fill)`} stroke="none"/>
      <noscript><path clipPath={`url(#${id}-pill)`} d={fallbackPath} fill={`url(#${id}-fill)`}/></noscript>
    </svg>
    <motion.div className="tile-track" aria-hidden="true" style={{borderRadius:radius,overflow:'hidden',clipPath:trackClip,gridTemplateColumns:`repeat(${items.length}, minmax(0, 1fr))`,paddingInline:inset}}>
      {items.map((item,i)=><div key={item.id} className={`tool-tile ${index===i?'selected':''}`}/>)}
    </motion.div>
    <motion.div className="item-track" style={{gridTemplateColumns:`repeat(${items.length}, minmax(0, 1fr))`,paddingInline:inset}}>
      {items.map((item,i)=>{const ItemIcon=item.icon,active=index===i;return <motion.button key={item.id} ref={el=>{buttons.current[i]=el;}} type="button" aria-label={item.label} aria-current={active?'page':undefined} title={item.label} onClick={()=>activate(i)} onKeyDown={e=>keydown(e,i)} className={`tool-button ${active?'selected':''}`} whileHover={reduced?undefined:{scale:1.08}} whileTap={reduced?undefined:{scale:.92}}>
        <motion.span className="icon-wrap" animate={{opacity:active&&variant==='notch'?0:1,y:active&&variant==='notch'?-12:0,scale:active&&variant==='notch'?.7:1}} transition={reduced?{duration:0}:{type:'spring',stiffness:310,damping:19}}><ItemIcon size={27} strokeWidth={1.6}/><Badge count={item.badge}/></motion.span>
      </motion.button>;})}
    </motion.div>
    {variant==='notch'&&<motion.div className="floating-position" style={{x:circleX,y:dropY}} aria-hidden="true"><motion.div className="floating-circle liquid-drop" style={{opacity:dropOpacity,scaleX:stretch,scaleY:squash,filter:blurFilter,borderRadius:dropRadius}}/><motion.div className="floating-glyph" style={{opacity:dropOpacity,scale:glyphScale}}><span><Icon size={27} strokeWidth={1.65}/><Badge count={floatingItem.badge}/></span></motion.div></motion.div>}
    {variant==='notch'&&<canvas ref={particleCanvas} className="particle-layer" style={{width:geometry.width+240,height:210}} aria-hidden="true"/>}
    <div className="home-indicator" aria-hidden="true"/>
  </nav>;
});
export default CurvedNavBar;

const tools:NavItem[]=[{id:"crosshair",label:"Crosshair",icon:originalIcon("crosshair")},{id:"trend",label:"Trend line",icon:originalIcon("trend")},{id:"horizontal",label:"Horizontal line",icon:originalIcon("horizontal")},{id:"vertical",label:"Vertical line",icon:originalIcon("vertical")},{id:"rectangle",label:"Rectangle",icon:originalIcon("rectangle")},{id:"text",label:"Text",icon:originalIcon("text")},{id:"fib",label:"Fibonacci",icon:originalIcon("fib")},{id:"pitchfork",label:"Long position",icon:originalIcon("forecast")},{id:"range",label:"Short position",icon:originalIcon("forecast_short")},{id:"measure",label:"Measure",icon:originalIcon("ruler")},{id:"brush",label:"Brush",icon:originalIcon("brush")},{id:"magnet",label:"Magnet",icon:originalIcon("magnet")},{id:"lock",label:"Lock drawings",icon:originalIcon("lock")},{id:"visibility",label:"Visibility",icon:originalIcon("eye")},{id:"delete",label:"Delete drawings",icon:originalIcon("trash")},{id:"favorites",label:"Favorites",icon:originalIcon("star")}];

export function App() {
  const [mode,setMode]=useState<'notch'|'original'>('notch');
  const [preset,setPreset]=useState('drawing');
  const [value,setValue]=useState('crosshair');
  const [rtl,setRtl]=useState(false);
  const [count,setCount]=useState(5);
  const [playing,setPlaying]=useState(false);
  const [motionOn,setMotionOn]=useState(true);
  const items=useMemo(()=>preset==='drawing'?tools:[...defaults,{id:'saved',label:'Saved',icon:Star}].slice(0,count),[preset,count]);
  const active=items.find(item=>item.id===value)??items[0];
  useEffect(()=>{if(!playing || !motionOn || items.length<2)return;let step=0;const timer=window.setInterval(()=>{const jump=step++%2===0?Math.max(2,Math.floor(items.length*.65)):1;setValue(previous=>items[(Math.max(0,items.findIndex(item=>item.id===previous))+jump)%items.length].id);},2000);return ()=>window.clearInterval(timer);},[playing,motionOn,items]);
  return <main className="min-h-screen text-stone-200">
    <header className="flex items-center justify-between gap-4 px-6 py-6 md:px-12"><a href="#" className="brand">bar<span> / </span>lab</a><span className="text-sm text-stone-400">Standalone UI study <span className="hidden sm:inline">· Terminal untouched</span></span></header>
    <section className="intro mx-auto max-w-4xl px-6 text-center"><p className="text-sm text-stone-400">Original drawing bar · Curved notch study</p><h1 className="mt-5 text-4xl font-medium tracking-tight md:text-6xl">The same bar.<br/><span className="text-stone-400">Just a softer curve.</span></h1><p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-stone-400">The droplet shrinks into tiny particles, disappears at the midpoint, then grows back near the destination.</p>
    <div className="mt-7 flex flex-wrap justify-center gap-2"><button className={`pill ${playing?'on':''}`} onClick={()=>{setMotionOn(true);setMode('notch');setPlaying(p=>!p);}}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?'Pause animation':'Play animation'}</button><button className={`pill ${mode==='original'?'on':''}`} onClick={()=>setMode('original')}>Original bar</button><button className={`pill ${mode==='notch'?'on':''}`} onClick={()=>setMode('notch')}>Curved notch <ArrowUpRight size={14}/></button></div></section>
    <section className={`preview ${preset==='drawing'?'drawing-preview':'glass-preview'}`} aria-label="Interactive bar preview">
      <div className="canvas-grid" aria-hidden="true"/>
      <div className="preview-corner"><span>{preset==='drawing'?'Drawing tools':'Navigation'}</span><span>{mode==='notch'?'Curved notch':'Reference style'}</span></div>
      <div className="selection-readout" aria-live="polite">{active && <active.icon size={23} strokeWidth={1.4}/>}<span>{active?.label ?? 'No items'}</span></div>
      <div className={`bar-placement ${preset==='drawing'?'wide':''}`}><CurvedNavBar items={items} value={value} onChange={id=>{setPlaying(false);setValue(id);}} motionMode={motionOn?'on':'off'} variant={mode} tone={preset==='drawing'?'drawing':'glass'} dir={rtl?'rtl':'ltr'}/></div>
      <div className="preview-caption">{playing && motionOn ? 'Animation playing · click any tool to take over' : 'Click a tool to animate · ← → to explore'}</div>
    </section>
    <footer className="controls mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-5 px-6 pb-9"><div className="flex flex-wrap items-center gap-3"><label className="text-sm text-stone-400" htmlFor="preset">Preview</label><select id="preset" value={preset} onChange={e=>{setPreset(e.target.value);setValue(e.target.value==='drawing'?'fib':'home');}}><option value="drawing">Drawing bar · 16 tools</option><option value="navigation">Glass navigation · 3–6 items</option></select>{preset==='navigation'&&<label className="flex items-center gap-2 text-sm">Items <select aria-label="Item count" value={count} onChange={e=>setCount(Number(e.target.value))}>{[0,1,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label>}</div><div className="flex items-center gap-4"><label className="flex items-center gap-2 text-sm text-stone-400"><input type="checkbox" checked={motionOn} onChange={e=>setMotionOn(e.target.checked)}/>Animation</label><label className="flex items-center gap-2 text-sm text-stone-400"><input type="checkbox" checked={rtl} onChange={e=>setRtl(e.target.checked)}/>RTL</label><button className="reset" onClick={()=>{setMode('notch');setValue(preset==='drawing'?'fib':'home');setRtl(false);}} aria-label="Reset demo"><RotateCcw size={16}/></button></div></footer>
  </main>;
}
