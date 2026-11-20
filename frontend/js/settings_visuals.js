/* Shared visual settings. Native inputs keep their values, listeners and persistence. */
(() => {
 'use strict';
 const scope='#settings-modal,#qt-settings-modal,#drawing-settings,.indicator-settings-modal';
 const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const svg=(body,w=100,h=32)=>`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" aria-hidden="true">${body}</svg>`;
 const line=(style,width=1.6)=>{
  if(style==='dot')return svg(Array.from({length:9},(_,i)=>`<circle cx="${10+i*10}" cy="16" r="1.35" fill="currentColor"/>`).join(''));
  return svg(`<path d="M8 16H92" stroke="currentColor" stroke-width="${width}" stroke-linecap="butt" ${style==='dash'?'stroke-dasharray="12 8"':''}/>`);
 };
 const sizeMap={tiny:9,small:12,normal:15,large:19,huge:23,auto:15};
 function info(select){
  const key=select.dataset.inputKey||select.dataset.setting||select.id||'';
  const words=[...select.options].filter(o=>!o.hidden).map(o=>o.textContent.trim());
  const label=select.getAttribute('aria-label')||select.closest('.chart-setting-row,.setting-row,.indi-input-row')?.textContent||key;
  if(words.length>3&&words.some(v=>v.includes('America/'))&&words.some(v=>v.includes('Asia/')))return {kind:'timezone',key,label};
  if(key==='extend'||words.some(v=>v==='Extend both'))return {kind:'extend',key,label};
  if(select.classList.contains('settings-asset-select'))return {kind:'asset',key,label};
  if(key==='m1Timing'||words.some(v=>v.includes('Mid / Close')))return {kind:'timing',key,label};
  if(select.classList.contains('chart-line-style')||(words.length>=2&&words.every(v=>/^(Solid|Dotted|Dashed|[━┄·]+)$/i.test(v))))return {kind:'line',key,label};
  if(words.length>1&&words.every(v=>Object.hasOwn(sizeMap,v.toLowerCase())))return {kind:/psp|marker/i.test(key+label)?'markerSize':'size',key,label};
  if(words.length&&words.every(v=>/^[●✦▲▼♦♟]$/.test(v)))return {kind:'shape',key,label};
  if(words.length>1&&words.every(v=>/^(Left|Mid|Right|Above|On line|Below)$/i.test(v)))return {kind:'labelPosition',key,label};
  if(key==='cycPos'||key==='watermarkPosition'||words.some(v=>/^top_right$/.test(v)))return {kind:'position',key,label};
  return null;
 }
 function preview(select,option){
  const meta=info(select);if(!meta)return null;
  const v=option.value,t=option.label||option.textContent;
  if(meta.kind==='timezone'){
   const parts=new Intl.DateTimeFormat('en-US',{timeZone:v,timeZoneName:'shortOffset'}).formatToParts(new Date());
   const offset=parts.find(p=>p.type==='timeZoneName')?.value?.replace('GMT','UTC')||'UTC';
   const city=v==='UTC'?'Universal time':v.split('/').pop().replaceAll('_',' ');
   return svg('<circle cx="32" cy="16" r="13" stroke="currentColor" opacity=".45"/><ellipse cx="32" cy="16" rx="6" ry="13" stroke="currentColor" opacity=".3"/><path d="M19 16h26M22 9h20M22 23h20" stroke="currentColor" opacity=".3"/><path d="M32 3v26" stroke="var(--accent)" stroke-width="2"/><circle cx="32" cy="16" r="3" fill="var(--accent)"/>',64,32).replace('viewBox="0 0 64 32"','viewBox="16 0 32 32"')+`<span class="visual-caption"><span>${escape(city)}</span><small>${escape(offset)}</small></span>`;
  }
  if(meta.kind==='extend'){
   const left=v==='left'||v==='both',right=v==='right'||v==='both';
   return svg(`<path d="M16 16h32" stroke="currentColor" stroke-width="2"/><circle cx="22" cy="16" r="2" fill="var(--accent)"/><circle cx="42" cy="16" r="2" fill="var(--accent)"/>${left?'<path d="M4 16h14M9 11l-5 5 5 5" stroke="var(--accent)"/>':''}${right?'<path d="M46 16h14M55 11l5 5-5 5" stroke="var(--accent)"/>':''}`,64,32)+`<span class="visual-caption">${escape(t)}</span>`;
  }
  if(meta.kind==='asset'){
   if(v==='AUTO')return '<span class="visual-caption">NQ1!</span>';
   const a=window.TerminalAssets?.info(v);
   return a?`<span class="visual-asset"><img src="${escape(a.icon)}" alt=""/><span>${escape(a.symbol)}</span></span>`:escape(t);
  }
  if(meta.kind==='line'){
   const numeric=select.classList.contains('chart-line-style');
   const style=numeric?(v==='1'?'dot':v==='2'?'dash':'solid'):/dott|·/.test(t.toLowerCase())?'dot':/dash|┄/.test(t.toLowerCase())?'dash':'solid';
   return line(style);
  }
  if(meta.kind==='size')return `<span class="visual-size" style="font-size:${sizeMap[t.toLowerCase()]||15}px">Aa</span><span class="visual-caption">${escape(t)}</span>`;
  if(meta.kind==='markerSize')return `<span class="visual-marker" style="font-size:${sizeMap[t.toLowerCase()]||15}px">●</span><span class="visual-caption">${escape(t)}</span>`;
  if(meta.kind==='shape'){
   const shapes={'●':'<circle cx="50" cy="16" r="6"/>','✦':'<path d="m50 5 3 8 9 3-9 3-3 8-3-8-9-3 9-3z"/>','▲':'<path d="m50 6 10 19H40z"/>','▼':'<path d="m50 26 10-19H40z"/>','♦':'<path d="m50 4 9 12-9 12-9-12z"/>','♟':'<circle cx="50" cy="9" r="4"/><path d="M46 14h8l2 11H44z"/>'};
   return svg(`<g fill="currentColor">${shapes[v]||shapes['●']}</g>`);
  }
  if(meta.kind==='timing'){
   const open=v.startsWith('Bar Open'),x=open?28:60;
   return svg(`<path d="M12 27H88M28 5V25M60 5V25" stroke="currentColor" opacity=".35"/><rect x="23" y="11" width="10" height="10" rx="1" stroke="currentColor"/><rect x="55" y="8" width="10" height="12" rx="1" stroke="currentColor"/><path d="M${x} 2V28" stroke="var(--accent)" stroke-width="2" stroke-dasharray="2 2"/><circle cx="${x}" cy="${open?21:14}" r="3" fill="var(--accent)"/>`)+`<span class="visual-caption">${open?'Open':'Mid / Close'}</span>`;
  }
  if(meta.kind==='labelPosition'){
   const horizontal=/^(Left|Mid|Right)$/i.test(v),x=horizontal?(v==='Left'?12:v==='Right'?62:37):37,y=horizontal?2:v==='Above'?2:v==='Below'?24:13;
   return svg(`<path d="M8 19H92" stroke="currentColor" opacity=".4"/><rect x="${x}" y="${y}" width="27" height="12" rx="3" fill="var(--accent)"/><text x="${x+13.5}" y="${y+8.6}" fill="var(--accent-ink,#fff)" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="600">TDO</text>`,100,38);
  }
  const normalized=v.toLowerCase().replaceAll(' ','_');
  const x=normalized.includes('left')?10:normalized.includes('right')?61:36;
  const y=normalized.includes('top')?5:normalized.includes('bottom')?27:16;
  const isTable=meta.key==='cycPos';
  return svg(`<rect x="3" y="2" width="94" height="42" rx="5" stroke="currentColor" opacity=".5"/><path d="M8 30l14-11 12 5 10-14 13 9 12-7 17 13" stroke="currentColor" opacity=".15"/>`+(isTable?`<rect x="${x}" y="${y}" width="29" height="14" rx="2" fill="var(--accent)"/><path d="M${x} ${y+4}h29M${x+14} ${y}v14M${x} ${y+9}h29" stroke="var(--accent-ink,#fff)" opacity=".65"/>`:`<text x="${x+14}" y="${y+10}" fill="var(--accent)" text-anchor="middle" font-size="9" font-weight="600">Aa</text>`),100,46);
 }
 function optionLabel(select,option,label){
  const markup=preview(select,option);if(!markup)return false;
  label.classList.add('settings-option-visual');label.dataset.visualKind=info(select)?.kind||'';label.innerHTML=markup;return true;
 }
 window.TerminalSettingVisuals={optionLabel,preview};
 function enhanceSelect(select){
  const meta=info(select);if(!meta)return;
  if(!select.dataset.visualReady){
   select.dataset.visualReady='true';
   if(!select.getAttribute('aria-label'))select.setAttribute('aria-label',meta.label.trim().slice(0,100));
   const wrap=document.createElement('span');wrap.className='settings-visual-control';wrap.dataset.visualKind=meta.kind;
   select.before(wrap);wrap.append(select);
   const overlay=document.createElement('span');overlay.className='settings-selected-preview';overlay.setAttribute('aria-hidden','true');wrap.append(overlay);
   select.addEventListener('change',()=>updateSelect(select));
  }
  updateSelect(select);
 }
 function updateSelect(select){
  fitControl(select);
  const overlay=select.parentElement.querySelector('.settings-selected-preview');if(!overlay)return;
  const option=select.selectedOptions[0];
  const markup=option?preview(select,option):'';
  if(overlay.innerHTML!==markup)overlay.innerHTML=markup||'';
  const disabled=select.disabled;select.parentElement.classList.toggle('is-disabled',disabled);
  select.title=option?.label||'';
 }
 function enhanceNumber(input){
  if(input.closest('.qt-number-field,.settings-number-field,.paper-qty-stepper')||input.dataset.numberReady)return;
  input.dataset.numberReady='true';
  const label=input.getAttribute('aria-label')||input.closest('.chart-setting-row,.setting-row,label')?.textContent.trim()||'value';
  const wrap=document.createElement('span');wrap.className='settings-number-field';
  input.before(wrap);wrap.append(input);
  const make=(delta)=>{
   const b=document.createElement('button');b.type='button';b.className='settings-number-step';b.setAttribute('aria-label',(delta<0?'Decrease ':'Increase ')+label);
   b.innerHTML=svg(`<path d="M4 8h8${delta>0?'M8 4v8':''}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,16,16);
   b.onclick=()=>{
    const step=input.step==='any'?.1:(Number(input.step)||1),min=input.min===''?-Infinity:Number(input.min),max=input.max===''?Infinity:Number(input.max);
    input.value=String(Math.max(min,Math.min(max,Number(((Number(input.value)||0)+delta*step).toFixed(8)))));
    input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));sync();
   };return b;
  };
  const minus=make(-1),plus=make(1);wrap.prepend(minus);wrap.append(plus);
  const sync=()=>{minus.disabled=input.disabled||(input.min!==''&&Number(input.value)<=Number(input.min));plus.disabled=input.disabled||(input.max!==''&&Number(input.value)>=Number(input.max));};
  input.addEventListener('input',sync);input.addEventListener('change',sync);sync();
 }
 function decorateWidth(input){
  if(input.dataset.widthPreview)return;
  const row=input.closest('.chart-setting-row,.setting-row,label');
  if(!/width|thickness/i.test(row?.textContent||input.getAttribute('aria-label')||''))return;
  const wrap=input.closest('.qt-number-field,.settings-number-field');if(!wrap)return;
  input.dataset.widthPreview='true';wrap.classList.add('has-width-preview');
  const sample=document.createElement('span');sample.className='number-width-preview';sample.setAttribute('aria-hidden','true');wrap.append(sample);
  const update=()=>{sample.innerHTML=line('solid',Math.max(1,Math.min(6,Number(input.value)||1)));};input.addEventListener('input',update);update();
 }
 function enhanceSound(button){
  if(button.dataset.soundReady)return;button.dataset.soundReady='true';
  const render=playing=>{button.innerHTML=svg(playing?'<path d="M5 4v8M10 2v12M15 5v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>':'<path d="m5 3 8 5-8 5z" fill="currentColor"/>',18,16)+`<span>${playing?'Playing…':'Test sound'}</span>`;button.setAttribute('aria-label',playing?'Playing test sound':'Test sound');button.setAttribute('aria-busy',String(playing));button.classList.toggle('is-playing',playing);};
  render(false);button.addEventListener('click',()=>{render(true);clearTimeout(button._soundTimer);button._soundTimer=setTimeout(()=>render(false),1400);});
 }
 function fitControl(select){
  if(select.hidden)return;
  const meta=info(select),wrap=select.closest('.settings-visual-control');
  const widths={line:108,shape:72,position:124,labelPosition:112,timing:174,size:132,markerSize:132,timezone:180,extend:174,asset:132};
  const ctx=document.createElement('canvas').getContext('2d');ctx.font=getComputedStyle(select).font;
  const width=meta?widths[meta.kind]:Math.max(96,Math.min(250,Math.ceil(ctx.measureText(select.selectedOptions[0]?.label||'').width)+56));
  const el=wrap||select;
  el.style.setProperty('width',width+'px','important');
  el.style.setProperty('min-width','0','important');
  el.style.setProperty('flex','0 0 auto');
 }
 function fitNavigation(panel){
  for(const nav of panel.querySelectorAll('.chart-settings-nav')){
   nav.dataset.fitNav='true';
   const ctx=document.createElement('canvas').getContext('2d');
   for(const button of nav.querySelectorAll('button')){
    if(button.style.getPropertyValue('--tab-label-width'))continue;
    const label=button.querySelector('.chart-tab-label > span');if(!label)continue;
    ctx.font=getComputedStyle(button).font;
    button.style.setProperty('--tab-label-width',Math.ceil(ctx.measureText(label.textContent).width+10)+'px');
   }
  }
 }
 let scheduled=false;
 function scan(){
  scheduled=false;
  for(const panel of document.querySelectorAll(scope)){
   fitNavigation(panel);
   panel.querySelectorAll('select').forEach(select=>{enhanceSelect(select);fitControl(select);});
   panel.querySelectorAll('input[type=number]').forEach(input=>{enhanceNumber(input);decorateWidth(input);});
   panel.querySelectorAll('.chart-sound-preview').forEach(enhanceSound);
  }
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(scan);}}
 // Ignore mutations created inside our own previews; never re-render every frame.
 new MutationObserver(records=>{if(records.some(r=>r.target instanceof Element&&r.target.closest(scope)&&!r.target.closest('.settings-selected-preview,.settings-option-visual,.number-width-preview,.chart-sound-preview')))schedule();}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('change',event=>{if(event.target.matches?.(`${scope.split(',').map(s=>s+' select').join(',')}`))updateSelect(event.target);});
 let hot=null;
 document.addEventListener('pointerover',event=>{
  const next=event.target.closest?.(`${scope.split(',').flatMap(s=>[s+' .qt-number-step',s+' .settings-number-step']).join(',')}`);
  if(next===hot)return;hot?.classList.remove('pointer-hot');hot=next;hot?.classList.add('pointer-hot');
 },true);
 let hotRange=null;
 document.addEventListener('pointermove',event=>{
  const input=event.target instanceof HTMLInputElement&&event.target.type==='range'&&event.target.closest(scope)?event.target:null;
  let next=null;
  if(input){const r=input.getBoundingClientRect(),fraction=(Number(input.value)-(Number(input.min)||0))/((Number(input.max)||100)-(Number(input.min)||0));const thumb=r.left+9+(r.width-18)*fraction;if(Math.abs(event.clientX-thumb)<=13&&Math.abs(event.clientY-(r.top+r.height/2))<=13)next=input;}
  if(next===hotRange)return;hotRange?.classList.remove('range-thumb-hot');hotRange=next;hotRange?.classList.add('range-thumb-hot');
 },true);
 window.addEventListener('blur',()=>{hot?.classList.remove('pointer-hot');hot=null;hotRange?.classList.remove('range-thumb-hot');hotRange=null;});
 scan();
})();
