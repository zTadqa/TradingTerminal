/* Settings, motion and input behavior shared by the terminal chrome. */
TerminalFeatures.contrast=color=>{const hex=String(color).replace('#','');if(!/^[\da-f]{6}$/i.test(hex))return '#fff';const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179?'#111':'#fff';};
TerminalFeatures.clampToolbarScale=value=>Math.min(125,Math.max(60,Math.round((Number.isFinite(+value)&&+value>0?+value:85)/5)*5));
TerminalFeatures.clampToolbarTextScale=value=>Math.min(130,Math.max(80,Math.round((Number.isFinite(+value)&&+value>0?+value:100)/5)*5));
TerminalFeatures.prototype.installPolish=function(){
  const settings=this.chartSettings,modal=settings.modal,dialog=settings.dialog;
  const old=modal.querySelector('.toolbar-settings'),controls=document.createElement('div'),parking=document.createElement('div');
  parking.hidden=true;modal.appendChild(parking);controls.className='chart-setting-card';settings.toolbarControls=controls;settings.toolbarParking=parking;
  for(const child of [...old.children])if(child.tagName!=='SUMMARY')controls.appendChild(child);old.remove();parking.appendChild(controls);
  const labels=['Top left toolbar','Top right toolbar','Drawing toolbar','Bottom left toolbar','Bottom right toolbar','Toolbar background (fixed)'];
  controls.querySelectorAll('.setting-row>span:first-child').forEach((el,i)=>el.textContent=labels[i]);
  controls.querySelector('#set-toolbar-opacity')?.closest('.setting-row')?.setAttribute('hidden','');
  controls.querySelector('.editor-help').textContent='Toolbars are pinned to the screen. Ctrl + , opens Settings. Chart and panel preferences save automatically.';
  const add=(text,el)=>{const label=document.createElement('label');label.className='setting-row';const name=document.createElement('span');name.textContent=text;label.append(name,el);controls.appendChild(label);};
  const scaleKey='terminal_toolbar_scale_v1';
  const scaleWrap=document.createElement('span');scaleWrap.className='toolbar-transparency';
  const scaleInput=document.createElement('input');scaleInput.type='range';scaleInput.id='set-toolbar-scale';scaleInput.min=60;scaleInput.max=125;scaleInput.step=5;scaleInput.setAttribute('aria-label','Toolbar scale');
  const scaleOutput=document.createElement('output');scaleOutput.id='toolbar-scale-value';scaleOutput.setAttribute('for','set-toolbar-scale');
  scaleWrap.append(scaleInput,scaleOutput);
  const applyScale=(raw,persist=true)=>{
    const pct=TerminalFeatures.clampToolbarScale(raw);
    scaleInput.value=String(pct);
    scaleOutput.value=scaleOutput.textContent=pct+'%';
    scaleInput.setAttribute('aria-valuetext',pct+'%');
    document.documentElement.style.setProperty('--toolbar-scale',(pct/100).toFixed(2));
    if(persist)Workspace.write(scaleKey,pct);
    this.desktop?.fitToolbar?.();
    this.charts?.forEach(c=>c.positionSymbolBadge?.());
  };
  scaleInput.oninput=()=>applyScale(scaleInput.value,true);
  scaleWrap.ondblclick=()=>applyScale(85,true);
  const textKey='terminal_toolbar_text_scale_v1';
  const textWrap=document.createElement('span');textWrap.className='toolbar-transparency';
  const textInput=document.createElement('input');textInput.type='range';textInput.id='set-toolbar-text-scale';textInput.min=80;textInput.max=130;textInput.step=5;textInput.setAttribute('aria-label','Toolbar text size');
  const textOutput=document.createElement('output');textOutput.setAttribute('for',textInput.id);
  textWrap.append(textInput,textOutput);
  const applyTextScale=(raw,persist=true)=>{
    const pct=TerminalFeatures.clampToolbarTextScale(raw);
    textInput.value=String(pct);textOutput.value=textOutput.textContent=pct+'%';
    textInput.setAttribute('aria-valuetext',pct+'%');
    document.documentElement.style.setProperty('--toolbar-text-scale',String(pct/100));
    if(persist)Workspace.write(textKey,pct);
    this.desktop?.fitToolbar?.();
  };
  textInput.oninput=()=>applyTextScale(textInput.value);textWrap.ondblclick=()=>applyTextScale(100);
  add('Toolbar text size',textWrap);applyTextScale(Workspace.read(textKey,100),false);
  const motionKey='terminal_motion_preference_v1';
  const motion=document.createElement('select');
  motion.id='set-reduce-motion';
  for(const [value,label] of [['reduce','On'],['full','Off']]){
    const option=document.createElement('option');
    option.value=value;
    option.textContent=label;
    motion.appendChild(option);
  }
  const savedMotion=Workspace.read(motionKey,Workspace.read('terminal_reduce_motion_v1',false)===true?'reduce':'full');
  motion.value=savedMotion==='reduce'?'reduce':'full';
  const motionControl=document.createElement('div');
  motionControl.className='motion-segment';
  motionControl.setAttribute('role','group');
  motionControl.setAttribute('aria-label','Reduce motion');
  motion.hidden=true;motion.tabIndex=-1;motionControl.append(motion);
  const motionButtons=[];
  for(const [value,label] of [['reduce','On'],['full','Off']]){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.setAttribute('aria-label',label==='On'?'Reduce motion on':'Reduce motion off');
    button.dataset.motion=value;
    button.onclick=()=>{motion.value=value;motion.dispatchEvent(new Event('change',{bubbles:true}));};
    motionButtons.push(button);motionControl.append(button);
  }
  const applyMotion=()=>{
    document.body.classList.toggle('reduce-motion',motion.value==='reduce');
    motionControl.dataset.value=motion.value;
    for(const button of motionButtons)button.setAttribute('aria-pressed',String(button.dataset.motion===motion.value));
  };
  motion.addEventListener('change',()=>{Workspace.write(motionKey,motion.value);applyMotion();});
  add('Reduce motion',motionControl);
  controls.prepend(motionControl.parentElement);
  add('Toolbar scale',scaleWrap);
  controls.prepend(scaleWrap.parentElement);
  settings.onToolbarReset=()=>{applyScale(85,true);applyTextScale(100,true);};
  applyScale(Workspace.read(scaleKey,85),false);
  applyMotion();
  const opacity=document.createElement('input');opacity.type='range';opacity.id='set-calendar-opacity';opacity.min=0;opacity.max=90;opacity.step=5;opacity.value=Workspace.read('terminal_calendar_transparency_v1',0);opacity.setAttribute('aria-label','Calendar transparency');const opacityValue=document.createElement('span');opacityValue.className='chart-range-value';const opacityGroup=document.createElement('div');opacityGroup.className='settings-range-aligned';opacityGroup.append(opacity,opacityValue);opacity.oninput=()=>{document.documentElement.style.setProperty('--calendar-opacity',String(1-opacity.value/100));Workspace.write('terminal_calendar_transparency_v1',+opacity.value);opacityValue.textContent=opacity.value+'%';};add('Calendar transparency',opacityGroup);opacity.oninput();
  const songToast=document.createElement('input');songToast.type='checkbox';songToast.id='set-music-toast';songToast.checked=Workspace.read('terminal_music_toast_v1',true);songToast.onchange=()=>Workspace.write('terminal_music_toast_v1',songToast.checked);add('Show song-change notification (2 seconds)',songToast);
  if(typeof TerminalLanguage!=='undefined')TerminalLanguage.markup(controls);
  // Keep vendor notices and a product link, outside the Settings dialog.
  modal.querySelector('.library-credit')?.remove();
  const credit=document.createElement('a');credit.id='terminal-library-link';credit.href='https://www.tradingview.com/';credit.target='_blank';credit.rel='noopener noreferrer';credit.title='TradingView Lightweight Charts™';credit.textContent='TradingView';document.querySelector('.bottom-ranges')?.appendChild(credit);
  // Dismiss only the small popup being clicked away from; never the large Settings dialog.
  const small=['#layout-popover','.toolbar-overflow','.chart-context-menu','.drawing-menu','.tool-submenu','.drawing-more'];
  document.addEventListener('pointerdown',e=>{if(e.target.closest('#btn-layout,.toolbar-more,[data-menu],.tool-group'))return;for(const node of document.querySelectorAll(small.join(',')))if(!node.contains(e.target)){if(node.matches('.toolbar-overflow,.drawing-more'))node.hidden=true;else node.classList.remove('show');}},true);
  // The drawing rail is attached to the viewport; ignore legacy floating coordinates.

};

