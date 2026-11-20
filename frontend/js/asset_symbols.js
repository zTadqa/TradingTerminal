/* Display metadata only: exchange-qualified values remain unchanged. */
window.TerminalAssets={
 info(value){
  const symbol=String(value).split(':').pop();
  const files={'NQ1!':'nasdaq-100','MNQ1!':'nasdaq-100','ES1!':'s-and-p-500','MES1!':'s-and-p-500','YM1!':'dow-30','MYM1!':'dow-30','AUTO':'auto'};
  return files[symbol]?{symbol,icon:'assets/symbols/'+files[symbol]+'.svg'}:null;
 },
 decorateSelect(select){
  if(![...select.options].every(option=>this.info(option.value)))return;
  select.classList.add('settings-asset-select');
  for(const option of select.options){option.textContent=this.info(option.value).symbol;option.title=option.value;}
  const sync=()=>{const asset=this.info(select.value);if(asset){select.style.setProperty('--asset-icon',`url("${asset.icon}")`);select.title=select.value;}};
  select.addEventListener('change',sync);sync();
 }
};
