import {heroSkinTones,heroHairColours} from './heroCharacter';
import type {BuilderLook} from './buildMyPlayer';
type View='front'|'back';
type Point=readonly [number,number];
const width=460,height=1024;
const brandedTops=['nike-club-hoodie','whitefox-shadow-hoodie','whitefox-glacier-hoodie','adidas-firebird-top','ua-tech-halfzip','puma-essentials-hoodie'];
const brandedTees=['adidas-originals-tee'];
const fittedLongBottoms=['nike-club-joggers','adidas-firebird-trousers'];
const bottomMask:readonly Point[]=[[90,434],[374,434],[374,570],[420,570],[420,910],[50,910],[50,570],[90,570]];
const images=new Map<string,Promise<HTMLImageElement>>();
function readImage(src:string){
 let image=images.get(src);
 if(!image){image=new Promise<HTMLImageElement>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(new Error('Character artwork could not load.'));};im.src=src;});images.set(src,image);}
 return image;
}
function surface(){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
function polygon(ctx:CanvasRenderingContext2D,points:readonly Point[]){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
/** Fixed template landmarks in 460x1024 coordinates. Exports use identical crops,
 * never per-garment bounding-box scaling. Hoodie cuffs cover the existing arms;
 * hands, shorts, knees, ankles and starter boots remain the training template.
 */
const topMasks:Record<'training'|'hoodie',Record<View,readonly Point[]>>={
 training:{front:[[90,165],[370,165],[377,295],[328,295],[331,444],[133,444],[133,295],[88,295]],back:[[88,165],[370,165],[379,296],[329,296],[333,444],[131,444],[131,296],[85,296]]},
 hoodie:{front:[[0,150],[460,150],[460,479],[334,479],[334,444],[131,444],[131,479],[0,479]],back:[[0,150],[460,150],[460,479],[334,479],[334,446],[131,446],[131,479],[0,479]]}
};
const hairMasks:Record<View,readonly Point[]>={
 front:[[174,8],[275,8],[296,75],[282,168],[266,184],[267,54],[192,54],[193,183],[174,165],[164,75]],
 back:[[178,5],[279,5],[292,81],[280,279],[199,279],[172,139]]
};
function mask(points:readonly Point[]){const c=surface(),ctx=c.getContext('2d')!;polygon(ctx,points);ctx.fill();return ctx.getImageData(0,0,width,height).data;}
function shade(r:number,g:number,b:number,tone:{shadow:readonly number[];mid:readonly number[];light:readonly number[]}){
 const t=Math.min(1,Math.max(0,((r*.3+g*.59+b*.11)/255-.08)/.83)),a=t<.5?t*2:(t-.5)*2,from=t<.5?tone.shadow:tone.mid,to=t<.5?tone.mid:tone.light;
 return from.map((n,i)=>n+(to[i]-n)*a);
}
function personalise(c:HTMLCanvasElement,look:BuilderLook,view:View,kind:'training'|'hoodie'){
 const ctx=c.getContext('2d')!,d=ctx.getImageData(0,0,width,height),p=d.data;
 const hair=heroHairColours.find(t=>t.key===look.hair)!,skin=heroSkinTones.find(t=>t.key===look.skin)!;
 const hairMask=mask(hairMasks[view]),topMask=mask(topMasks[kind][view]);
 for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const y=Math.floor(i/4/width),r=p[i],g=p[i+1],b=p[i+2];
  // Hair is identified spatially and by its brown pigment. Navy fabric and skin
  // never become hair, including the rear ponytail that overlaps the shirt.
  const isHair=hairMask[i+3]>0&&r>g*1.12&&g>b*1.08&&r<185;
  const isSkin=!isHair&&r>g*1.12&&g>b*1.12&&r>90;
  if(isHair&&look.hair!=='brown'||isSkin&&look.skin!=='light'){const rgb=shade(r,g,b,isHair?hair:skin);for(let k=0;k<3;k++)p[i+k]=rgb[k];}
  if(topMask[i+3]&&b>r*1.15&&b>g*1.08){
   const colour=look.top==='white-tee'?[245,247,252]:look.top==='gold-hoodie'?[221,180,72]:null;
   if(colour){const l=Math.min(1,(r+g+b)/220);for(let k=0;k<3;k++)p[i+k]=colour[k]*(.60+l*.40);}
  }
  if(y>=(look.bottoms==='adidas-firebird-trousers'?888:look.bottoms==='nike-club-joggers'?878:848)&&y<910&&r>150&&Math.max(r,g,b)-Math.min(r,g,b)<30){const colour=({navy:[24,42,73],black:[30,32,40],red:[189,38,53]} as Record<string,number[]>)[look.socks];if(colour){const l=(r+g+b)/765;for(let k=0;k<3;k++)p[i+k]=colour[k]*(.6+l*.4);}}
 }
 ctx.putImageData(d,0,0);
 if(view==='front'){
  if(look.face==='freckles'){ctx.fillStyle='#9b6047';for(const [x,y]of [[210,104],[215,108],[221,105],[244,105],[250,108],[255,104]]){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}}
  if(look.accessory==='glasses'){ctx.strokeStyle='#192a46';ctx.lineWidth=2;for(const x of [214,247]){ctx.beginPath();ctx.ellipse(x,91,14,9,0,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(228,91);ctx.lineTo(233,91);ctx.stroke();}
 }
 if(look.accessory.includes('headband')){ctx.strokeStyle=look.accessory==='gold-headband'?'#e5bc57':'#8c54bc';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(231,52,46,20,0,Math.PI,Math.PI*2);ctx.stroke();}
}
/** One slim teenage template. Unsupported saved clothes retain their IDs and
 * display the fitted training outfit until that item's batch is completed. */
export async function renderBuilderArtwork(look:BuilderLook,view:View){
 const branded=brandedTops.includes(look.top),hoodie=look.top==='hoodie'||look.top==='gold-hoodie'||branded;
 const kind=hoodie?'hoodie':'training';
 const asset=(name:string)=>readImage(`/player-space/builder/v2/${name}-${view}.webp`);
 const [base,top,bottom]=await Promise.all([asset('training'),hoodie?asset(branded?look.top:'hoodie'):brandedTees.includes(look.top)?asset(look.top):null,fittedLongBottoms.includes(look.bottoms)?asset(look.bottoms):null]);
 const out=surface(),ctx=out.getContext('2d')!;ctx.drawImage(base,0,0);
 function replace(im:HTMLImageElement,points:readonly Point[]){
  ctx.save();polygon(ctx,points);ctx.clip();ctx.clearRect(0,0,width,height);ctx.drawImage(im,0,0);ctx.restore();
 }
 // Replace shorts AND covered legs before painting joggers. The mask excludes
 // the hands and preserves the common feet; tops then overlap the waistband.
 if(bottom)replace(bottom,bottomMask);
 if(top)replace(top,topMasks[kind][view]);
 personalise(out,look,view,kind);return out;
}