TerminalFeatures.prototype.installChartDividers=function(grid,charts){
  this.removeChartDividers?.();
  const panels=charts.map(element=>({element,rect:element.getBoundingClientRect(),widthOffset:0,leftOffset:0}));
  const dividers=[];
  const gap=parseFloat(getComputedStyle(grid).columnGap)||0;

  const positionDividers=()=>{
    if(grid.dataset.expanded)return;
    const bounds=grid.getBoundingClientRect();
    const positions=dividers.map(({left,right})=>[left.element.getBoundingClientRect(),right.element.getBoundingClientRect()]);
    dividers.forEach(({handle},i)=>{
      const [left,right]=positions[i];
      handle.style.left=((left.right+right.left)/2-bounds.left)+'px';
      handle.style.top=(left.top-bounds.top)+'px';
      handle.style.height=left.height+'px';
    });
  };

  const setPanelWidth=(panel)=>{
    panel.element.style.setProperty('--chart-width-adjustment',panel.widthOffset+'cqw');
    panel.element.style.setProperty('--chart-left-adjustment',panel.leftOffset+'cqw');
  };

  const measure=(left,right)=>{
    const leftWidth=left.element.getBoundingClientRect().width;
    const rightWidth=right.element.getBoundingClientRect().width;
    return {leftWidth,rightWidth,leftOffset:left.widthOffset,rightOffset:right.widthOffset,rightStart:right.leftOffset};
  };
  const resizePair=(left,right,start,delta)=>{
    const min=Math.min(120,start.leftWidth,start.rightWidth);
    const width=grid.getBoundingClientRect().width;
    if(!width)return;
    const change=100*Math.max(min-start.leftWidth,Math.min(start.rightWidth-min,delta))/width;
    left.widthOffset=start.leftOffset+change;
    right.widthOffset=start.rightOffset-change;
    right.leftOffset=start.rightStart+change;
    setPanelWidth(left);
    setPanelWidth(right);
    positionDividers();
  };

  for(const left of panels){
    const right=panels.find(panel=>panel!==left
      && Math.abs(panel.rect.left-left.rect.right-gap)<1
      && Math.abs(panel.rect.top-left.rect.top)<1
      && Math.abs(panel.rect.bottom-left.rect.bottom)<1);
    if(!right)continue;

    const handle=document.createElement('div');
    handle.className='chart-grid-divider';
    handle.tabIndex=0;
    handle.setAttribute('role','separator');
    handle.setAttribute('aria-orientation','vertical');
    handle.setAttribute('aria-label','Resize adjacent charts');
    grid.appendChild(handle);
    dividers.push({handle,left,right});

    handle.onpointerdown=event=>{
      if(event.button!==0)return;
      event.preventDefault();
      const start=measure(left,right);
      const origin=event.clientX;
      handle.setPointerCapture(event.pointerId);
      handle.classList.add('dragging');
      handle.onpointermove=move=>{
        if(move.pointerId===event.pointerId)resizePair(left,right,start,move.clientX-origin);
      };
    };
    handle.onlostpointercapture=()=>{
      handle.onpointermove=null;
      handle.classList.remove('dragging');
    };
    handle.onkeydown=event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();
      resizePair(left,right,measure(left,right),event.key==='ArrowLeft'?-12:12);
    };
  }
  positionDividers();
  const observer=new ResizeObserver(positionDividers);
  observer.observe(grid);
  const expandedObserver=new MutationObserver(positionDividers);
  expandedObserver.observe(grid,{attributes:true,attributeFilter:['data-expanded']});
  this.removeChartDividers=()=>{
    observer.disconnect();
    expandedObserver.disconnect();
    for(const {handle} of dividers)handle.remove();
    for(const {element} of panels){
      element.style.removeProperty('--chart-width-adjustment');
      element.style.removeProperty('--chart-left-adjustment');
    }
  };
};

