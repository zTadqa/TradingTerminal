import {useEffect,useMemo,useState,forwardRef} from 'react';
import {createRoot} from 'react-dom/client';
import type {LucideProps} from 'lucide-react';
import CurvedNavBar from './CurvedNavBar';
import type {NavItem} from './CurvedNavBar';
import './terminal-docks.css';

function mount(source:HTMLElement,vertical:boolean){
 const buttons=Array.from(source.querySelectorAll<HTMLButtonElement>(vertical?':scope > button,#terminal-edge-dock button':'.tool-btn[data-tool],button[data-manage-favourites]'));
 if(!buttons.length)return;
 source.setAttribute('aria-hidden','true');buttons.forEach(b=>b.tabIndex=-1);
 // Native buttons retain all chart actions, shortcuts and persistence handlers.
 const host=document.createElement('div');host.className=`terminal-liquid-host ${vertical?'vertical':'horizontal'}`;
 const stage=document.createElement('div');stage.className='terminal-liquid-stage';host.append(stage);document.body.append(host);
 source.dataset.liquidSource='true';source.classList.add('liquid-source');
 const ordered=vertical?[...buttons].reverse():buttons;
 const ids=new Map(ordered.map((button,i)=>[button,button.dataset.tool||button.id||`panel-${i}`]));
 const root=createRoot(stage);
 let pendingAction=0;
 const liveButton=(button:HTMLButtonElement)=>button.dataset.manageFavourites ? source.querySelector<HTMLButtonElement>('[data-manage-favourites]')||button : button;
 function Dock(){
  const [value,setValue]=useState(ids.get(ordered.find(b=>b.classList.contains('active'))||ordered[0])!);
  const [,refresh]=useState(0);
  const [webReduced,setWebReduced]=useState(document.body.classList.contains('reduce-motion'));
  const items:NavItem[]=useMemo(()=>ordered.map(button=>{
   const markup=button.querySelector('svg')?.innerHTML||'<path d="m12 3 3 6 6 1-4.5 4.5 1 6L12 18l-5.5 2.5 1-6L3 10l6-1z"/>';
   const Icon=forwardRef<SVGSVGElement,LucideProps>(({size=27,...props},ref)=><svg {...props} width={size} height={size} ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{__html:markup}}/>);
   return {id:ids.get(button)!,label:button.getAttribute('aria-label')||button.title||button.dataset.tool||'Tool',icon:Icon};
  }),[]);
  useEffect(()=>{
   const webMotion=new MutationObserver(()=>setWebReduced(document.body.classList.contains('reduce-motion')));
   webMotion.observe(document.body,{attributes:true,attributeFilter:['class']});
   return ()=>webMotion.disconnect();
  },[]);
  useEffect(()=>{
   const watch=new MutationObserver(records=>{
    const selected=records.map(r=>r.target).find((target):target is HTMLButtonElement=>target instanceof HTMLButtonElement&&ids.has(target)&&target.classList.contains('active')&&!['magnet','lock','eye'].includes(target.dataset.tool||''));
    if(selected)setValue(ids.get(selected)!);
    refresh(v=>v+1);
   });
   watch.observe(source,{attributes:true,subtree:true,attributeFilter:['class','aria-pressed','disabled']});
   return ()=>watch.disconnect();
  },[]);
  useEffect(()=>{
   stage.querySelectorAll<HTMLButtonElement>('nav button').forEach((proxy,i)=>{
    const native=liveButton(ordered[i]);proxy.disabled=native.disabled;
    const pressed=native.getAttribute('aria-pressed');if(pressed!==null)proxy.setAttribute('aria-pressed',pressed);
    const expanded=native.getAttribute('aria-expanded');if(expanded!==null)proxy.setAttribute('aria-expanded',expanded);
   });
  });
  return <CurvedNavBar className="terminal-integrated-nav" items={items} value={value} motionMode={webReduced?'off':'on'} tone="drawing" onChange={id=>{const button=ordered.find(b=>ids.get(b)===id);if(!button||button.disabled)return;clearTimeout(pendingAction);setValue(id);if(vertical&&!webReduced&&id!==value){pendingAction=window.setTimeout(()=>liveButton(button).click(),600);}else liveButton(button).click();}}/>;
 }
 root.render(<Dock/>);
 let frame=0,followUntil=0,closeTimer=0;
 const edge=source.parentElement!;
 function position(){
  frame=0;const r=source.getBoundingClientRect();
  const hidden=!r.width||!r.height||getComputedStyle(source).visibility==='hidden'||document.body.classList.contains('terminal-fullscreen');
  host.hidden=hidden;if(hidden){if(performance.now()<followUntil)frame=requestAnimationFrame(position);return;}
  const onScreen=vertical?r.left<innerWidth-4:r.top<innerHeight-4;
  host.classList.toggle('edge-hidden',!onScreen);
  const scale=vertical?r.width/78:r.height/78;
  host.style.left=r.left+'px';host.style.top=r.top+'px';host.style.width=r.width+'px';host.style.height=r.height+'px';
  stage.style.width=(vertical?r.height:r.width)/scale+'px';
  stage.style.transform=vertical?`translateY(${r.height}px) rotate(-90deg) scale(${scale})`:`scale(${scale})`;
  const nav=stage.querySelector('nav');if(nav)nav.setAttribute('aria-label',vertical?'Panel navigation':'Drawing tools');
  if(performance.now()<followUntil)frame=requestAnimationFrame(position);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(position);};
 const follow=()=>{followUntil=performance.now()+650;schedule();};
 new ResizeObserver(schedule).observe(source);
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class','style']});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class','style']});
 new MutationObserver(follow).observe(edge,{attributes:true,attributeFilter:['class','style','hidden','data-dock-hover']});
 source.addEventListener('transitionrun',follow);source.addEventListener('transitionend',schedule);
 window.addEventListener('resize',follow);follow();setTimeout(follow,350);
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const reveal=()=>{clearTimeout(closeTimer);closeTimer=0;if(!edge.hasAttribute('data-dock-hover'))edge.setAttribute('data-dock-hover','');follow();};
 const conceal=()=>{if(closeTimer)return;closeTimer=window.setTimeout(()=>{closeTimer=0;if(edge.querySelector('.dock-pin[aria-pressed="true"]')||host.querySelector(':focus-visible'))return;edge.removeAttribute('data-dock-hover');follow();},180);};
 document.addEventListener('pointermove',event=>{
  if(!fine.matches||event.pointerType==='touch')return;
  const r=host.getBoundingClientRect();
  const near=vertical?event.clientX>=innerWidth-18:event.clientY>=innerHeight-20;
  const inside=event.clientX>=r.left-(vertical?26:0)&&event.clientX<=r.right&&event.clientY>=r.top-(vertical?0:26)&&event.clientY<=r.bottom;
  if(near||inside||host.contains(event.target as Node))reveal();else conceal();
 },{passive:true});
 host.addEventListener('pointerenter',reveal);host.addEventListener('pointerleave',conceal);
 host.addEventListener('focusin',reveal);host.addEventListener('focusout',conceal);
 source.addEventListener('focusin',event=>{
  const index=ordered.findIndex(b=>liveButton(b)===event.target);
  if(index>=0)stage.querySelectorAll<HTMLButtonElement>('nav button')[index]?.focus();
 });
 stage.addEventListener('contextmenu',event=>{
  const target=(event.target as Element).closest('button');if(!target)return;
  const button=ordered.find(b=>(b.getAttribute('aria-label')||b.title||b.dataset.tool)===target.getAttribute('aria-label'));
  if(button){event.preventDefault();button.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,clientX:event.clientX,clientY:event.clientY}));}
 });
 if(vertical)stage.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();(event.target as HTMLElement).dispatchEvent(new KeyboardEvent('keydown',{key:event.key==='ArrowUp'?'ArrowRight':'ArrowLeft',bubbles:true}));
 });
}

function start(){
 for(const [id,vertical]of [['left-sidebar',false],['right-sidebar',true]] as const){const source=document.getElementById(id);if(source&&!source.dataset.liquidSource)mount(source,vertical);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
