/* Label hover is forwarded to its form control by browsers; use the actual pointer target. */
(()=>{
 const scope='#settings-modal,#qt-settings-modal';
 const controls='button,input,select,textarea,.qt-number-field';
 let active=null;
 function update(target){
  const control=target instanceof Element?target.closest(controls):null;
  const row=control?.closest(scope)?control.closest('.chart-setting-row,.setting-row'):null;
  if(active===row)return;
  active?.classList.remove('settings-control-hover');active=row;
  active?.classList.add('settings-control-hover');
 }
 document.addEventListener('pointerover',event=>update(event.target),true);
 document.addEventListener('pointerout',event=>update(event.relatedTarget),true);
 window.addEventListener('blur',()=>update(null));
})();

/* Descriptive labels are not editing hit targets; only the actual control activates. */
document.addEventListener('click',event=>{
 const target=event.target;
 if(!(target instanceof Element)||!target.closest('#settings-modal,#qt-settings-modal,#drawing-settings,.indicator-settings-modal'))return;
 if(target.closest('button,input,select,textarea,a'))return;
 if(target.closest('label'))event.preventDefault();
},true);