/* One theme-aware listbox for every native select inside a settings sheet.
   The original select remains the value/event owner for existing settings code. */
(function installSettingsSelects(){
 if(typeof HTMLSelectElement==='undefined'||typeof HTMLDivElement==='undefined'||!HTMLDivElement.prototype.showPopover)return;
 const scope='#settings-modal,#qt-settings-modal,#drawing-settings,.indicator-settings-modal,#replay-toolbar';
 const menu=document.createElement('div');menu.id='settings-select-menu';menu.className='terminal-select-menu settings-select-menu';menu.setAttribute('popover','manual');menu.setAttribute('role','listbox');document.body.appendChild(menu);
 let owner=null,search='',searchTimer,dismissClick=false;
 const opened=()=>menu.matches(':popover-open');
 document.addEventListener('terminal-settings-dismiss',()=>close());
 const ownerWatch=new MutationObserver(()=>{
  if(!owner)return;
  const panel=owner.closest(scope);
  const active=typeof TerminalSettingsPanels!=='undefined'?TerminalSettingsPanels.active?.owner:null;
  const activePanel=active?.modal||active?.root;
  if(panel?.id!=='replay-toolbar'&&activePanel&&activePanel!==panel){close();return;}
  if(!owner.isConnected||!panel||!panel.classList.contains('show')||panel.closest('[hidden],[inert]')||owner.getClientRects().length===0)close();
 });
 function close(focus=false){
  const select=owner;owner=null;ownerWatch.disconnect();clearTimeout(searchTimer);
  if(opened())menu.hidePopover();select?.setAttribute('aria-expanded','false');
  if(focus&&select?.isConnected)select.focus();
 }
 function options(){return [...menu.querySelectorAll('button[role="option"]:not(:disabled)')];}
 function open(select){
  close();owner=select;search='';
  menu.replaceChildren();menu.setAttribute('aria-label',select.getAttribute('aria-label')||'Options');
  select.setAttribute('aria-controls',menu.id);select.setAttribute('aria-expanded','true');
  [...select.options].forEach((option,index)=>{
   if(option.hidden)return;
   const button=document.createElement('button');button.type='button';button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===select.selectedIndex));
   button.disabled=option.disabled||option.parentElement?.disabled===true;
   const label=document.createElement('span'),check=document.createElement('span');
   const asset=select.classList.contains('settings-asset-select')?window.TerminalAssets?.info(option.value):null;
   if(asset){
    label.className='settings-asset-label';const image=document.createElement('img');image.src=asset.icon;image.alt='';
    const text=document.createElement('span');text.textContent=asset.symbol;label.append(image,text);button.title=option.value;
   }else if(!window.TerminalSettingVisuals?.optionLabel(select,option,label))label.textContent=option.label;
   check.textContent=index===select.selectedIndex?'✓':'';check.setAttribute('aria-hidden','true');button.append(label,check);
   button.addEventListener('click',()=>{
    const changed=select.selectedIndex!==index;close();
    if(changed){select.selectedIndex=index;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
    if(select.isConnected)select.focus();
   });menu.appendChild(button);
  });
  menu.showPopover();
  const rect=select.getBoundingClientRect();
  // Measure single-line option text before fitting the menu inside the viewport.
  menu.style.width='max-content';menu.style.maxWidth=(innerWidth-16)+'px';
  const textWidth=Math.max(0,...[...menu.querySelectorAll('button > span:first-child')].map(label=>label.scrollWidth));
  const kind=menu.querySelector('.settings-option-visual')?.dataset.visualKind;
  menu.dataset.visualKind=kind||'text';
  const visualWidths={line:144,shape:110,position:156,labelPosition:148,timing:232,size:208,markerSize:208,timezone:240,extend:220,asset:200};
  const ctx=document.createElement('canvas').getContext('2d');ctx.font=getComputedStyle(select).font;
  const labelWidth=Math.max(0,...[...select.options].map(o=>ctx.measureText(o.label).width));
  const width=Math.min(innerWidth-16,rect.width);
  menu.style.width=width+'px';menu.style.maxHeight=Math.min(300,innerHeight-24)+'px';
  const height=menu.getBoundingClientRect().height,below=innerHeight-rect.bottom-8,above=rect.top-8;
  const upwards=below<Math.min(height,180)&&above>below;
  menu.style.maxHeight=Math.max(40,Math.min(300,upwards?above-6:below-6))+'px';
  menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-width-8))+'px';
  menu.style.top=(upwards?Math.max(8,rect.top-menu.getBoundingClientRect().height-5):rect.bottom+5)+'px';
  const selected=menu.querySelector('[aria-selected="true"]:not(:disabled)')||options()[0];selected?.focus({preventScroll:true});if(selected)menu.scrollTop=Math.max(0,selected.offsetTop-menu.clientHeight/2);
  ownerWatch.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','inert']});
 }
 document.addEventListener('pointerdown',event=>{
  dismissClick=false;
  if(opened()&&!menu.contains(event.target)){
   close();dismissClick=true;event.preventDefault();event.stopImmediatePropagation();return;
  }
  const select=event.target.closest?.('select');
  if(event.button!==0||!select||select.disabled||select.multiple||!select.closest(scope))return;
  event.preventDefault();event.stopPropagation();select.focus({preventScroll:true});
 },true);
 document.addEventListener('click',event=>{
  if(dismissClick){dismissClick=false;event.preventDefault();event.stopImmediatePropagation();return;}
  if(opened()&&!menu.contains(event.target)){
   close();event.preventDefault();event.stopImmediatePropagation();return;
  }
  const select=event.target.closest?.('select');
  if(!select||select.disabled||select.multiple||!select.closest(scope))return;
  event.preventDefault();event.stopPropagation();if(owner===select&&opened())close();else open(select);
 },true);
 document.addEventListener('keydown',event=>{
  if(opened()&&menu.contains(event.target)){
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);return;}
   if(event.key==='Tab'){event.stopImmediatePropagation();close(true);return;}
   if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopImmediatePropagation();document.activeElement?.closest('button[role="option"]')?.click();return;}
   const items=options(),index=items.indexOf(document.activeElement);
   if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();event.stopImmediatePropagation();
    const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();return;
   }
   if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key!==' '){
    event.preventDefault();event.stopImmediatePropagation();clearTimeout(searchTimer);search+=event.key.toLowerCase();searchTimer=setTimeout(()=>search='',600);items.find(item=>item.textContent.trim().toLowerCase().startsWith(search))?.focus();
   }
   return;
  }
  const select=event.target.closest?.('select');
  if(select&&!select.disabled&&!select.multiple&&select.closest(scope)&&['Enter',' ','ArrowDown','ArrowUp'].includes(event.key)){
   event.preventDefault();event.stopImmediatePropagation();open(select);
  }
 },true);
 menu.addEventListener('toggle',event=>{if(event.newState==='closed'&&!opened())close();});
 window.addEventListener('resize',()=>close());
 document.addEventListener('wheel',event=>{if(opened()&&!menu.contains(event.target))close();},{capture:true,passive:true});
})();
