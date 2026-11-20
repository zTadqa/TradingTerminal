/* Drag floating settings by their header; offsets are intentionally not viewport-clamped. */
(()=>{
 const panels='#settings-modal .chart-settings-dialog,#qt-settings-modal .chart-settings-dialog,#drawing-settings .drawing-dialog,.indicator-settings-modal .indicator-settings-dialog,#desktop-panel,.companion-panel:not(.music-mini)';
 const interactive='button,input,select,textarea,a,summary,[role=tab],[contenteditable=true]';
 const positions=new Map();let drag=null;
 function hit(target){
  if(!(target instanceof Element)||target.closest(interactive))return null;
  const header=target.closest('.modal-header,.desktop-panel-header,.companion-panel > header');
  const panel=header?.closest(panels);return panel?{header,panel}:null;
 }
 function zoom(panel){let value=1;for(let e=panel;e;e=e.parentElement)value*=parseFloat(getComputedStyle(e).zoom)||1;return value;}
 function apply(panel,state){panel.style.setProperty('translate',`${state.x/zoom(panel)}px ${state.y/zoom(panel)}px`,'important');}
 function reset(panel){positions.delete(panel);panel.style.removeProperty('translate');panel.style.removeProperty('animation');panel.style.removeProperty('transition');panel.classList.remove('settings-panel-dragging');}
 function end(){if(!drag)return;const old=drag;drag=null;old.panel.classList.remove('settings-panel-dragging');if(old.header.hasPointerCapture(old.id))old.header.releasePointerCapture(old.id);}
 document.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;const target=hit(event.target);if(!target)return;
  if(typeof TerminalSettingsPanels!=='undefined')TerminalSettingsPanels.dismissMenus();
  const {panel,header}=target,state=positions.get(panel)||{x:0,y:0};
  panel.style.setProperty('animation','none','important');panel.style.setProperty('transition','none','important');
  positions.set(panel,state);drag={panel,header,id:event.pointerId,x:event.clientX,y:event.clientY,startX:state.x,startY:state.y};
  panel.classList.add('settings-panel-dragging');header.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
 });
 document.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const state={x:drag.startX+event.clientX-drag.x,y:drag.startY+event.clientY-drag.y};
  positions.set(drag.panel,state);apply(drag.panel,state);event.preventDefault();
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,event=>{if(drag&&event.pointerId===drag.id)end();});
 document.addEventListener('dblclick',event=>{const target=hit(event.target);if(target){end();reset(target.panel);event.preventDefault();}});
 window.addEventListener('blur',end);
 new MutationObserver(()=>{
  for(const panel of positions.keys()){
   const root=panel.closest('.modal')||panel;
   const open=panel.isConnected&&!root.hidden&&(root.matches('.modal')?root.classList.contains('show'):root.matches('.companion-panel')?root.classList.contains('open'):true);
   if(!open){if(drag?.panel===panel)end();reset(panel);}
  }
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
})();
