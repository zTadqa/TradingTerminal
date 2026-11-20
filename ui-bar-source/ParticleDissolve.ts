type Point={x:number;y:number};
type Fragment={site:Point;path:Path2D;delay:number;life:number;angle:number;speed:number;spin:number};
const fields=new WeakMap<HTMLCanvasElement,Fragment[]>();
const colors=new WeakMap<HTMLCanvasElement,string>();
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const ease=(v:number)=>v*v*(3-2*v);

/** Create a fresh random Voronoi fracture once per flight, never per frame.
 * Irregular cells cover the disc completely, with no grid seams or scan order. */
export function resetParticles(canvas:HTMLCanvasElement|null):void {
  if(!canvas)return;
  colors.set(canvas,getComputedStyle(canvas).getPropertyValue('--accent').trim());
  const points:Point[]=[];
  for(let attempts=0;points.length<86&&attempts<5000;attempts++){
    const angle=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*31;
    const point={x:Math.cos(angle)*r,y:Math.sin(angle)*r};
    if(points.every(p=>Math.hypot(p.x-point.x,p.y-point.y)>2.2))points.push(point);
  }
  const pieces=points.map(site=>{
    let polygon:Point[]=[{x:-32,y:-32},{x:32,y:-32},{x:32,y:32},{x:-32,y:32}];
    for(const other of points){
      if(other===site)continue;
      const nx=other.x-site.x,ny=other.y-site.y;
      const boundary=(other.x*other.x+other.y*other.y-site.x*site.x-site.y*site.y)/2;
      const clipped:Point[]=[];
      for(let i=0;i<polygon.length;i++){
        const a=polygon[i],b=polygon[(i+1)%polygon.length];
        const da=a.x*nx+a.y*ny-boundary,db=b.x*nx+b.y*ny-boundary;
        if(da<=0)clipped.push(a);
        if((da<0&&db>0)||(da>0&&db<0)){
          const t=da/(da-db);clipped.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
        }
      }
      polygon=clipped;if(!polygon.length)break;
    }
    const path=new Path2D();
    polygon.forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();
    return {site,path,delay:Math.random()*.64,life:.18+Math.random()*.18,angle:Math.random()*Math.PI*2,speed:8+Math.random()*24,spin:(Math.random()-.5)*.8};
  });
  fields.set(canvas,pieces);
}

export function clearParticles(canvas:HTMLCanvasElement|null):void {
  if(!canvas)return;canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
}

export function drawParticles(canvas:HTMLCanvasElement|null,cx:number,breakup:number,direction:number,energy:number,scaleX:number,scaleY:number,cy=0):void {
  if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const pieces=fields.get(canvas);if(!pieces)return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();ctx.translate(cx+120,90+cy);ctx.scale(scaleX,scaleY);
  const gradient=ctx.createLinearGradient(0,-30,0,30);
  const accent=colors.get(canvas);
  gradient.addColorStop(0,accent||'#ff7569');gradient.addColorStop(1,accent||'#ff493e');
  for(const piece of pieces){
    const local=ease(clamp((breakup-piece.delay)/piece.life));
    const shrink=1-local;if(shrink<.004)continue;
    const drift=local*piece.speed*(.5+energy*.5);
    ctx.save();
    ctx.translate(Math.cos(piece.angle)*drift+direction*local*5,Math.sin(piece.angle)*drift);
    ctx.translate(piece.site.x,piece.site.y);ctx.rotate(piece.spin*local);
    ctx.scale(shrink,shrink);ctx.translate(-piece.site.x,-piece.site.y);
    ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);ctx.clip();
    ctx.fillStyle=gradient;ctx.fill(piece.path);ctx.restore();
  }
  ctx.restore();
}
