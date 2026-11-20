/* Cycle clock artwork adapted from the supplied clock-ui.html.
   Display time, timezone selection and Replay remain owned by Terminal. */
(()=>{
 const root=document.querySelector('#dock-market-status .dock-clock');
 const rings=root?.querySelector('#rings');if(!rings)return;
 const ns='http://www.w3.org/2000/svg',colors=['var(--a)','var(--m-phase)','var(--d)','var(--x)'];
 const letters=[...root.querySelectorAll('.dock-phases i')],fills=[],ql=21.2;
 colors.forEach((color,i)=>{
  letters[i].style.setProperty('--c',color);
  for(const cls of ['rail','fill']){
   const c=document.createElementNS(ns,'circle');
   for(const [k,v]of Object.entries({class:cls,cx:22,cy:22,r:20,pathLength:100,transform:`rotate(${-90+i*90} 22 22)`}))c.setAttribute(k,v);
   c.style.stroke=color;c.setAttribute('stroke-dasharray',cls==='rail'?`${ql} ${100-ql}`:'0 200');
   if(cls==='fill')fills.push(c);rings.append(c);
  }
 });
 window.TerminalCycleClock={update(time,code,tz='America/New_York'){
  const valid=Number.isFinite(code),q=valid?Math.trunc(code/4):0,haveRef=valid&&code%2===1;
  const sequence=valid&&code%4>=2?'XAMD':'AMDX';
  const qi=haveRef&&q>=1&&q<=4?q-1:-1;
  const date=new Date(time),t=new Intl.DateTimeFormat('en-GB',{timeZone:tz||'America/New_York',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(date);
  const [h,m,s]=t.split(':').map(Number),minutes=((h*60+m-1080)%1440+1440)%1440+s/60;
  const f=(minutes%360)/360;
  letters.forEach((l,i)=>{const letter=sequence[i];l.textContent=letter;l.style.visibility=i===qi?'visible':'hidden';l.style.setProperty('--c',colors['AMDX'.indexOf(letter)]);l.className=i<qi?'done':i===qi?'on':'';l.style.setProperty('--p',i===qi?f:0)});
  fills.forEach((c,i)=>{c.style.stroke=colors['AMDX'.indexOf(sequence[i])];c.setAttribute('stroke-dasharray',`${ql*(qi<0?0:i<qi?1:i===qi?f:0)} 200`)});
  root.style.setProperty('--ph',qi>=0?colors['AMDX'.indexOf(sequence[qi])]:'var(--muted)');
  root.dataset.dailyPhase=qi>=0?sequence[qi]:'-';
  root.querySelector('#live-clock').title='Daily AMDX · '+(qi>=0?sequence[qi]:'Waiting for data');
 }};
 window.TerminalCycleClock.update(Date.now());
})();
