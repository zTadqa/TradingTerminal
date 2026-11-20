/* Shared tooltip for sync information icons; does not toggle the row switch. */
(()=>{
 const tip=document.createElement('div');tip.id='sync-help-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 const style=document.createElement('style');style.textContent=`#sync-help-tooltip{position:fixed;z-index:11000;max-width:min(270px,calc(100vw - 16px));padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text);box-shadow:0 5px 20px #0003;font:400 12px/1.5 var(--font-ui);pointer-events:none}#layout-popover .sync-info{cursor:help}#layout-popover .sync-info:focus-visible{outline:2px solid var(--accent);outline-offset:2px}`;document.head.append(style);
 let owner=null;
 function hide(){owner?.removeAttribute('aria-describedby');owner=null;tip.hidden=true;}
 function show(e){owner=e;tip.textContent=e.dataset.help||e.title;e.setAttribute('aria-describedby',tip.id);tip.hidden=false;const r=e.getBoundingClientRect(),b=tip.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(innerWidth-b.width-8,r.left))+'px';tip.style.top=(r.bottom+b.height+8<innerHeight?r.bottom+7:Math.max(8,r.top-b.height-7))+'px';}
 document.addEventListener('pointerover',e=>{const icon=e.target.closest?.('.sync-info');if(icon)show(icon);else if(owner)hide();});
 document.addEventListener('focusin',e=>{const icon=e.target.closest?.('.sync-info');if(icon)show(icon);else hide();});
 document.addEventListener('focusout',e=>{if(e.target===owner)hide()});
 document.addEventListener('click',e=>{const icon=e.target.closest?.('.sync-info');if(icon){e.preventDefault();e.stopPropagation();show(icon)}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&owner){hide();e.stopPropagation()}else if(e.target.matches?.('.sync-info')&&['Enter',' '].includes(e.key)){e.preventDefault();show(e.target)}},true);
 addEventListener('resize',hide);addEventListener('scroll',hide,true);
 new MutationObserver(()=>{if(owner&&(!owner.isConnected||!owner.getClientRects().length))hide()}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden'],childList:true});
})();