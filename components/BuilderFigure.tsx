'use client';
import {useEffect,useRef,useState} from 'react';
import {builderLook,type BuilderLook} from '../lib/buildMyPlayer';
import {heroSkinTones,heroHairColours} from '../lib/heroCharacter';
import {bootAsset} from '../lib/bootChallenges';
const cache=new Map<string,Promise<HTMLImageElement>>();
function readImage(src:string){let p=cache.get(src);if(!p){p=new Promise<HTMLImageElement>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve(im);im.onerror=()=>{cache.delete(src);reject(new Error('Character artwork could not load.'));};im.src=src;});cache.set(src,p);}return p;}
const asset=(kind:string,view:string)=>`/player-space/builder/${kind}-${view}.webp`;
/** Composite the same illustrated layers in the editor, player card and squad. */
export function BuilderFigure({look:input,view='front',className='',name='Your player'}:{look:BuilderLook;view?:'front'|'back';className?:string;name?:string}){
 const canvas=useRef<HTMLCanvasElement>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const look=builderLook(input),key=JSON.stringify(look);
 useEffect(()=>{let live=true;setError(false);void(async()=>{
  const top=['arsenal','chelsea'].includes(look.top)?look.top:look.top==='base'?'base':look.top.includes('hoodie')?'casual':look.top.includes('tee')?'tee':'star';
  const lower=['arsenal','chelsea'].includes(look.bottoms)?look.bottoms:look.bottoms==='base'?'base':look.bottoms==='shorts'?'star':look.bottoms==='leggings'?'leggings':'casual';
  const [base,shirt,bottom,hair,boots,socks,logo]=await Promise.all([readImage(asset('base',view)),readImage(asset(top,view)),readImage(asset(lower,view)),readImage(asset('hair-'+look.hairstyle,view)),['none','starter'].includes(look.boots)?null:readImage(bootAsset(look.boots)),readImage(asset('star',view)),readImage('/images/star-colour-transparent.webp')]);
  if(!live||!canvas.current)return;
  const context=canvas.current.getContext('2d');if(!context)return;const ctx:CanvasRenderingContext2D=context;
  const w=460,h=1024;ctx.clearRect(0,0,w,h);ctx.save();const scale={slim:.93,standard:1,strong:1.07}[look.build];ctx.translate(w/2,0);ctx.scale(scale,1);ctx.translate(-w/2,0);
  const skin=heroSkinTones.find(t=>t.key===look.skin)!,hc=heroHairColours.find(t=>t.key===look.hair)!;
  function layer(im:HTMLImageElement,y:number,height:number,mode='skin'){
   const scratch=document.createElement('canvas');scratch.width=w;scratch.height=h;const c=scratch.getContext('2d')!;c.drawImage(im,0,0,w,h);const data=c.getImageData(0,y,w,height),px=data.data;
   for(let i=0;i<px.length;i+=4){if(px[i+3]<20)continue;const r=px[i],g=px[i+1],b=px[i+2],x=(i/4)%w,py=y+Math.floor(i/4/w),light=(r*.3+g*.59+b*.11)/255;
    const face=view==='front'&&Math.pow((x-227)/53,2)+Math.pow((py-88)/69,2)<1;
    const isHair=mode==='hair'&&!face&&py<190&&r>g*.9&&r<170;
    const tone=isHair?hc:skin;
    if(isHair||(mode!=='cloth'&&r>g*1.12&&g>b*1.12&&r>70)){
     const t=Math.min(1,Math.max(0,(light-.08)/.83)),a=t<.5?t*2:(t-.5)*2,from=t<.5?tone.shadow:tone.mid,to=t<.5?tone.mid:tone.light;
     px[i]=from[0]+(to[0]-from[0])*a;px[i+1]=from[1]+(to[1]-from[1])*a;px[i+2]=from[2]+(to[2]-from[2])*a;
    }
   }c.putImageData(data,0,y);ctx.drawImage(scratch,0,y,w,height,0,y,w,height);
  }
  layer(base,0,h);if(lower!=='base')layer(bottom,425,look.bottoms==='shorts'||['arsenal','chelsea'].includes(look.bottoms)?225:525);
  if(top!=='base')layer(shirt,140,look.top.includes('hoodie')?370:340);
  if(look.top==='navy-tee'||look.top==='white-tee'||look.top==='gold-hoodie'){
   // Recolour only the garment pixels, retaining fabric shading and skin.
   const data=ctx.getImageData(0,155,w,280);const px=data.data;for(let i=0;i<px.length;i+=4){const r=px[i],g=px[i+1],b=px[i+2];if(px[i+3]&&!(r>g*1.12&&g>b*1.12)&&((i/4)%w)>98&&((i/4)%w)<360){const l=(r+g+b)/765;const t=look.top==='navy-tee'?[22,40,72]:look.top==='white-tee'?[243,246,252]:[210,166,55];px[i]=t[0]*(.65+l*.35);px[i+1]=t[1]*(.65+l*.35);px[i+2]=t[2]*(.65+l*.35);}}ctx.putImageData(data,0,155);
  }
  if(look.socks!=='none'&&!['trackies','leggings'].includes(look.bottoms)){
   layer(socks,700,235);
   if(look.socks!=='white'){const d=ctx.getImageData(0,700,w,235),p=d.data;const target={navy:[21,39,70],black:[24,26,35],red:[198,43,54]}[look.socks];for(let i=0;i<p.length;i+=4){if(p[i+3]&&Math.max(p[i],p[i+1],p[i+2])-Math.min(p[i],p[i+1],p[i+2])<55){const light=(p[i]+p[i+1]+p[i+2])/765;p[i]=target[0]*(.5+light*.5);p[i+1]=target[1]*(.5+light*.5);p[i+2]=target[2]*(.5+light*.5);}}ctx.putImageData(d,0,700);}
  }
  if(look.top==='star'&&view==='front'){ctx.drawImage(logo,253,215,62,49);ctx.fillStyle='#0a2043';ctx.font='bold 5.5px sans-serif';for(const [i,line]of ['THIS SHIRT','CARRIES THE FUTURE','IS PROOF GIRLS BELONG','REPRESENTS COURAGE','IS WORN WITH PRIDE','IS FOR WINNERS','IS STRENGTH','IS MINE'].entries())ctx.fillText(line,245,290+i*10);}
  ctx.save();if(look.face==='round'){ctx.translate(227,0);ctx.scale(1.07,1);ctx.translate(-227,0);}layer(hair,0,190,'hair');ctx.restore();
  if(view==='front'){
   if(look.face==='freckles'){ctx.fillStyle='#82523e';for(const [x,y] of [[204,101],[210,104],[215,100],[243,101],[249,104],[254,100]]){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}}
   ctx.fillStyle={brown:'#553c2b',blue:'#477ba2',green:'#4b765c',grey:'#657581'}[look.eyes];for(const x of [210,249]){ctx.beginPath();ctx.ellipse(x,84,3.1,3.5,0,0,Math.PI*2);ctx.fill();}
   if(look.accessory==='glasses'){ctx.strokeStyle='#192a46';ctx.lineWidth=3;for(const x of [209,248]){ctx.beginPath();ctx.ellipse(x,84,17,11,0,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(226,84);ctx.lineTo(231,84);ctx.stroke();}
  }
  if(look.accessory.includes('headband')){ctx.strokeStyle=look.accessory==='gold-headband'?'#e5bc57':'#8c54bc';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(228,62,47,25,0,Math.PI,Math.PI*2);ctx.stroke();}
  if(look.boots!=='none'){for(const x of [85,300]){ctx.save();ctx.beginPath();ctx.moveTo(x+16,944);ctx.lineTo(x+46,944);ctx.lineTo(x+76,991);ctx.quadraticCurveTo(x+88,1016,x+7,1015);ctx.quadraticCurveTo(x-4,1010,x+1,991);ctx.closePath();ctx.clip();ctx.fillStyle='#162033';ctx.fillRect(x-5,940,100,80);if(boots)ctx.drawImage(boots,180,275,700,290,x-5,945,95,73);ctx.restore();ctx.strokeStyle='#b2bccb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+7,1008);ctx.lineTo(x+75,1008);ctx.stroke();}}
  ctx.restore();
 })().catch(()=>{if(live)setError(true);});return()=>{live=false;};},[key,view,retry]);
 return <div className={`bp-art ${className}`}><canvas ref={canvas} width={460} height={1024} role="img" aria-label={`${name}, ${view} view in your chosen outfit`}/>{error&&<button type="button" onClick={()=>setRetry(v=>v+1)}>Reload character artwork</button>}</div>;
}
