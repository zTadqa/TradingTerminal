/* Paper account manager and ticket, backed by the persistent local ledger. */
class PaperPanel {
 constructor({paper,charts,getActive,isLive,isReplay,toast,onRender,onToggle}){
  Object.assign(this,{paper,charts,getActive,isLive,isReplay,toast,onRender,onToggle});this.root=document.getElementById('paper-panel');this.tab='positions';this.editing=null;
  this.root.innerHTML=`<div class="paper-resize" role="separator" aria-label="Resize Paper" tabindex="0"></div><header class="paper-heading"><div class="paper-brand"><strong>Paper</strong><small class="paper-mode-badge" hidden>REPLAY</small></div><div class="paper-head-actions"><button type="button" class="paper-close" aria-label="Close Paper">×</button></div><div class="paper-account-group"><select id="paper-account" aria-label="Tài khoản"></select><button id="btn-new-account" type="button" class="paper-head-btn" title="Tạo tài khoản mới">+ Tài khoản</button></div></header><div class="paper-setup"><strong>Chưa có tài khoản mô phỏng</strong><button id="paper-setup-account" type="button" class="btn-primary">Tạo tài khoản demo</button></div><div id="paper-balance" class="paper-summary"></div><div class="paper-workspace"><form class="paper-ticket"><div class="paper-ticket-title"><div class="paper-sym-pill"><strong id="paper-symbol"></strong></div><span id="paper-quote-status"></span></div><div class="paper-type-seg" role="tablist" aria-label="Loại lệnh"><button type="button" data-order-type="market" class="active">Market</button><button type="button" data-order-type="limit">Limit</button><button type="button" data-order-type="stop">Stop</button></div><select id="order-type" hidden aria-hidden="true"><option value="market">Market</option><option value="limit">Limit</option><option value="stop">Stop</option></select><div class="paper-ticket-grid"><div class="paper-field paper-qty-field"><div class="paper-field-top"><span>Hợp đồng</span></div><div class="paper-qty-controls"><div class="paper-qty-chips"><button type="button" data-qty-chip="1">1</button><button type="button" data-qty-chip="2">2</button><button type="button" data-qty-chip="5">5</button><button type="button" data-qty-chip="10">10</button></div><div class="paper-qty-stepper"><button type="button" data-qty-step="-1" aria-label="Giảm hợp đồng">−</button><input id="order-qty" type="number" min="1" step="1" value="1" aria-label="Hợp đồng"><button type="button" data-qty-step="1" aria-label="Tăng hợp đồng">+</button></div></div></div><label class="paper-field paper-price-label"><span>Giá đặt lệnh</span><input id="order-price" type="number" step="any" placeholder="Nhập mức giá"></label><label class="paper-field paper-bracket-field" hidden><span>Stop Loss</span><input id="order-sl" type="number" step="any" placeholder="Tùy chọn"></label><label class="paper-field paper-bracket-field" hidden><span>Take Profit</span><input id="order-tp" type="number" step="any" placeholder="Tùy chọn"></label></div><div class="paper-estimate" id="paper-estimate" hidden></div><label class="paper-one-click-row"><span><strong>1-tap trade</strong><small>Bỏ qua xác nhận</small></span><input id="paper-one-click" type="checkbox" role="switch" aria-label="1-tap trade"><i aria-hidden="true"></i></label><div class="paper-submit"><button type="button" id="paper-sell" class="paper-side sell"><span>Sell</span></button><button type="button" id="paper-buy" class="paper-side buy"><span>Buy</span></button><button type="button" id="paper-save-edit" class="btn-primary" hidden>Lưu thay đổi</button><button type="button" id="paper-cancel-edit" class="btn-secondary" hidden>Hủy</button></div><p id="paper-error" role="status"></p><p class="paper-disclaimer" hidden></p></form><div class="paper-manager"><nav class="paper-tabs" aria-label="Paper Trading views"><button type="button" data-paper-tab="positions">Vị thế <span>0</span></button><button type="button" data-paper-tab="orders">Lệnh chờ <span>0</span></button><button type="button" data-paper-tab="history">Lịch sử <span>0</span></button></nav><div id="paper-positions" class="paper-table-scroll"></div></div></div>`;
  this.$=id=>document.getElementById(id);
  if(typeof TerminalLanguage!=='undefined')TerminalLanguage.markup(this.root);
  this.root.querySelector('.paper-close').onclick=()=>this.open(false);
  for (const id of ['btn-new-account', 'paper-setup-account']) {
   this.$(id).onclick=()=>{
    const modal=this.$('account-modal');
    modal.dataset.opener=id;
    modal.classList.add('show');
    modal.querySelector('input').focus();
   };
  }
  this.$('paper-account').onchange=e=>this.action(()=>{this.paper.select(e.target.value);this.reset();});
  this.buildAccountPicker();
  const archive=document.createElement('button');archive.type='button';archive.className='paper-head-btn';archive.textContent='Lưu Replay';archive.onclick=()=>this.exportReplay?.();this.root.querySelector('.paper-head-actions').insertBefore(archive,this.root.querySelector('.paper-close'));this.archiveButton=archive;
  this.root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();if(this.editing)this.reset();else this.open(false);}});
  for(const b of this.root.querySelectorAll('[data-paper-tab]'))b.onclick=()=>{this.tab=b.dataset.paperTab;this.render();};
  for(const b of this.root.querySelectorAll('[data-order-type]'))b.onclick=()=>{if(this.editing)return;this.$('order-type').value=b.dataset.orderType;this.$('order-type').dispatchEvent(new Event('input'));this.ticket();};
  for(const b of this.root.querySelectorAll('[data-qty-step]'))b.onclick=()=>{if(this.editing?.kind==='position')return;const next=Math.max(1,(parseInt(this.$('order-qty').value,10)||1)+Number(b.dataset.qtyStep));this.setQty(next);};
  for(const b of this.root.querySelectorAll('[data-qty-chip]'))b.onclick=()=>{if(this.editing?.kind==='position')return;this.setQty(Number(b.dataset.qtyChip));};
  this.root.addEventListener('paper-new-ticket',e=>{this.reset();this.$('order-type').value='limit';this.$('order-price').value=e.detail.price;this.open();this.ticket();});this.$('paper-buy').onclick=()=>this.submit('buy');this.$('paper-sell').onclick=()=>this.submit('sell');
  this.$('paper-one-click').onchange=e=>{
   const chart=this.getActive();
   if(this.onOneClickChange?.(chart,e.target.checked)){this.orderConfirmation?.close('cancel');}
   this.ticket();
  };
  this.$('paper-save-edit').onclick=()=>this.submit();this.$('paper-cancel-edit').onclick=()=>this.reset();
  this.root.querySelector('form').onsubmit=e=>{e.preventDefault();if(this.editing)this.submit();};
  for(const id of ['order-type','order-qty','order-price','order-sl','order-tp'])this.$(id).addEventListener('input',()=>this.ticket());
  this.observer=new MutationObserver(()=>{const isOpen=this.root.classList.contains('open');document.body.classList.toggle('paper-panel-open',isOpen);this.onToggle?.(isOpen);this.render();});this.observer.observe(this.root,{attributes:true,attributeFilter:['class']});
  const indModal=document.getElementById('indicator-modal');
  if(indModal){this.indicatorObserver=new MutationObserver(()=>{if(indModal.classList.contains('show'))this.open(false);});this.indicatorObserver.observe(indModal,{attributes:true,attributeFilter:['class']});}
  this.buildCloseDialog();this.resize();
  for(const chart of charts){chart.paperOverlay=new PaperChartOrders(this,chart);}
  this.timer=setInterval(()=>this.render(false),1000);this.render();
 }
 buildAccountPicker(){
  const select=this.$('paper-account');
  select.hidden=true;
  const trigger=document.createElement('button');
  trigger.type='button';
  trigger.className='paper-account-trigger';
  trigger.setAttribute('aria-haspopup','listbox');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','paper-account-options');
  trigger.setAttribute('aria-label','Tài khoản');
  trigger.innerHTML='<span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  select.after(trigger);
  const menu=document.createElement('div');
  menu.id='paper-account-options';
  menu.className='paper-account-options';
  menu.setAttribute('popover','auto');
  menu.setAttribute('role','listbox');
  menu.setAttribute('aria-label','Tài khoản mô phỏng');
  document.body.appendChild(menu);
  const position=()=>{
   const rect=trigger.getBoundingClientRect();
   menu.style.width=Math.min(rect.width,innerWidth-16)+'px';
   menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-menu.offsetWidth-8))+'px';
   menu.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-menu.offsetHeight-8))+'px';
  };
  trigger.onclick=()=>{
   if(menu.matches(':popover-open')){menu.hidePopover();return;}
   menu.showPopover();position();
   (menu.querySelector('[aria-selected="true"]')||menu.querySelector('button'))?.focus();
  };
  trigger.onkeydown=e=>{
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!menu.matches(':popover-open'))trigger.click();}
  };
  menu.addEventListener('toggle',()=>{
   trigger.setAttribute('aria-expanded',String(menu.matches(':popover-open')));
  });
  menu.onkeydown=e=>{
   const items=[...menu.querySelectorAll('[role="option"]')];
   let index=items.indexOf(document.activeElement);
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();menu.hidePopover();trigger.focus();return;}
   if(e.key==='Tab'){menu.hidePopover();trigger.focus();return;}
   if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
   e.preventDefault();
   index=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
   items[index]?.focus();
  };
  window.addEventListener('resize',()=>{if(menu.matches(':popover-open'))position();});
  this.accountTrigger=trigger;
  this.accountMenu=menu;
 }
 renderAccountPicker(){
  const active=this.paper.state.active;
  this.accountTrigger.querySelector('span').textContent=this.paper.account?.name||'Chọn tài khoản';
  this.accountMenu.replaceChildren();
  for(const account of this.paper.state.accounts){
   const option=document.createElement('button');
   option.type='button';
   option.setAttribute('role','option');
   option.setAttribute('aria-selected',String(account.id===active));
   const name=document.createElement('span');
   name.textContent=account.name;
   const check=document.createElement('span');
   check.setAttribute('aria-hidden','true');
   check.textContent=account.id===active?'✓':'';
   option.append(name,check);
   option.onclick=()=>{
    this.accountMenu.hidePopover();
    this.$('paper-account').value=account.id;
    this.$('paper-account').dispatchEvent(new Event('change'));
    this.accountTrigger.focus();
   };
   this.accountMenu.appendChild(option);
  }
 }
 setQty(qty){
  const v=String(Math.max(1,Math.round(qty)||1));
  this.$('order-qty').value=v;
  const iq=document.getElementById('trade-inline-qty');if(iq)iq.value=v;
  this.$('order-qty').dispatchEvent(new Event('input'));
  this.ticket();
 }
 money(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(value);}
 price(value){return Number.isFinite(value)?String(Math.round(value*1e8)/1e8):'—';}
 symbol(){return this.editing?.symbol||this.getActive().symbol;}
 guard(symbol,chart=null){
  if(this.replayBlocked)throw Error("Replay chưa sẵn sàng để giao dịch.");
  if(this.isReplay()){
   if(chart&&!chart.replayMode)throw Error('Biểu đồ đang chọn ở chế độ Live, ngoài phạm vi Replay.');
   const target=(chart&&chart.symbol===symbol&&chart.replayMode)?chart:this.charts.find(c=>c.symbol===symbol&&c.replayMode);
   if(!target)throw Error('Chart này không nằm trong phạm vi Replay.');
   this.paper.quote(symbol);return;
  }
  if(!this.isLive(symbol))throw Error('Đang chờ giá live 1m; không dùng giá cache để khớp lệnh.');
 }
 action(fn){try{fn();this.$('paper-error').textContent='';this.render();return true;}catch(error){this.$('paper-error').textContent=error.message;this.toast?.(error.message,'alert');this.render();return false;}}
 open(show=true){if(!show&&this.accountMenu.matches(':popover-open'))this.accountMenu.hidePopover();if(show)document.getElementById('indicator-modal')?.classList.remove('show');if(this.root.classList.contains('open')!==show)this.root.classList.toggle('open',show);}
 reset(){this.editing=null;this.$('order-type').value='market';for(const id of ['order-price','order-sl','order-tp'])this.$(id).value='';this.$('order-qty').value='1';const iq=document.getElementById('trade-inline-qty');if(iq)iq.value='1';this.$('paper-error').textContent='';this.ticket();}
 edit(kind,item,field){this.editing={kind,id:item.id,symbol:item.symbol,account:this.paper.state.active};this.open();this.$('order-type').value=kind==='order'?item.type:'market';this.$('order-qty').value=item.qty;for(const k of ['price','sl','tp'])this.$('order-'+k).value=item[k]??'';this.$('paper-error').textContent='';this.ticket();this.$('order-'+(field||'sl'))?.focus();}
 submit(side){this.action(()=>{const symbol=this.symbol(),origin=this.editing?null:this.getActive();this.guard(symbol,origin);const optional=id=>this.$(id).value.trim()?Number(this.$(id).value):null;const fields={qty:Number(this.$('order-qty').value),price:optional('order-price'),sl:this.editing?optional('order-sl'):null,tp:this.editing?optional('order-tp'):null};
   if(this.editing){
    if(this.editing.account!==this.paper.state.active)throw Error('Tài khoản đã đổi.');
    if(this.editing.kind==='order'){
     const existing=this.paper.account?.orders.find(o=>o.id===this.editing.id);
     if(!existing)throw Error('Lệnh chờ không còn tồn tại.');
     const next={...existing,qty:fields.qty,price:fields.price,sl:fields.sl,tp:fields.tp};
     const ref=this.paper.quote(existing.symbol);
     this.paper.validateOrder(next,existing,ref);
     this.paper.checkMargin?.(next,existing,ref);
     this.paper.amendOrder(this.editing.id,fields);
    }else this.paper.amendPosition(this.editing.id,{sl:fields.sl,tp:fields.tp});
    this.reset();
   }else this.placeFromChart(origin,{symbol,side,type:this.$('order-type').value,...fields});
   this.open();
  });}
 quickMarket(side){
  const hadAccount=!!this.paper.account;
  const ok=this.action(()=>{
   const chart=this.getActive(),symbol=chart.symbol;
   this.guard(symbol,chart);
   const qty=Number(document.getElementById('trade-inline-qty')?.value||this.$('order-qty').value);
   this.placeFromChart(chart,{symbol,side,type:'market',qty,price:null,sl:null,tp:null});
  });
  if(!ok&&!hadAccount)this.open(true);
  return ok;
 }
 placeFromChart(chart,order){
  this.guard(order.symbol,chart);
  if(!this.paper.account)throw Error('Tạo/chọn tài khoản demo trước.');
  const settings=chart.appearance||{};
  const reference=this.paper.quote(order.symbol);
  this.paper.validateOrder(order,chart.metadata,reference);
  this.paper.checkMargin?.(order,chart.metadata,reference);
  const project=settings.projectOrder&&order.type==='market';
  const execute=()=>{
   this.guard(order.symbol,chart);
   this.unlockExecutionAudio(settings);
   const item=this.paper.place(order,chart.metadata);
   if(!settings.rejectionOnly&&!this.paper.account.history.some(h=>h.id===item.id&&h.event==='filled')){
    this.toast?.('Paper order placed');
   }
  };
  if(settings.oneClick!==false&&!project){execute();return;}
  this.confirmOrder(chart,order,reference,project,execute);
 }
 confirmOrder(chart,order,reference,project,execute){
  this.orderConfirmation?.close('cancel');
  const paper=this.paper,account=paper.state.active;
  const dialog=document.createElement('dialog');
  dialog.className='paper-order-confirmation';
  this.orderConfirmation=dialog;
  const buying=order.side==='buy',sideLabel=buying?'Mua':'Bán';
  dialog.dataset.side=order.side;
  dialog.innerHTML=`<header class="poc-header"><div><div class="poc-eyebrow">PAPER TRADING</div><h2 id="paper-confirm-title">Xác nhận lệnh</h2></div><button type="button" class="poc-dismiss" aria-label="Đóng xác nhận lệnh">×</button></header>
   <section class="poc-ticket"><div class="poc-instrument"><strong class="poc-symbol"></strong><span class="poc-side"></span></div><div class="poc-price-label"></div><div class="poc-price"></div><dl class="poc-facts"><div><dt>Loại lệnh</dt><dd class="poc-type"></dd></div><div><dt>Khối lượng</dt><dd class="poc-qty"></dd></div></dl><dl class="poc-brackets" hidden></dl></section>
   <div class="poc-account"><span class="poc-account-dot" aria-hidden="true"></span><span>Tài khoản mô phỏng</span><strong></strong></div>
   <form method="dialog"><button type="submit" value="cancel" class="btn-secondary" autofocus>Hủy</button><button type="submit" value="confirm" class="btn-primary"></button></form>`;
  dialog.querySelector('.poc-symbol').textContent=order.symbol;
  dialog.querySelector('.poc-side').textContent=sideLabel;
  dialog.querySelector('.poc-price-label').textContent=order.type==='market'?'Giá tham chiếu':'Giá đặt lệnh';
  dialog.querySelector('.poc-price').textContent=this.price(order.type==='market'?reference:order.price);
  dialog.querySelector('.poc-type').textContent=({market:'Market',limit:'Limit',stop:'Stop'})[order.type]||order.type;
  dialog.querySelector('.poc-qty').textContent=order.qty+' hợp đồng';
  dialog.querySelector('.poc-account strong').textContent=paper.account?.name||'';
  dialog.querySelector('.btn-primary').textContent='Xác nhận '+sideLabel.toLowerCase();
  dialog.querySelector('.poc-dismiss').onclick=()=>dialog.close('cancel');
  const brackets=dialog.querySelector('.poc-brackets');
  for(const [key,label] of [['tp','Take profit'],['sl','Stop loss']])if(order[key]!=null){
   const row=document.createElement('div'),name=document.createElement('dt'),value=document.createElement('dd');
   name.textContent=label;value.textContent=this.price(order[key]);row.append(name,value);brackets.append(row);brackets.hidden=false;
  }
  dialog.setAttribute('aria-labelledby','paper-confirm-title');
  document.body.append(dialog);
  const header=dialog.querySelector('.poc-header'),events=new AbortController();
  let drag=null,moved=false;
  const position=(left,top)=>{
   const r=dialog.getBoundingClientRect(),pad=8;
   dialog.style.position='fixed';dialog.style.margin='0';dialog.style.right='auto';dialog.style.bottom='auto';
   dialog.style.left=Math.max(pad,Math.min(left,innerWidth-r.width-pad))+'px';
   dialog.style.top=Math.max(pad,Math.min(top,innerHeight-r.height-pad))+'px';
   moved=true;
  };
  header.title='Kéo để di chuyển';header.tabIndex=0;
  header.setAttribute('aria-label','Di chuyển hộp xác nhận lệnh');
  dialog.addEventListener('pointerdown',e=>{
   if(e.button!==0||e.target.closest('button, input, select, textarea, a, [contenteditable=true]'))return;
   e.preventDefault();
   dialog.style.animation='none';
   const r=dialog.getBoundingClientRect();position(r.left,r.top);
   drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};
   dialog.setPointerCapture(e.pointerId);dialog.classList.add('dragging');
  },{signal:events.signal});
  dialog.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.pointer)return;
   position(drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y);
  },{signal:events.signal});
  const endDrag=()=>{const current=drag;drag=null;dialog.classList.remove('dragging');if(current&&dialog.hasPointerCapture(current.pointer))dialog.releasePointerCapture(current.pointer);};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])dialog.addEventListener(type,endDrag,{signal:events.signal});
  header.addEventListener('keydown',e=>{
   if(e.target!==header||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   e.preventDefault();const r=dialog.getBoundingClientRect(),step=e.shiftKey?30:10;
   dialog.style.animation='none';position(r.left+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),r.top+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0));
  },{signal:events.signal});
  window.addEventListener('resize',()=>{if(moved){const r=dialog.getBoundingClientRect();position(r.left,r.top);}},{signal:events.signal});
  const projection=project?{...order,price:reference}:null;
  if(projection){chart.projectedOrder=projection;chart.renderDrawings();}
  window.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&!e.defaultPrevented&&!document.querySelector('.modal.show, dialog:modal')){e.preventDefault();dialog.close('cancel');}
  },{signal:events.signal});
  dialog.addEventListener('close',()=>{
   if(chart.projectedOrder===projection)chart.projectedOrder=null;
   if(this.orderConfirmation===dialog)this.orderConfirmation=null;
   chart.renderDrawings();
   endDrag();events.abort();
   const confirmed=dialog.returnValue==='confirm';
   dialog.remove();
   if(confirmed)this.action(()=>{
    if(this.paper!==paper||paper.state.active!==account||chart.symbol!==order.symbol)throw Error('Tài khoản hoặc chart đã đổi.');
    execute();
   });
  },{once:true});
  // A floating confirmation must leave charts and toolbar interactive.
  dialog.show();
 }
 reverse(chart,position){
  this.action(()=>{
   const live=this.paper.account?.positions.find(item=>item.id===position.id);
   if(!live)throw Error('Vị thế không còn tồn tại.');
   const side=live.side==='buy'?'sell':'buy';
   const quantity=this.paper.account.positions.filter(item=>item.symbol===live.symbol&&item.side===live.side).reduce((total,item)=>total+item.qty,0);
   this.placeFromChart(chart,{symbol:live.symbol,side,type:'market',qty:quantity*2});
  });
 }
 executionKind(event){
  if(!event||event.event==='filled')return 'entry';
  if(event.reason==='stop-loss')return 'sl';
  if(event.reason==='take-profit')return 'tp';
  return Number(event.pnl)<0?'sl':'tp';
 }
 playExecution(settings,kind='entry'){
  if(!settings.executionSound||!settings.executionVolume)return;
  const tone=settings.executionTone;
  if(tone==='3 Notes Reverb'||tone==='Single Chime'){
   const AudioCtx=window.AudioContext||window.webkitAudioContext;
   if(!AudioCtx)return;
   const audio=this.executionAudio||=new AudioCtx();
   if(audio.state!=='running'){audio.resume().then(()=>{if(audio.state==='running')this.playExecution(settings,kind);}).catch(()=>{});return;}
   const notes=tone==='Single Chime'?[659]:[523,659,784];
   const volume=settings.executionVolume/100*.12;
   notes.forEach((frequency,index)=>{
    const oscillator=audio.createOscillator(),gain=audio.createGain(),when=audio.currentTime+index*.085;
    oscillator.frequency.value=frequency;
    oscillator.connect(gain);gain.connect(audio.destination);
    gain.gain.setValueAtTime(volume,when);
    gain.gain.exponentialRampToValueAtTime(.001,when+.22);
    oscillator.start(when);oscillator.stop(when+.22);
   });
   return;
  }
  if(typeof Audio!=='function')return;
  const src=`assets/sounds/${kind==='sl'?'sl':kind==='tp'?'tp':'entry'}.mp3`;
  const clip=new Audio(src);
  clip.volume=Math.max(0,Math.min(1,(settings.executionVolume??60)/100));
  clip.play().catch(()=>{});
 }
 unlockExecutionAudio(settings){
  if(!settings.executionSound)return;
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(AudioCtx){const audio=this.executionAudio||=new AudioCtx();if(audio.state==='suspended')audio.resume().catch(()=>{});}
  if(typeof Audio==='function'&&!this.executionSfxCache){
   this.executionSfxCache=['entry','tp','sl'].map(k=>{const a=new Audio(`assets/sounds/${k}.mp3`);a.preload='auto';return a;});
  }
 }
 previewExecution(settings){
  const kinds=['entry','tp','sl'];
  const i=this._previewKindIdx=(this._previewKindIdx??-1)+1;
  this.playExecution({...settings,executionSound:true},kinds[i%kinds.length]);
 }
 notifyExecutions(account){
  const prior=this.executionCursor;
  const history=account?.history||[];
  this.executionCursor={paper:this.paper,id:account?.id,length:history.length,last:history.at(-1)?.id,at:history.at(-1)?.at};
  if(prior?.paper!==this.paper||prior.id!==account?.id||prior.length>history.length)return;
  const previous=history[prior.length-1];
  if(prior.length&&(previous?.id!==prior.last||previous?.at!==prior.at))return;
  const latest=history.slice(prior.length);
  const executions=latest.filter(item=>item.event==='filled'||item.event==='closed'&&item.reason!=='offset');
  if(executions.length){
   const event=executions.at(-1),chart=this.charts.find(item=>item.symbol===event.symbol)||this.getActive(),settings=chart.appearance||{};
   this.playExecution(settings,this.executionKind(event));
   if(!settings.rejectionOnly)this.toast?.(event.symbol+(event.event==='filled'?' · Paper order filled':' · Paper position closed'),'success');
  }
  for(const event of latest.filter(item=>item.event==='rejected'))this.toast?.(event.reason,'alert');
 }
 ticket(){
  const e=this.editing,active=this.getActive(),symbol=this.symbol(),q=this.paper.quotes.get(symbol);
  const chartInScope=!this.isReplay()||(e?this.charts.some(c=>c.symbol===symbol&&c.replayMode):active.replayMode);
  const fresh=!this.replayBlocked&&chartInScope&&!!q&&(this.isReplay()||(Date.now()-q.received<=5000&&this.isLive(symbol)));
  this.$('paper-symbol').textContent=symbol+(e?' · '+(e.kind==='order'?'Sửa lệnh':'SL / TP'):'');
  this.$('paper-quote-status').textContent=fresh?(this.isReplay()?'Replay · ':'Live · ')+this.price(q.price):this.isReplay()&&!chartInScope?'Ngoài Replay':this.isReplay()?'Chờ nến Replay':'Chờ giá live';
  this.$('paper-quote-status').dataset.live=String(fresh);
  this.$('paper-quote-status').hidden=fresh;
  for(const field of this.root.querySelectorAll('.paper-bracket-field'))field.hidden=!e;
  this.$('paper-one-click').checked=active.appearance?.oneClick!==false&&active.appearance?.projectOrder!==true;
  this.root.querySelector('.paper-one-click-row').hidden=!!e;
  const curType=this.$('order-type').value;
  for(const b of this.root.querySelectorAll('[data-order-type]')){b.classList.toggle('active',b.dataset.orderType===curType);b.disabled=!!e;}
  const qtyVal=Number(this.$('order-qty').value);
  for(const b of this.root.querySelectorAll('[data-qty-chip]')){b.classList.toggle('active',Number(b.dataset.qtyChip)===qtyVal);b.disabled=e?.kind==='position';}
  for(const b of this.root.querySelectorAll('[data-qty-step]'))b.disabled=e?.kind==='position';
  this.root.querySelector('.paper-type-seg').hidden=e?.kind==='position';
  this.root.querySelector('.paper-qty-field').hidden=e?.kind==='position';
  const priceWrap=this.root.querySelector('.paper-price-label');
  const hidePrice=curType==='market'||e?.kind==='position';
  priceWrap.hidden=hidePrice;
  this.$('order-type').disabled=!!e;this.$('order-qty').disabled=e?.kind==='position';this.$('order-price').disabled=hidePrice;
  this.$('paper-buy').hidden=this.$('paper-sell').hidden=!!e;this.$('paper-save-edit').hidden=this.$('paper-cancel-edit').hidden=!e;
  for(const id of ['paper-buy','paper-sell','paper-save-edit'])this.$(id).disabled=!fresh;
  const meta=this.getActive().symbol===symbol?active.metadata:this.charts.find(c=>c.symbol===symbol)?.metadata||{};
  for(const id of ['order-price','order-sl','order-tp'])this.$(id).step=meta.tickSize||'any';
  const qty=Number(this.$('order-qty').value),reference=curType==='market'?q?.price:Number(this.$('order-price').value),sl=Number(this.$('order-sl').value),tp=Number(this.$('order-tp').value);
  const est=this.$('paper-estimate');
  est.classList.remove('insufficient');
  if(qty>0&&reference>0&&meta.pointValue){
   const parts=[];
   if(sl>0)parts.push('SL '+this.money(Math.abs(reference-sl)*qty*meta.pointValue));
   if(tp>0)parts.push('TP '+this.money(Math.abs(reference-tp)*qty*meta.pointValue));
   if(sl>0&&tp>0&&Math.abs(reference-sl)>0)parts.push('R:R '+(Math.abs(tp-reference)/Math.abs(reference-sl)).toFixed(2));
   if(!parts.length)parts.push('Giá trị '+this.money(reference*qty*meta.pointValue));
   est.textContent=parts.join(' · ');
  }else{
   est.textContent=e?.kind==='position'?'Nhập mức Stop Loss hoặc Take Profit mới.':'Chọn khối lượng & mức giá để tính rủi ro.';
  }
 }
 setPaper(paper){if(this.paper===paper)return;for(const chart of this.charts)chart.paperOverlay?.cancel();this.paper=paper;this.closeModal.classList.remove('show');this.accountSignature=null;this.reset();}
 render(redraw=true){
  const tr=v=>typeof ui==='function'?ui(v):v;
  this.archiveButton.hidden=!this.isReplay();
  this.root.querySelector('.paper-mode-badge').textContent='REPLAY';
  this.root.querySelector('.paper-mode-badge').hidden=!this.isReplay();
  this.root.dataset.replay=String(!!this.isReplay());
  this.root.querySelector('.paper-disclaimer').textContent=this.isReplay()?'Khớp theo giá đóng nến 1m Replay · Tài khoản độc lập':'Khớp theo giá Last trực tiếp · Không tính phí & trượt giá';
  this.closeModal.querySelector('[data-close-confirm]').textContent=this.isReplay()?'Đóng theo giá Replay':'Đóng theo giá live';
  const a=this.paper.account,accounts=this.paper.state.accounts,signature=JSON.stringify([accounts.map(a=>[a.id,a.name]),this.paper.state.active]);
  this.root.dataset.hasAccount=String(!!a);
  this.notifyExecutions(a);
  if(signature!==this.accountSignature){this.accountSignature=signature;const select=this.$('paper-account');select.replaceChildren();if(!accounts.length)select.add(new Option('Chưa có tài khoản',''));for(const a of accounts)select.add(new Option(a.name,a.id));select.value=this.paper.state.active||'';this.renderAccountPicker();}
  const stats=this.paper.summary(),unknownMark=a?.positions.some(p=>!this.paper.quotes.has(p.symbol));const summary=this.$('paper-balance');if(!summary.children.length)for(const [key,label] of [['balance','Balance'],['equity','Equity'],['unrealized','PnL mở'],['realized','Đã chốt']]){const cell=document.createElement('div');cell.innerHTML='<small></small><strong></strong>';cell.querySelector('small').textContent=tr(label);cell.dataset.stat=key;summary.appendChild(cell);}
  for(const cell of summary.children){const value=stats[cell.dataset.stat];cell.querySelector('strong').textContent=a&&!(unknownMark&&['equity','unrealized'].includes(cell.dataset.stat))?this.money(value):'—';cell.dataset.sign=['unrealized','realized'].includes(cell.dataset.stat)?value>0?'positive':value<0?'negative':'':'';}
  for(const button of this.root.querySelectorAll('[data-paper-tab]')){const tab=button.dataset.paperTab;button.classList.toggle('active',tab===this.tab);button.setAttribute('aria-selected',String(tab===this.tab));const count=tab==='positions'?a?.positions.length:tab==='orders'?a?.orders.length:a?.history.length;const badge=button.querySelector('span');badge.textContent=count||'';badge.hidden=!count;}
  this.ticket();this.renderTable();
  if(redraw)for(const chart of this.charts){chart.pendingOrders=(a?.orders||[]).filter(p=>p.symbol===chart.symbol);chart.positions=(a?.positions||[]).filter(p=>p.symbol===chart.symbol).map(p=>({...p,type:p.side}));chart.renderDrawings();}
  this.onRender?.();
 }
 button(label,action,variant=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className='paper-row-action'+(variant?' '+variant:'');b.onclick=action;return b;}
 renderTable(){
  const list=this.$('paper-positions'),a=this.paper.account;
  if(list.contains(document.activeElement)){for(const node of list.querySelectorAll('[data-paper-pnl]')){const p=a?.positions.find(p=>p.id===node.dataset.paperPnl);if(p)node.textContent=this.money(this.paper.pnl(p));}return;}
  list.replaceChildren();const records=this.tab==='positions'?a?.positions||[]:this.tab==='orders'?a?.orders||[]:[...(a?.history||[])].reverse().slice(0,200);
  if(!records.length){
   const empty=document.createElement('div');empty.className='paper-empty';
   empty.innerHTML='<strong></strong>';
   empty.querySelector('strong').textContent=this.tab==='positions'?'Không có vị thế đang mở':this.tab==='orders'?'Không có lệnh chờ khớp':'Chưa có lịch sử giao dịch';
   list.appendChild(empty);return;
  }
  const table=document.createElement('table'),head=document.createElement('thead'),body=document.createElement('tbody');const headers=this.tab==='history'?['Thời gian','Mã','Trạng thái','Chiều','HĐ','Giá','PnL / Lý do']:['Mã','Chiều','HĐ','Giá vào','SL','TP',this.tab==='positions'?'PnL mở':'Loại',''];head.innerHTML='<tr>'+headers.map(t=>'<th>'+t+'</th>').join('')+'</tr>';table.append(head,body);
  for(const item of records){const row=document.createElement('tr'),values=this.tab==='history'?[new Date(item.at||item.created).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})+' · '+new Date(item.at||item.created).toLocaleDateString('vi-VN'),item.symbol,({'placed':'Đặt lệnh','filled':'Đã khớp','closed':'Đã đóng','cancelled':'Đã hủy','modified':'Sửa lệnh','modified-position':'Sửa SL/TP','rejected':'Từ chối'}[item.event]||item.event),item.side==='buy'?'LONG':item.side==='sell'?'SHORT':(item.side||'—'),item.qty,this.price(item.exit??item.price),item.pnl!=null?(item.pnl>=0?'+':'')+this.money(item.pnl)+(item.reason?' · '+({'offset':'Đảo chiều','stop-loss':'Stop Loss','take-profit':'Take Profit','manual':'Đóng tay'}[item.reason]||item.reason):''):item.reason||'—']:[item.symbol,item.side==='buy'?'LONG':'SHORT',item.qty,this.price(item.price),this.price(item.sl),this.price(item.tp),this.tab==='positions'?(this.paper.quotes.has(item.symbol)?(this.paper.pnl(item)>=0?'+':'')+this.money(this.paper.pnl(item)):'—'):item.type.toUpperCase()];
   for(let i=0;i<values.length;i++){
    const td=document.createElement('td');
    if((this.tab!=='history'&&i===1)||(this.tab==='history'&&i===3&&item.side)){
     const pill=document.createElement('span');pill.className='paper-side-pill';pill.dataset.side=item.side;pill.textContent=values[i];td.appendChild(pill);td.dataset.side=item.side;
    }else{
     td.textContent=values[i];
    }
    if(this.tab==='positions'&&i===6){const pnl=this.paper.pnl(item);td.dataset.paperPnl=item.id;td.dataset.sign=pnl>0?'positive':pnl<0?'negative':'';}
    if(this.tab==='history'&&i===6&&item.pnl!=null){td.dataset.sign=item.pnl>0?'positive':item.pnl<0?'negative':'';}
    row.appendChild(td);
   }
   if(this.tab!=='history'){const actions=document.createElement('td');actions.className='paper-actions-cell';actions.append(this.button(this.tab==='positions'?'SL / TP':'Sửa',()=>this.edit(this.tab==='positions'?'position':'order',item)));actions.append(this.button(this.tab==='positions'?'Đóng':'Hủy',()=>this.tab==='positions'?this.closeDialog(item):this.action(()=>this.paper.cancel(item.id)),'danger'));row.appendChild(actions);}body.appendChild(row);
  }
  list.appendChild(table);if(this.tab==='history'&&(a?.history.length||0)>200){const note=document.createElement('small');note.textContent='Hiển thị 200 giao dịch gần nhất · Nhấn CSV để tải toàn bộ.';list.appendChild(note);}
 }
 buildCloseDialog(){this.closeModal=document.createElement('div');this.closeModal.className='modal';this.closeModal.setAttribute('role','dialog');this.closeModal.setAttribute('aria-modal','true');this.closeModal.setAttribute('aria-label','Đóng vị thế mô phỏng');this.closeModal.innerHTML='<div class="modal-content paper-close-dialog"><div class="modal-header"><span>Đóng vị thế</span><button class="modal-close" aria-label="Hủy đóng vị thế">×</button></div><div class="modal-body"><p class="paper-close-description"></p><label>Số hợp đồng đóng<input type="number" min="1" step="1" aria-label="Số hợp đồng đóng"></label><p class="paper-close-error" role="status"></p></div><div class="modal-footer"><button class="btn-secondary" data-close-cancel>Hủy</button><button class="btn-primary" data-close-confirm>Đóng theo giá live</button></div></div>';document.body.appendChild(this.closeModal);for(const b of this.closeModal.querySelectorAll('.modal-close,[data-close-cancel]'))b.onclick=()=>this.closeModal.classList.remove('show');this.closeModal.querySelector('[data-close-confirm]').onclick=()=>{try{if(this.closeTarget.account!==this.paper.state.active)throw Error('Tài khoản đã đổi.');this.guard(this.closeTarget.symbol);this.paper.close(this.closeTarget.id,'manual',Number(this.closeModal.querySelector('input').value));this.closeModal.classList.remove('show');this.render();}catch(error){this.closeModal.querySelector('.paper-close-error').textContent=error.message;}};this.closeModal.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();this.closeModal.classList.remove('show');}};}
 closeDialog(p){this.closeTarget={id:p.id,symbol:p.symbol,account:this.paper.state.active};this.closeModal.querySelector('.paper-close-description').textContent=`${p.side.toUpperCase()} ${p.qty} ${p.symbol} · Giá vào ${this.price(p.price)}. Có thể đóng một phần.`;const input=this.closeModal.querySelector('input');input.max=p.qty;input.value=p.qty;this.closeModal.querySelector('.paper-close-error').textContent='';this.closeModal.classList.add('show');input.focus();}
 resize(){const grip=this.root.querySelector('.paper-resize');let drag;const set=value=>{const maxW=typeof innerWidth==='number'&&innerWidth>500?Math.min(600,Math.round(innerWidth*.48)):520;this.width=Math.max(310,Math.min(maxW,value));this.root.style.setProperty('--paper-width',this.width+'px');document.body.style.setProperty('--paper-width',this.width+'px');};let preferred=Workspace.read('paper_panel_width_v1',390);set(preferred);window.addEventListener('resize',()=>set(preferred));grip.onpointerdown=e=>{drag={x:e.clientX,width:this.width};grip.setPointerCapture(e.pointerId);};grip.onpointermove=e=>{if(drag)set(drag.width+drag.x-e.clientX);};grip.onpointerup=grip.onpointercancel=()=>{if(drag){preferred=this.width;Workspace.write('paper_panel_width_v1',this.width);}drag=null;};grip.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();set(this.width+(e.key==='ArrowLeft'?20:-20));preferred=this.width;Workspace.write('paper_panel_width_v1',this.height=this.width);}};}
}
/* Canvas labels with DOM hit targets: TopstepX-style order lines, zones, axis tags & segmented badges. */
class PaperChartOrders {
 constructor(panel,chart){
  this.panel=panel;this.chart=chart;this.buttons=new Map();this.axisTags=new Map();this.execMarks=[];this.hoverExec=null;
  this.layer=document.createElement('div');this.layer.className='paper-chart-controls';chart.container.appendChild(this.layer);
  chart.container.addEventListener?.('pointermove',e=>this.onHoverMove(e));
  chart.container.addEventListener?.('pointerleave',()=>{if(this.hoverExec!=null){this.hoverExec=null;this.chart.renderDrawings();}});
 }
 onHoverMove(e){
  if(!this.execMarks.length){if(this.hoverExec!=null){this.hoverExec=null;this.chart.renderDrawings();}return;}
  const rect=this.chart.container.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  let hit=null,best=Infinity;
  for(const m of this.execMarks){
   const minY=Math.min(m.tipY,m.tailY)-14,maxY=Math.max(m.tipY,m.tailY)+14;
   const dx=Math.abs(mx-m.x);
   if(dx<=14&&my>=minY&&my<=maxY){
    const d=dx+Math.abs(my-(m.tipY+m.tailY)/2);
    if(d<best){best=d;hit=m.id;}
   }
  }
  if(hit!==this.hoverExec){this.hoverExec=hit;this.chart.renderDrawings();}
 }
 records(){const a=this.panel.paper.account;return {positions:(a?.positions||[]).filter(p=>p.symbol===this.chart.symbol),orders:(a?.orders||[]).filter(p=>p.symbol===this.chart.symbol)};}
 isLightChart(){
  const hex=String(this.chart.appearance?.bg||this.chart.config?.bg||'#c2baae').replace('#','');
  if(!/^[\da-f]{6}$/i.test(hex))return true;
  const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.42;
 }
 formatAxisPrice(price){
  if(typeof ChartContextMenu!=='undefined'&&ChartContextMenu.formatPrice)return ChartContextMenu.formatPrice(price,this.chart.metadata,this.chart.appearance);
  return this.panel.price(price);
 }
 entryStartX(position,width){
  const bars=this.chart.bars||[],scale=this.chart.chart.timeScale();
  if(!bars.length)return 0;
  let ts=position.created?position.created/1000:null;
  if(!Number.isFinite(ts)){
   const filled=this.panel.paper.account?.history?.findLast(h=>h.id===position.id&&h.event==='filled');
   if(filled?.at)ts=filled.at/1000;
  }
  if(!Number.isFinite(ts))return Math.max(0,Math.round(width*.25));
  if(ts<=bars[0].time){const x0=scale.timeToCoordinate(bars[0].time);return x0!==null?Math.max(0,Math.min(width,x0)):0;}
  let lo=0,hi=bars.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(bars[mid].time<=ts)lo=mid+1;else hi=mid;}
  const bar=bars[Math.max(0,lo-1)];
  const x=bar?scale.timeToCoordinate(bar.time):null;
  if(x!==null)return Math.max(0,Math.min(width,x));
  const range=scale.getVisibleLogicalRange();
  if(range&&lo-1<range.from)return 0;
  return Math.max(0,width);
 }
 hitButton(key,record,kind,price,x,y,w,h,label,title,cursor){
  let button=this.buttons.get(key);
  if(!button){
   button=document.createElement('button');button.type='button';button.className='paper-chart-hit';button.dataset.key=key;
   button.onkeydown=e=>{
    if(e.key==='Enter'||e.key===' '){
     e.preventDefault();e.stopPropagation();
     const current=this.find(record.id);if(!current)return;
     const k=button.dataset.kind;if(k==='qty')return;
     if(k==='close'){if(this.chart.appearance?.oneClick!==false)this.panel.action(()=>{this.panel.guard(current.symbol);this.panel.paper.close(current.id,'manual');});else this.panel.closeDialog(current);}
     else if(k==='reverse')this.panel.reverse(this.chart,current);
     else if(k==='delsl')this.panel.action(()=>{this.panel.guard(current.symbol);this.panel.paper.amendPosition(current.id,{sl:null});});
     else if(k==='deltp')this.panel.action(()=>{this.panel.guard(current.symbol);this.panel.paper.amendPosition(current.id,{tp:null});});
     else if(k==='cancel')this.panel.action(()=>{this.panel.paper.cancel(current.id);});
     else this.panel.edit(k==='price'?'order':'position',current,k==='price'?'price':k==='entry'?'sl':k);
    }
   };
   button.onpointerdown=e=>this.start(e,record.id,button.dataset.kind);
   button.onpointermove=e=>this.move(e);
   button.onpointerup=e=>this.end(e);
   button.onpointercancel=()=>this.cancel();
   button.onlostpointercapture=()=>{if(this.drag)this.cancel();};
   this.layer.appendChild(button);this.buttons.set(key,button);
  }
  button.setAttribute('aria-label',label+' '+this.panel.price(price));
  button.title=title;button.dataset.id=record.id;button.dataset.kind=kind;
  button.hidden=false;
  Object.assign(button.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',cursor});
 }
 entryMetrics(){
  const dpr=typeof window!=='undefined'?window.devicePixelRatio||1:1;
  const q=v=>Math.round(v*dpr)/dpr;
  const line=1/dpr;
  return {dpr,line,h:q(16),font:'600 8px "Trebuchet MS", "Fira Sans", sans-serif'};
 }
 entryWidth(ctx,seg){
  const {font}=this.entryMetrics();ctx.font=font;
  if(seg.closeIcon)return 17;
  return Math.max(seg.grip?66:18,Math.ceil(ctx.measureText(seg.text).width)+(seg.grip?16:8));
 }
 drawEntryTag(ctx,x,y,segments){
  const {dpr,line,h,font}=this.entryMetrics(),rect=this.chart.container.getBoundingClientRect();
  x=Math.round((rect.left+x)*dpr)/dpr-rect.left;
  const top=Math.round((rect.top+y-h/2)*dpr)/dpr-rect.top;
  const cy=top+h/2,totalW=segments.reduce((n,seg)=>n+this.entryWidth(ctx,seg),0),boxes=[];
  ctx.save();ctx.font=font;ctx.textBaseline='middle';ctx.textAlign='center';ctx.setLineDash([]);
  const rounded=Math.abs(dpr-Math.round(dpr))<.01&&typeof ctx.roundRect==='function';
  if(rounded){ctx.beginPath();ctx.roundRect(x,top,totalW,h,1);ctx.clip();}
  let cur=x;
  for(let i=0;i<segments.length;i++){
   const seg=segments[i],w=this.entryWidth(ctx,seg);
   ctx.fillStyle=seg.bg;ctx.fillRect(cur,top,w,h);
   if(seg.grip){
    ctx.fillStyle='#000';
    for(let dot=0;dot<4;dot++)ctx.fillRect(cur+2,cy-3+dot*2,1/dpr,1/dpr);
   }
   if(seg.closeIcon){
    ctx.strokeStyle='#222';ctx.lineWidth=1/dpr;ctx.lineCap='butt';
    const cx=cur+w/2;ctx.beginPath();ctx.moveTo(cx-2.5,cy-2.5);ctx.lineTo(cx+2.5,cy+2.5);ctx.moveTo(cx+2.5,cy-2.5);ctx.lineTo(cx-2.5,cy+2.5);ctx.stroke();
   }else{ctx.fillStyle=seg.grip?'#fff':'#111';ctx.fillText(seg.text,cur+w/2,cy);}
   if(i){ctx.fillStyle='#000';ctx.fillRect(cur,top,line,h);}
   boxes.push({x:cur,y:top,w,h,seg});cur+=w;
  }
  ctx.strokeStyle='#000';ctx.lineWidth=line;
  if(rounded){ctx.beginPath();ctx.roundRect(x+line/2,top+line/2,totalW-line,h-line,1);ctx.stroke();}
  else ctx.strokeRect(x+line/2,top+line/2,totalW-line,h-line);
  (this.priceBadgeBounds??=[]).push({left:x,right:x+totalW,top,bottom:top+h});
  ctx.restore();return {boxes,totalW};
 }
 drawSegmented(ctx,x,y,segments){
  if(segments[0]?.entryUI)return this.drawEntryTag(ctx,x,y,segments);
  const font='bold 11px "Trebuchet MS", "Fira Sans", sans-serif';
  ctx.font=font;
  const h=16,half=8;
  let cur=x;const boxes=[];
  for(let i=0;i<segments.length;i++){
   const seg=segments[i],pad=seg.pad??5,gw=seg.grip?8:0,w=Math.max(seg.minW||0,gw+Math.ceil(ctx.measureText(seg.text).width)+pad*2);
   ctx.fillStyle=seg.bg;ctx.fillRect(cur,y-half,w,h);
   if(seg.grip){
    ctx.fillStyle='rgba(0,0,0,.55)';
    for(const dx of [3,5.5])for(const dy of [-3.5,0,3.5])ctx.fillRect(cur+dx,y+dy-.5,1,1);
   }
   if(seg.closeIcon){
    ctx.strokeStyle='#222';ctx.lineWidth=1.1;ctx.lineCap='round';
    const cx=cur+w/2,cy=y;
    ctx.beginPath();ctx.moveTo(cx-3,cy-3);ctx.lineTo(cx+3,cy+3);ctx.moveTo(cx+3,cy-3);ctx.lineTo(cx-3,cy+3);ctx.stroke();
   }else{
    ctx.fillStyle=seg.fg||'#111';ctx.textBaseline='middle';ctx.textAlign=seg.center?'center':'left';
    ctx.fillText(seg.text,seg.center?cur+w/2:cur+gw+pad,y+.5);
   }
   if(i>0){ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cur+.5,y-half);ctx.lineTo(cur+.5,y+half);ctx.stroke();}
   boxes.push({x:cur,y:y-half,w,h,seg});
   cur+=w;
  }
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y-half+.5,cur-x-1,h-1);
  ctx.textAlign='left';
  return {boxes,totalW:cur-x};
 }
 syncAxisTag(key,price,color,textColor){
  this.visibleAxisTags.add(key);
  const options={price,color,axisLabelColor:color,axisLabelTextColor:textColor,axisLabelVisible:true,lineVisible:false,title:''};
  const signature=JSON.stringify(options),existing=this.axisTags.get(key);
  if(!existing)this.axisTags.set(key,{line:this.chart.series.createPriceLine(options),signature});
  else if(existing.signature!==signature){existing.line.applyOptions(options);existing.signature=signature;}
 }
 pruneAxisTags(){
  for(const [key,tag]of this.axisTags)if(!this.visibleAxisTags.has(key)){this.chart.series.removePriceLine(tag.line);this.axisTags.delete(key);}
 }
 drawAxisTag(ctx,width,axisW,height,y,price,bg,borderCol=null,fg='#fff',entryUI=false,key=null){
  // Reserve the axis tag area for the current-price collision layout.
  if(y!==null&&Number.isFinite(y)&&y>=0&&y<=height&&axisW>4){
   const tagHeight=Math.max(20,(this.chart.appearance?.fontSize??12)+10);
   const top=Math.max(0,Math.min(height-tagHeight,y-tagHeight/2));
   (this.axisLabelBounds??=[]).push({top,bottom:top+tagHeight});
  }
  // Use the chart's own price-axis renderer so its font and number column match ticks.
  if(entryUI&&key&&typeof this.chart.series.createPriceLine==='function'){
   this.syncAxisTag(key,price,bg,fg);return;
  }
  if(y===null||y<0||y>height||axisW<=4)return;
  ctx.save();ctx.beginPath();ctx.rect(width,0,axisW,height);ctx.clip();
  const dpr=typeof window!=='undefined'?window.devicePixelRatio||1:1,line=1/dpr;
  const tagH=16,top=Math.round(Math.max(0,Math.min(height-tagH,y-tagH/2))*dpr)/dpr;
  const text=this.formatAxisPrice(price);
  ctx.font=entryUI?'600 9px "Trebuchet MS", "Fira Sans", sans-serif':'bold 11px "Trebuchet MS", "Fira Sans", sans-serif';
  const right=Math.round((width+axisW-2)*dpr)/dpr;
  const tagW=entryUI?Math.min(axisW-4,Math.max(32,Math.ceil(ctx.measureText(text).width)+10)):axisW-2;
  const left=right-tagW;
  ctx.fillStyle=bg;
  if(entryUI&&ctx.roundRect){ctx.beginPath();ctx.roundRect(left,top,tagW,tagH,2);ctx.fill();}
  else ctx.fillRect(left,top,tagW,tagH);
  if(borderCol&&!entryUI){ctx.strokeStyle=borderCol;ctx.lineWidth=line;ctx.strokeRect(left+line/2,top+line/2,tagW-line,tagH-line);}
  ctx.fillStyle=fg;ctx.textBaseline='middle';ctx.textAlign='center';
  ctx.fillText(text,left+tagW/2,top+tagH/2,tagW-6);
  ctx.restore();
 }
 draw(ctx,rect){
  const settings=this.chart.appearance||{};
  const {positions,orders}=this.records(),seen=new Set(),axisW=this.chart.chart.priceScale('right').width()||65,width=rect.width-axisW,height=this.chart.plotBottom;
  this.visibleAxisTags=new Set();
  this.axisLabelBounds=[];
  this.priceBadgeBounds=[];
  if(Boolean(this.chart.replayMode)!==Boolean(this.panel.isReplay())){this.pruneAxisTags();for(const button of this.buttons.values())button.hidden=true;this.chart.positionCountdown?.();return;}
  const light=this.isLightChart(),green='#20a860',red='#e0301e',gray='#cccccc',closeGray='#c8c8c8';
  const entryLineCol=light?'#6b7280':'rgba(222,227,234,.85)',tpLineCol=green,orderLineCol=light?'#666666':'#e0e0e0';
  const chartRect=this.chart.container.getBoundingClientRect(),sidebar=document.getElementById('left-sidebar')?.getBoundingClientRect();
  const safeLeft=sidebar&&sidebar.width<80&&sidebar.height>sidebar.width&&sidebar.right>chartRect.left&&sidebar.left<chartRect.left+width&&sidebar.top<chartRect.bottom&&sidebar.bottom>chartRect.top?Math.max(8,sidebar.right-chartRect.left+8):8;
  const hline=(y,col,dash,x1,x2)=>{
   ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
   const dpr=typeof window!=='undefined'?window.devicePixelRatio||1:1;
   ctx.strokeStyle=col;ctx.lineWidth=.75/dpr;ctx.setLineDash(dash||[]);
   ctx.beginPath();const lineY=(Math.round(y*dpr)+.5)/dpr;ctx.moveTo(x1,lineY);ctx.lineTo(x2,lineY);ctx.stroke();
   ctx.restore();
  };
  const clampX=(x,w)=>Math.max(safeLeft,Math.min(x,Math.max(safeLeft,width-w-6)));
  const font='bold 11px "Trebuchet MS", "Fira Sans", sans-serif';
  const measureSegs=segs=>{
   ctx.save();ctx.font=font;
   if(segs[0]?.entryUI){const total=segs.reduce((n,s)=>n+this.entryWidth(ctx,s),0);ctx.restore();return total;}
   let total=0;for(const s of segs)total+=Math.max(s.minW||0,(s.grip?8:0)+Math.ceil(ctx.measureText(s.text).width)+(s.pad??5)*2);
   ctx.restore();return total;
  };
  const rightPad=width<=300?8:24;
  const orderPad=Math.min(rightPad+Math.round(Math.min(85,width*.12)),Math.max(rightPad,width-160));

  if(settings.positions!==false){
   for(const p of positions){
    const ye=this.chart.series.priceToCoordinate(p.price);
    const slPrice=this.drag?.id===p.id&&this.drag.kind==='sl'?this.drag.price:p.sl;
    const tpPrice=this.drag?.id===p.id&&this.drag.kind==='tp'?this.drag.price:p.tp;
    const ysl=slPrice!=null?this.chart.series.priceToCoordinate(slPrice):null;
    const ytp=tpPrice!=null?this.chart.series.priceToCoordinate(tpPrice):null;
    const hasQuote=this.panel.paper.quotes.has(p.symbol);
    const quotePrice=hasQuote?this.panel.paper.quotes.get(p.symbol).price:p.price;
    const pl=hasQuote?this.panel.paper.pnl(p,quotePrice):0;
    const plStr=hasQuote?(settings.pnlUnit==='Money'||!settings.pnlUnit?(pl<0?'-':'')+'$'+Math.abs(pl).toFixed(2):this.pnlText(p,quotePrice,settings.pnlUnit)):'—';

    // Paper-Entry-UI v11: Entry and brackets share cell sizes and the same right edge.
    const entrySegs=[];
    if(settings.pnl!==false&&settings.positionPnl!==false){
     entrySegs.push({text:plStr,bg:pl>=0?green:red,grip:true,kind:'entry'});
    }
    entrySegs.push({text:(p.side==='buy'?'':'-')+p.qty,bg:pl>=0?green:red,grip:!entrySegs.length,kind:'qty'});
    entrySegs.push({text:'×',bg:closeGray,minW:17,pad:0,center:true,closeIcon:true,kind:'close'});
    if(settings.reversePosition)entrySegs.push({text:'↔',bg:closeGray,minW:19,pad:0,center:true,kind:'reverse'});
    entrySegs.forEach(s=>s.entryUI=true);
    const entryTotalW=measureSegs(entrySegs);
    const entryX=clampX(width-entryTotalW-rightPad,entryTotalW);

    // 1. Bracket Lines, Labels & Axis Tags (SL & TP)
    const drawBracket=(kind,price,y,lineCol,badgeBg,qtyBg,qtyText)=>{
     if(y===null||y<0||y>height||price==null)return;
     const v=this.panel.paper.pnl(p,price);
     const vStr=settings.bracketValue&&settings.bracketValue!=='Money'?this.pnlText(p,price,settings.bracketValue):'~ '+(v<0?'-':'')+'$'+Math.abs(v).toFixed(2);
     const segs=[];
     if(settings.pnl!==false&&settings.bracketPnl!==false)segs.push({text:vStr,bg:badgeBg,grip:true,kind});
     else segs.push({text:kind.toUpperCase()+' '+this.formatAxisPrice(price),bg:badgeBg,grip:true,kind});
     segs.push({text:qtyText,bg:qtyBg,kind:'qty'});
     segs.push({text:'×',bg:closeGray,minW:17,pad:0,center:true,closeIcon:true,kind:'del'+kind});
     segs.forEach(s=>s.entryUI=true);
     const totalW=measureSegs(segs);
     const bx=clampX(width-totalW-rightPad,totalW);
     hline(y,lineCol,[5,3],0,width);
     ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
     const {boxes}=this.drawSegmented(ctx,bx,y,segs);
     ctx.restore();
     this.drawAxisTag(ctx,width,axisW,height,y,price,kind==='tp'?green:red,null,'#fff',true,p.id+':'+kind);
     const bodyBoxes=boxes.filter(b=>b.seg.kind===kind);
     const bodyW=bodyBoxes.reduce((n,b)=>n+b.w,0);
     const delBox=boxes.find(b=>b.seg.kind==='del'+kind);
     const qtyBox=boxes.find(b=>b.seg.kind==='qty');
     if(qtyBox){const key=p.id+':'+kind+'qty';seen.add(key);this.hitButton(key,p,'qty',price,qtyBox.x,qtyBox.y,qtyBox.w,qtyBox.h,'Số lượng '+p.qty,'Số lượng '+p.qty,'default');}
     if(bodyBoxes.length){
      const k1=p.id+':'+kind;seen.add(k1);
      this.hitButton(k1,p,kind,price,bodyBoxes[0].x,bodyBoxes[0].y,bodyW,bodyBoxes[0].h,kind.toUpperCase()+' '+vStr,'Kéo để sửa '+kind.toUpperCase(),'ns-resize');
     }
     if(delBox){
      const k2=p.id+':del'+kind;seen.add(k2);
      this.hitButton(k2,p,'del'+kind,price,delBox.x,delBox.y,delBox.w,delBox.h,'Xóa '+kind.toUpperCase(),'Xóa '+kind.toUpperCase(),'pointer');
     }
    };
    if(slPrice!=null)drawBracket('sl',slPrice,ysl,red,red,red,String(p.qty));
    if(tpPrice!=null)drawBracket('tp',tpPrice,ytp,tpLineCol,green,green,String(p.qty));

    // 3. Entry Line, Label, Close/Reverse & Direct drag-to-set TP/SL from PnL
    if(ye!==null&&ye>=0&&ye<=height){
     hline(ye,entryLineCol,[5,3],0,width);
     ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
     const {boxes}=this.drawSegmented(ctx,entryX,ye,entrySegs);
     ctx.restore();
     this.drawAxisTag(ctx,width,axisW,height,ye,p.price,pl>=0?green:red,null,'#fff',true,p.id+':entry');
     const entryBoxes=boxes.filter(b=>b.seg.kind==='entry');
     if(entryBoxes.length){
      const ek=p.id+':entry';seen.add(ek);
      this.hitButton(ek,p,'entry',p.price,entryBoxes[0].x,entryBoxes[0].y,entryBoxes.reduce((n,b)=>n+b.w,0),entryBoxes[0].h,`${p.side.toUpperCase()} ${p.qty} · ${plStr}`,'Kéo lên/xuống để đặt TP/SL · Bấm để sửa vị thế','ns-resize');
     }
     const qtyBox=boxes.find(b=>b.seg.kind==='qty');
     if(qtyBox){const key=p.id+':entryqty';seen.add(key);this.hitButton(key,p,'qty',p.price,qtyBox.x,qtyBox.y,qtyBox.w,qtyBox.h,'Số lượng '+p.qty,'Số lượng '+p.qty,'default');}
     const closeBox=boxes.find(b=>b.seg.kind==='close');
     if(closeBox){
      const ck=p.id+':close';seen.add(ck);
      this.hitButton(ck,p,'close',p.price,closeBox.x,closeBox.y,closeBox.w,closeBox.h,'Đóng vị thế',settings.oneClick!==false?'Đóng vị thế ngay (1-click)':'Đóng vị thế','pointer');
     }
     const revBox=boxes.find(b=>b.seg.kind==='reverse');
     if(revBox){
      const rk=p.id+':reverse';seen.add(rk);
      this.hitButton(rk,p,'reverse',p.price,revBox.x,revBox.y,revBox.w,revBox.h,'Đảo chiều','Đảo chiều vị thế','pointer');
     }
    }
   }

   // 4. Pending Orders (Limit / Stop)
   for(const o of orders){
    const price=this.drag?.id===o.id?this.drag.price:o.price;
    const y=this.chart.series.priceToCoordinate(price);
    if(y===null||y<0||y>height)continue;
    const typeLabel=(o.type==='limit'?'Limit':'Stop')+' '+(o.side==='buy'?'Buy':'Sell');
    const segs=[
     {text:typeLabel,bg:gray,grip:true,kind:'price'},
     {text:(o.side==='buy'?'':'-')+o.qty,bg:o.side==='buy'?green:red,kind:'price'},
     {text:'×',bg:closeGray,minW:17,pad:0,center:true,closeIcon:true,kind:'cancel'}
    ];
    const totalW=measureSegs(segs);
    const ox=clampX(width-totalW-orderPad,totalW);
    hline(y,orderLineCol,null,settings.extendedLines===false?ox:0,settings.extendedLines===false?ox+totalW:width);
    ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
    const {boxes}=this.drawSegmented(ctx,ox,y,segs);
    ctx.restore();
    this.drawAxisTag(ctx,width,axisW,height,y,price,gray,null,'#111');
    const bodyBoxes=boxes.filter(b=>b.seg.kind==='price');
    if(bodyBoxes.length){
     const ok=o.id+':price';seen.add(ok);
     this.hitButton(ok,o,'price',price,bodyBoxes[0].x,Math.max(0,y-9),bodyBoxes.reduce((n,b)=>n+b.w,0),18,`${typeLabel} ${o.qty}`,'Kéo để sửa giá lệnh chờ','ns-resize');
    }
    const cancelBox=boxes.find(b=>b.seg.kind==='cancel');
    if(cancelBox){
     const ck=o.id+':cancel';seen.add(ck);
     this.hitButton(ck,o,'cancel',price,cancelBox.x,Math.max(0,y-9),cancelBox.w,18,'Hủy lệnh chờ','Hủy lệnh chờ','pointer');
    }
   }
  }
  this.pruneAxisTags();
  this.drawExecutions(ctx,width,height,settings);
  this.drawProjectedOrder(ctx,width,height);
  this.chart.positionCountdown?.();
  for(const [key,button]of this.buttons)if(!seen.has(key)){button.remove();this.buttons.delete(key);}
 }
 pnlText(position,price,unit){
  const points=(price-position.price)*(position.side==='buy'?1:-1);
  if(unit==='Ticks'&&position.tickSize>0)return (points/position.tickSize).toFixed(1)+' ticks';
  if(unit==='Percentage')return (100*points/position.price).toFixed(2)+'%';
  return this.panel.money(this.panel.paper.pnl(position,price));
 }
 drawProjectedOrder(ctx,width,height){
  const order=this.chart.projectedOrder;
  if(!order)return;
  const y=this.chart.series.priceToCoordinate(order.price);
  if(y===null||y<0||y>height)return;
  ctx.save();
  ctx.strokeStyle=ctx.fillStyle='#edc284';
  ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();
  ctx.font='12px "Trebuchet MS", "Fira Sans", sans-serif';
  ctx.fillText(order.side.toUpperCase()+' '+order.qty+' · Projected market order',12,Math.max(12,y-5));
  ctx.restore();
 }
 static executionLabelBox(x,y,w,h,width,height,obstacles,dir){
  if(w>width-8||h>height-8)return null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),leftMax=width-w-4,topMax=height-h-4;
  const desiredTop=y-h/2,origin=clamp(x-w/2,4,leftMax);
  const xs=new Set([origin,4,leftMax]);
  for(let d=32;d<=192;d+=32){xs.add(clamp(origin-d,4,leftMax));xs.add(clamp(origin+d,4,leftMax));}
  let best=null,cost=Infinity;
  for(const left of xs){
   const intervals=obstacles.filter(o=>o.right+4>left&&o.left-4<left+w)
    .map(o=>[o.top-h-4,o.bottom+4]).filter(v=>v[1]>=4&&v[0]<=topMax).sort((a,b)=>a[0]-b[0]);
   let cursor=4;
   const consider=end=>{
    if(end<cursor)return;
    const top=clamp(desiredTop,cursor,end),cx=left+w/2,cy=top+h/2;
    const score=Math.abs(cx-x)*1.3+Math.abs(cy-y)+(dir*(cy-y)<0?24:0);
    if(score<cost){cost=score;best={left,right:left+w,top,bottom:top+h,x:cx,y:cy};}
   };
   for(const [start,end]of intervals){consider(Math.min(topMax,start));cursor=Math.max(cursor,end);if(cursor>topMax)break;}
   consider(topMax);
  }
  return best;
 }
 drawExecutions(ctx,width,height,settings){
  this.execMarks=[];
  if(settings.executionMarks===false)return;
  const chart=this.chart,scale=chart.chart.timeScale(),bars=chart.bars;
  if(!bars.length)return;
  const theme=typeof document!=='undefined'&&document.documentElement&&typeof getComputedStyle==='function'?getComputedStyle(document.documentElement):null;
  const themeColor=(key,fallback)=>theme?.getPropertyValue(key)?.trim()||fallback;
  const labelCol=themeColor('--text',settings.textColor||'#ffffff');
  const groups=new Map();
  for(const event of this.panel.paper.account?.history||[]){
   if(event.symbol!==chart.symbol||!(event.event==='filled'||event.event==='closed'&&event.reason!=='offset'))continue;
   const time=event.at/1000;
   const date=chart.replayMode?chart.replayClock:Date.now()/1000;
   if(time<bars[0].time||time>date)continue;
   let lo=0,hi=bars.length;
   while(lo<hi){const mid=(lo+hi)>>1;if(bars[mid].time<=time)lo=mid+1;else hi=mid;}
   const bar=bars[lo-1];
   if(!bar||time>TerminalTime.end(bar,chart.currentTimeframe,chart.displaySessionMetadata?.()||chart.metadata))continue;
   const execPrice=event.event==='closed'?event.exit:event.price;
   const x=scale.timeToCoordinate(bar.time);
   const buy=event.event==='filled'?event.side==='buy':event.side==='sell';
   const anchor=chart.series.priceToCoordinate(buy?bar.low:bar.high)??chart.series.priceToCoordinate(execPrice);
   if(x===null||anchor===null||x<0||x>width)continue;
   const sk=bar.time+':'+(buy?'b':'s')+':'+event.event;
   let g=groups.get(sk);
   if(!g){g={sk,bar,x,anchor,buy,items:[]};groups.set(sk,g);}
   g.items.push({event,execPrice,qty:Number(event.qty)||0});
  }
  if(!groups.size)return;
  // Build candle obstacles in plot coordinates once, using only the visible bars.
  const obstacles=[],visible=scale.getVisibleLogicalRange?.();
  const first=visible?Math.max(0,Math.floor(visible.from)-2):0,last=visible?Math.min(bars.length-1,Math.ceil(visible.to)+2):bars.length-1;
  const spacing=scale.options?.().barSpacing||6,half=Math.max(1,Math.min(12,spacing*.4));
  for(let i=first;i<=last;i++){
   const bar=bars[i],cx=scale.timeToCoordinate(bar.time);
   if(cx===null||cx < -half||cx>width+half)continue;
   const high=chart.series.priceToCoordinate(bar.high),low=chart.series.priceToCoordinate(bar.low);
   if(high===null||low===null)continue;
   obstacles.push({left:cx-half,right:cx+half,top:Math.min(high,low),bottom:Math.max(high,low)});
  }
  // Keep text clear of all execution arrows, including ones drawn later.
  for(const g of groups.values()){
   const dir=g.buy?1:-1,tip=g.anchor+dir*6,tail=tip+dir*18;
   obstacles.push({left:g.x-6,right:g.x+6,top:Math.min(tip,tail)-2,bottom:Math.max(tip,tail)+2});
  }
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
  for(const g of groups.values()){
   const {x,anchor,buy,items}=g,count=items.length,chevrons=1;
   const dir=buy?1:-1,tipY=anchor+dir*6,step=4.5,tailY=tipY+dir*((chevrons-1)*step+18);
   const color=buy?themeColor('--accent','#2962ff'):themeColor('--trade-sell-bg','#f23645');
   const lastItem=items[items.length-1];
   const priceY=chart.series.priceToCoordinate(lastItem.execPrice);
   const id=g.sk+':'+count+':'+(lastItem.event.id||lastItem.event.at);
   const hovered=this.hoverExec===id;
   this.execMarks.push({id,x,tipY,tailY,priceY,buy,color,execPrice:lastItem.execPrice,count});
   if(hovered){
    const top=Math.min(tipY,tailY)-5,pillH=Math.abs(tailY-tipY)+10,rx=x-9,rw=18,rad=9;
    ctx.fillStyle=buy?'rgba(41,98,255,.22)':'rgba(242,54,69,.22)';
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(rx,top,rw,pillH,rad);
    else ctx.rect(rx,top,rw,pillH);
    ctx.fill();
   }
   ctx.lineCap='round';ctx.lineJoin='round';
   const strokeStacked=(col,lw)=>{
    ctx.strokeStyle=col;ctx.lineWidth=lw;
    ctx.beginPath();
    ctx.moveTo(x,tailY);ctx.lineTo(x,tipY);
    for(let k=0;k<chevrons;k++){
     const cy=tipY+dir*(k*step);
     ctx.moveTo(x-4.5,cy+dir*4.5);ctx.lineTo(x,cy);ctx.lineTo(x+4.5,cy+dir*4.5);
    }
    ctx.stroke();
   };
   strokeStacked(color,1.35);
   if(hovered&&priceY!==null&&priceY>=0&&priceY<=height){
    const strokeChevron=(col,lw)=>{
     ctx.strokeStyle=col;ctx.lineWidth=lw;
     ctx.beginPath();
     ctx.moveTo(x+5,priceY-4);ctx.lineTo(x,priceY);ctx.lineTo(x+5,priceY+4);
     ctx.stroke();
    };
    strokeChevron('#ffffff',3.8);
    strokeChevron(color,1.9);
   }
   if(settings.executionLabels!==false){
    const totalQty=items.reduce((s,it)=>s+it.qty,0);
    const avgPrice=totalQty>0?items.reduce((s,it)=>s+it.execPrice*it.qty,0)/totalQty:lastItem.execPrice;
    const decimals=Math.min(8,Math.max(2,(this.formatAxisPrice(avgPrice).split('.')[1]||'').replace(/\D/g,'').length));
    const entryPrice=new Intl.NumberFormat('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(avgPrice);
    const label=`${buy?'+':'-'} ${totalQty} @ ${entryPrice}`;
    const ly=tailY+dir*10;
    ctx.font='400 12px Arial, Helvetica, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const textWidth=Math.ceil(ctx.measureText?.(label).width||label.length*6)+4;
    const box=PaperChartOrders.executionLabelBox(x,ly,textWidth,16,width,height,obstacles,dir);
    if(box){
     obstacles.push(box);
     ctx.fillStyle=labelCol;ctx.fillText(label,box.x,box.y);
    }
   }
  }
  ctx.textAlign='left';
  ctx.restore();
 }
 find(id){const values=this.records();return values.positions.find(p=>p.id===id)||values.orders.find(p=>p.id===id);}
 start(e,id,kind){
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();const item=this.find(id);if(!item)return;
  if(kind==='qty')return;
  if(kind==='close'){if(this.chart.appearance?.oneClick!==false)this.panel.action(()=>{this.panel.guard(item.symbol,this.chart);this.panel.paper.close(item.id,'manual');});else this.panel.closeDialog(item);return;}
  if(kind==='reverse'){this.panel.reverse(this.chart,item);return;}
  if(kind==='delsl'){this.panel.action(()=>{this.panel.guard(item.symbol,this.chart);this.panel.paper.amendPosition(item.id,{sl:null});});return;}
  if(kind==='deltp'){this.panel.action(()=>{this.panel.guard(item.symbol,this.chart);this.panel.paper.amendPosition(item.id,{tp:null});});return;}
  if(kind==='cancel'){this.panel.action(()=>{this.panel.paper.cancel(item.id);});return;}
  try{this.panel.guard(item.symbol,this.chart);this.panel.paper.quote(item.symbol);}catch(error){this.panel.toast?.(error.message,'alert');return;}
  const mode=kind==='entry'?'create':'move';
  this.drag={id,kind,mode,targetKind:null,symbol:item.symbol,account:this.panel.paper.state.active,startY:e.clientY,basePrice:item[kind]??item.price,baseY:this.chart.series.priceToCoordinate(item[kind]??item.price),price:item[kind]??item.price,button:e.currentTarget,pointer:e.pointerId,changed:false,canceled:false};
  if(e.currentTarget?.setPointerCapture)e.currentTarget.setPointerCapture(e.pointerId);
 }
 move(e){
  if(!this.drag)return;e.preventDefault();e.stopPropagation();
  const rect=this.chart.container.getBoundingClientRect();
  const lineY=(this.drag.baseY??(this.drag.startY-rect.top))+(e.clientY-this.drag.startY);
  const price=this.chart.coordinateToPrice(lineY);
  if(!Number.isFinite(price)||price<=0)return;
  const tick=this.chart.metadata?.tickSize||this.find(this.drag.id)?.tickSize||.01;
  this.drag.changed ||= Math.abs(e.clientY-this.drag.startY)>3;
  if(!this.drag.changed)return;
  const item=this.find(this.drag.id);if(!item)return;
  const roundedPrice=Number((Math.round(price/tick)*tick).toFixed(8));
  if(this.drag.mode==='create'){
   const inPnlZone=Math.abs(price-item.price)<tick;
   if(inPnlZone){this.drag.price=null;this.chart.renderDrawings();return;}
   const isLong=item.side==='buy';
   const lineType=((roundedPrice>item.price)===isLong)?'tp':'sl';
   if(!this.drag.targetKind)this.drag.targetKind=lineType;
   if(lineType!==this.drag.targetKind){this.drag.price=null;this.chart.renderDrawings();return;}
   const dir=this.drag.targetKind==='tp'?(isLong?1:-1):(isLong?-1:1);
   let p=roundedPrice;
   if((p-item.price)*dir<tick)p=item.price+dir*tick;
   this.drag.kind=this.drag.targetKind;
   this.drag.price=Number((Math.round(p/tick)*tick).toFixed(8));
   this.chart.renderDrawings();
   return;
  }
  if(this.drag.kind==='sl'||this.drag.kind==='tp'){
   if(this.drag.canceled)return;
   const isLong=item.side==='buy';
   const inPnlZone=Math.abs(price-item.price)<tick;
   const lineType=((roundedPrice>item.price)===isLong)?'tp':'sl';
   if(inPnlZone||lineType!==this.drag.kind){this.drag.canceled=true;this.drag.price=null;this.chart.renderDrawings();return;}
   this.drag.canceled=false;
   const dir=this.drag.kind==='tp'?(isLong?1:-1):(isLong?-1:1);
   let p=roundedPrice;
   if((p-item.price)*dir<tick)p=item.price+dir*tick;
   this.drag.price=Number((Math.round(p/tick)*tick).toFixed(8));
   this.chart.renderDrawings();
   return;
  }
  this.drag.price=roundedPrice;
  this.chart.renderDrawings();
 }
 end(e){
  if(!this.drag)return;e.preventDefault();e.stopPropagation();
  const drag=this.drag;this.drag=null;
  if(drag.button?.hasPointerCapture?.(drag.pointer))drag.button.releasePointerCapture(drag.pointer);
  const item=this.find(drag.id);if(!item){this.chart.renderDrawings();return;}
  if(!drag.changed){this.panel.edit(drag.kind==='price'?'order':'position',item,drag.kind==='price'?'price':drag.kind);return;}
  if(drag.mode==='create'){
   if(drag.price!=null&&drag.targetKind){
    this.panel.action(()=>{
     if(drag.account!==this.panel.paper.state.active||drag.symbol!==this.chart.symbol)throw Error('Tài khoản hoặc chart đã đổi; bỏ thay đổi giá.');
     this.panel.guard(item.symbol,this.chart);
     this.panel.paper.amendPosition(item.id,{[drag.targetKind]:drag.price});
    });
   }else if(drag.targetKind&&item[drag.targetKind]!=null){
    this.panel.action(()=>{
     if(drag.account!==this.panel.paper.state.active||drag.symbol!==this.chart.symbol)throw Error('Tài khoản hoặc chart đã đổi; bỏ thay đổi giá.');
     this.panel.guard(item.symbol,this.chart);
     this.panel.paper.amendPosition(item.id,{[drag.targetKind]:null});
    });
   }else{this.chart.renderDrawings();}
   return;
  }
  if(drag.kind==='sl'||drag.kind==='tp'){
   if(drag.canceled||drag.price==null){
    this.panel.action(()=>{
     if(drag.account!==this.panel.paper.state.active||drag.symbol!==this.chart.symbol)throw Error('Tài khoản hoặc chart đã đổi; bỏ thay đổi giá.');
     this.panel.guard(item.symbol,this.chart);
     this.panel.paper.amendPosition(item.id,{[drag.kind]:null});
    });
   }else{
    this.panel.action(()=>{
     if(drag.account!==this.panel.paper.state.active||drag.symbol!==this.chart.symbol)throw Error('Tài khoản hoặc chart đã đổi; bỏ thay đổi giá.');
     this.panel.guard(item.symbol,this.chart);
     this.panel.paper.amendPosition(item.id,{[drag.kind]:drag.price});
    });
   }
   return;
  }
  this.panel.action(()=>{
   if(drag.account!==this.panel.paper.state.active||drag.symbol!==this.chart.symbol)throw Error('Tài khoản hoặc chart đã đổi; bỏ thay đổi giá.');
   this.panel.guard(item.symbol,this.chart);
   const ref=this.panel.paper.quote(item.symbol);
   this.panel.paper.checkMargin?.({...item,price:drag.price},item,ref);
   this.panel.paper.amendOrder(drag.id,{price:drag.price});
  });
 }
 cancel(){const drag=this.drag;this.drag=null;if(drag?.button?.hasPointerCapture?.(drag.pointer))drag.button.releasePointerCapture(drag.pointer);this.chart.renderDrawings();}
}
