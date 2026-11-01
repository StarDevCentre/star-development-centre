import {heroSkinTones,heroHairColours} from './heroCharacter';
import type {BuilderLook} from './buildMyPlayer';
import {wardrobeGarment,wardrobeAsset,wardrobeFullLength} from './builderWardrobe';
import {builderKit,builderKitAsset} from './builderKits';
type View='front'|'back';
type Point=readonly [number,number];
const width=460,height=1024;
const images=new Map<string,Promise<HTMLImageElement>>();
function readImage(src:string){
 let image=images.get(src);
 if(image){images.delete(src);images.set(src,image);}
 else{image=new Promise<HTMLImageElement>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(new Error('Character artwork could not load.'));};im.src=src;});images.set(src,image);while(images.size>32)images.delete(images.keys().next().value!);}
 return image;
}
function surface(){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
function skinPixel(r:number,g:number,b:number){return r>g*1.12&&g>b*1.12&&r>70;}
function clothingSkinPixel(r:number,g:number,b:number){
 if(!skinPixel(r,g,b))return false;
 const hue=60*(g-b)/(r-Math.min(g,b)),saturation=(r-Math.min(g,b))/r;
 // Red sleeve cuffs and golden club marks are fabric, not skin.
 return hue>17&&hue<49&&saturation>.17;
}
function shade(r:number,g:number,b:number,tone:{shadow:readonly number[];mid:readonly number[];light:readonly number[]}){
 const t=Math.min(1,Math.max(0,((r*.3+g*.59+b*.11)/255-.08)/.83)),a=t<.5?t*2:(t-.5)*2,from=t<.5?tone.shadow:tone.mid,to=t<.5?tone.mid:tone.light;
 return from.map((n,i)=>n+(to[i]-n)*a);
}
// Actual garment seams in the aligned sources. Never copy a rectangular strip
// containing another shirt, shorts, hands or knees into the selected garment.
const hems:Record<string,Record<View,readonly Point[]>>={
 star:{front:[[128,428],[171,439],[229,443],[287,439],[332,428]],back:[[128,429],[177,439],[230,441],[284,439],[333,430]]},
 arsenal:{front:[[125,440],[173,460],[230,470],[287,461],[335,441]],back:[[125,444],[178,440],[230,443],[283,440],[335,444]]},
 chelsea:{front:[[120,459],[175,467],[230,469],[286,467],[340,459]],back:[[120,459],[175,465],[230,466],[286,465],[340,459]]},
 tee:{front:[[117,454],[170,466],[230,468],[290,465],[347,451]],back:[[117,453],[173,463],[230,466],[289,463],[347,451]]},
 casual:{front:[[120,448],[175,459],[230,462],[285,459],[338,448]],back:[[118,449],[174,450],[230,452],[286,450],[340,449]]}
};
function hemAt(points:readonly Point[],x:number){for(let i=1;i<points.length;i++){if(x<=points[i][0]){const [a,b]=[points[i-1],points[i]];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}}return points.at(-1)![1];}
function garment(im:HTMLImageElement,kind:string,view:View){
 const c=surface(),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0,width,height);
 const d=ctx.getImageData(0,0,width,height),p=d.data;
 for(let i=0;i<p.length;i+=4){const x=i/4%width,y=Math.floor(i/4/width),r=p[i],g=p[i+1],b=p[i+2];let keep=false;
  const sleeve=kind==='casual'&&(x<108||x>352);
  keep=y>=140&&y<=(sleeve?501:hemAt(hems[kind][view],x))&&x>=35&&x<=425;
  if(!keep||clothingSkinPixel(r,g,b)||p[i+3]<20)p[i+3]=0;
 }
 ctx.putImageData(d,0,0);
 return c;
}
function recolour(c:HTMLCanvasElement,colour:readonly number[]){const ctx=c.getContext('2d')!,d=ctx.getImageData(0,0,width,height),p=d.data;for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const l=(p[i]+p[i+1]+p[i+2])/765;for(let k=0;k<3;k++)p[i+k]=colour[k]*(.48+l*.52);}ctx.putImageData(d,0,0);}
function skinLayer(im:HTMLImageElement,look:BuilderLook,view:View,head=false){
 const c=surface(),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0,width,height);const d=ctx.getImageData(0,0,width,height),p=d.data;
 const skin=heroSkinTones.find(t=>t.key===look.skin)!,hair=heroHairColours.find(t=>t.key===look.hair)!;
 for(let i=0;i<p.length;i+=4){const x=i/4%width,y=Math.floor(i/4/width);if(head&&y>=160){p[i+3]=0;continue;}if(p[i+3]<20){p[i+3]=0;continue;}const r=p[i],g=p[i+1],b=p[i+2];const face=view==='front'&&Math.pow((x-228)/49,2)+Math.pow((y-98)/60,2)<1;
  const isHair=head&&!face&&r<170&&r>g*.9;
  if(isHair||skinPixel(r,g,b)){const rgb=shade(r,g,b,isHair?hair:skin);for(let k=0;k<3;k++)p[i+k]=rgb[k];}
 }ctx.putImageData(d,0,0);return c;
}
function sockLayer(im:HTMLImageElement,look:BuilderLook,kitColour?:readonly number[]){
 const c=surface(),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0,width,height);const d=ctx.getImageData(0,0,width,height),p=d.data;
 const colour=kitColour||{white:[241,244,252],navy:[21,39,70],black:[24,26,35],red:[198,43,54]}[look.socks as 'white'|'navy'|'black'|'red'];
 // Use this model's actual calf/ankle/foot silhouette, not a different outfit's legs.
 for(let i=0;i<p.length;i+=4){const x=i/4%width,y=Math.floor(i/4/width),center=x<230?151:307,cuff=704+Math.max(0,(x-center)**2/400-4);
  if(p[i+3]<20||y<cuff||y>=1014||x<75||x>385){p[i+3]=0;continue;}
  const l=(p[i]+p[i+1]+p[i+2])/765;for(let k=0;k<3;k++)p[i+k]=l<.16?[27,35,48][k]:colour[k]*(.64+l*.36);
 }
 ctx.putImageData(d,0,0);return c;
}
function restoreNeck(ctx:CanvasRenderingContext2D,body:HTMLCanvasElement){
 // The illustrated inner back collar belongs behind the neck. Restore a smooth
 // neckline instead of classifying fabric colours, which leaves speckled skin.
 ctx.save();ctx.beginPath();ctx.ellipse(230,182,35,22,0,0,Math.PI*2);ctx.clip();ctx.drawImage(body,0,0);ctx.restore();
}
function fittedKitSocks(fabric:HTMLImageElement,reference:HTMLImageElement,look:BuilderLook,colour:readonly number[]){
 const mask=sockLayer(reference,look,colour),texture=surface(),t=texture.getContext('2d')!;
 t.drawImage(fabric,0,0);t.globalCompositeOperation='destination-in';t.drawImage(mask,0,0);
 mask.getContext('2d')!.drawImage(texture,0,0);return mask;
}
/** Offscreen rendering prevents an older selection overwriting a newer look. */
export async function renderBuilderArtwork(look:BuilderLook,view:View){
 const newTop=wardrobeGarment(look.top),newBottom=wardrobeGarment(look.bottoms);
 const coreBottom=({shorts:'core-shorts',trackies:'core-trackies',leggings:'core-leggings'} as Record<string,string>)[look.bottoms];
 const kitTop=builderKit(look.top),kitBottom=builderKit(look.bottoms),kitSocks=builderKit(look.socks);
 const top=['arsenal','chelsea'].includes(look.top)?look.top:look.top==='base'?'base':look.top.includes('hoodie')?'casual':look.top.includes('tee')?'tee':'star';
 const asset=(kind:string)=>`/player-space/builder/${kind}-${view}.webp`;
 const [base,shirt,bottom,hair,boots,socks,logo,sockReference]=await Promise.all([readImage(asset('base')),kitTop?readImage(builderKitAsset(kitTop.id,'top',view)):newTop?readImage(wardrobeAsset(newTop.id,view)):top==='base'?null:readImage(asset(top)),kitBottom?readImage(builderKitAsset(kitBottom.id,'bottoms',view)):newBottom||coreBottom?readImage(wardrobeAsset(newBottom?.id||coreBottom,view)):null,readImage(asset('hair-'+look.hairstyle)),look.boots==='none'?null:readImage(`/player-space/builder/footwear/${look.boots}-${view}.webp`),look.socks==='none'?null:readImage(kitSocks?builderKitAsset(kitSocks.id,'socks',view):asset('base')),look.top==='star'&&view==='front'?readImage('/images/star-colour-transparent.webp'):null,kitSocks?readImage(asset('base')):null]);
 const out=surface(),ctx=out.getContext('2d')!;const scale={slim:.93,standard:1,strong:1.07}[look.build];ctx.translate(width/2,0);ctx.scale(scale,1);ctx.translate(-width/2,0);
 const body=skinLayer(base,look,view);if(boots)ctx.drawImage(body,0,0,width,925,0,0,width,925);else ctx.drawImage(body,0,0);
 if(socks&&look.socks!=='none'&&!['trackies','leggings'].includes(look.bottoms)&&!wardrobeFullLength(look.bottoms)){const layer=kitSocks&&sockReference?fittedKitSocks(socks,sockReference,look,kitSocks.sockColour):sockLayer(socks,look);if(boots)ctx.drawImage(layer,0,0,width,925,0,0,width,925);else ctx.drawImage(layer,0,0);}
 if(boots)ctx.drawImage(boots,0,0);
 if(bottom)ctx.drawImage(bottom,0,0);
 if(shirt){const g=newTop||kitTop?shirt:garment(shirt,top,view);if(!newTop&&!kitTop&&['navy-tee','white-tee','gold-hoodie'].includes(look.top))recolour(g as HTMLCanvasElement,look.top==='navy-tee'?[22,40,72]:look.top==='white-tee'?[243,246,252]:[210,166,55]);ctx.drawImage(g,0,0);}
 if(view==='front'&&shirt&&(kitTop||newTop&&(newTop.id.includes('tee')||newTop.id==='nike-pro-crop'||newTop.id==='juicy-velour-hoodie')))restoreNeck(ctx,body);
 if(logo){ctx.drawImage(logo,253,215,62,49);ctx.fillStyle='#0a2043';ctx.font='bold 5.5px sans-serif';for(const [i,line]of ['THIS SHIRT','CARRIES THE FUTURE','IS PROOF GIRLS BELONG','REPRESENTS COURAGE','IS WORN WITH PRIDE','IS FOR WINNERS','IS STRENGTH','IS MINE'].entries())ctx.fillText(line,245,290+i*10);}
 ctx.save();if(look.face==='round'){ctx.translate(227,0);ctx.scale(1.07,1);ctx.translate(-227,0);}ctx.drawImage(skinLayer(hair,look,view,true),0,0);ctx.restore();
 if(view==='front'){
  if(look.face==='freckles'){ctx.fillStyle='#82523e';for(const [x,y]of [[204,101],[210,104],[215,100],[243,101],[249,104],[254,100]]){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}}
  ctx.fillStyle={brown:'#553c2b',blue:'#477ba2',green:'#4b765c',grey:'#657581'}[look.eyes];for(const x of [210,249]){ctx.beginPath();ctx.ellipse(x,84,3.1,3.5,0,0,Math.PI*2);ctx.fill();}
  if(look.accessory==='glasses'){ctx.strokeStyle='#192a46';ctx.lineWidth=3;for(const x of [209,248]){ctx.beginPath();ctx.ellipse(x,84,17,11,0,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(226,84);ctx.lineTo(231,84);ctx.stroke();}
 }
 if(look.accessory.includes('headband')){ctx.strokeStyle=look.accessory==='gold-headband'?'#e5bc57':'#8c54bc';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(228,62,47,25,0,Math.PI,Math.PI*2);ctx.stroke();}
 return out;
}
