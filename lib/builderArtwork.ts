import {heroSkinTones,heroHairColours} from './heroCharacter';
import type {BuilderLook} from './buildMyPlayer';
import {bootAsset} from './bootChallenges';
type View='front'|'back';
type Point=readonly [number,number];
const width=460,height=1024;
const images=new Map<string,Promise<HTMLImageElement>>();
function readImage(src:string){
 let image=images.get(src);
 if(!image){image=new Promise<HTMLImageElement>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(new Error('Character artwork could not load.'));};im.src=src;});images.set(src,image);}
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
function garment(im:HTMLImageElement,kind:string,part:'top'|'bottoms',view:View){
 const c=surface(),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0,width,height);
 const d=ctx.getImageData(0,0,width,height),p=d.data;
 const start=kind==='leggings'?411:kind==='star'?445:kind==='casual'?466:472;
 for(let i=0;i<p.length;i+=4){const x=i/4%width,y=Math.floor(i/4/width),r=p[i],g=p[i+1],b=p[i+2];let keep=false;
  if(part==='top'){
   const sleeve=kind==='casual'&&(x<108||x>352);
   keep=y>=140&&y<=(sleeve?501:hemAt(hems[kind][view],x))&&x>=35&&x<=425;
  }else keep=y>=start&&y<=(kind==='leggings'?924:kind==='casual'?947:580)&&x>=85&&x<=375;
  if(!keep||clothingSkinPixel(r,g,b)||p[i+3]<20)p[i+3]=0;
 }
 ctx.putImageData(d,0,0);
 if(part==='bottoms'){
  // Extend only the waistband to the shared waist landmark. Hem and leg
  // positions stay fixed when a player mixes different tops and bottoms.
  const out=surface(),o=out.getContext('2d')!,join=kind==='leggings'?470:520;
  for(let y=390;y<join;y++){const t=(y-390)/(join-390),sx=.86+.14*t,sy=start+(join-start)*t;o.drawImage(c,0,sy,width,1,230-230*sx,y,width*sx,1.3);}
  o.drawImage(c,0,join,width,height-join,0,join,width,height-join);return out;
 }
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
function sockLayer(im:HTMLImageElement,look:BuilderLook){
 const c=surface(),ctx=c.getContext('2d')!;ctx.drawImage(im,0,0,width,height);const d=ctx.getImageData(0,0,width,height),p=d.data,mask=new Uint8Array(width*height);
 // Select sock fabric first, then retain its two-pixel ink edge, following the
 // curved cuff instead of cutting through and tinting the knees.
 for(let y=704;y<1012;y++)for(let x=75;x<385;x++){const i=(y*width+x)*4,r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]>20&&Math.min(r,g,b)>65&&Math.max(r,g,b)-Math.min(r,g,b)<42)mask[y*width+x]=1;}
 const colour={white:[241,244,252],navy:[21,39,70],black:[24,26,35],red:[198,43,54]}[look.socks as Exclude<BuilderLook['socks'],'none'>];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;let keep=false;if(y>=702&&y<1014){for(let dy=-2;dy<=2&&!keep;dy++)for(let dx=-2;dx<=2;dx++){if(mask[(y+dy)*width+x+dx]){keep=true;break;}}}if(!keep||p[i+3]<20){p[i+3]=0;continue;}const l=(p[i]+p[i+1]+p[i+2])/765;for(let k=0;k<3;k++)p[i+k]=colour[k]*(.5+l*.5);}
 ctx.putImageData(d,0,0);return c;
}
function drawBoots(ctx:CanvasRenderingContext2D,im:HTMLImageElement|null,id:string,view:View,body:HTMLCanvasElement){
 const colours:Record<string,readonly [string,string]>={
  'ida-rise':['#158b68','#d0e3b0'],'furon-pink':['#f04c91','#f9e7dc'],'tekela-white':['#f3f0e8','#c32d36'],'morelia-ruby':['#b52138','#f9eee8'],'superfly-pink':['#e9a3b3','#172027'],
  'absolute-2006':['#1d242c','#cf2834'],'total90-2004':['#bfc7cc','#c22d36'],'stadio-1990':['#192722','#33a15a'],'etrusco-1990':['#1c2024','#e9e9dd'],
  tiempo:['#152c29','#317d68'],copa:['#eeeae0','#171c23'],mercurial:['#c6ef46','#f8436b'],predator:['#f0eee2','#b79b4d'],future:['#f17b38','#e53639'],ultra:['#f69a28','#ff583d'],phantom:['#2a70ce','#f754ad'],f50:['#f5efe1','#c7a051']
 };
 const [upper,accent]=colours[id]||['#202735','#d0d5df'];
 const bodyPixels=body.getContext('2d')!.getImageData(0,925,width,90).data;
 for(const [x,flip]of [[130,-1],[328,1]] as const){ctx.save();ctx.translate(x,0);ctx.scale(flip,1);
  // Follow this view's actual ankle/foot silhouette with shoe allowance. This
  // keeps every toe inside the boot, including the wider rear-view stance.
  const left:Point[]=[],right:Point[]=[];
  for(let y=0;y<90;y+=2){let min=width,max=0;for(let px=x-60;px<x+60;px++)if(bodyPixels[(y*width+px)*4+3]>32){min=Math.min(min,px);max=Math.max(max,px);}if(min<=max){left.push([(min-3-x)*flip,925+y]);right.push([(max+3-x)*flip,925+y]);}}
  const outline=[...left,...right.reverse()];ctx.beginPath();outline.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.save();ctx.clip();ctx.fillStyle=upper;ctx.fillRect(-60,922,120,95);
  // Material sample retains the earned colourway without squashing a whole
  // side-on product image onto a foot. Each foot has its own orientation.
  if(im){ctx.globalAlpha=.75;ctx.drawImage(im,im.width*.47,im.height*.40,im.width*.15,im.height*.16,-49,924,100,87);ctx.globalAlpha=1;}
  const light=ctx.createLinearGradient(-35,0,35,0);light.addColorStop(0,'#0008');light.addColorStop(.5,'#ffffff25');light.addColorStop(1,'#0005');ctx.fillStyle=light;ctx.fillRect(-60,920,120,100);ctx.restore();ctx.strokeStyle='#17202c';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle='#131e2b';ctx.beginPath();ctx.ellipse(0,926,24,5,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=view==='back'?accent:'#eff1e9';ctx.lineWidth=view==='back'?7:2.5;
  if(view==='front'){for(let y=944;y<970;y+=7){ctx.beginPath();ctx.moveTo(-11,y);ctx.lineTo(12,y+3);ctx.stroke();}}
  else{ctx.beginPath();ctx.moveTo(-13,954);ctx.quadraticCurveTo(0,965,16,954);ctx.stroke();ctx.strokeStyle='#14233288';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,935);ctx.lineTo(0,988);ctx.stroke();}
  ctx.strokeStyle='#151c29';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(view==='front'?-36:-28,view==='front'?1003:992);ctx.quadraticCurveTo(0,view==='front'?1011:1000,view==='front'?33:24,view==='front'?1003:992);ctx.stroke();
  ctx.fillStyle=accent;for(const bx of [-22,19])ctx.fillRect(bx,view==='front'?1007:998,7,5);ctx.restore();
 }
}
/** Offscreen rendering prevents an older selection overwriting a newer look. */
export async function renderBuilderArtwork(look:BuilderLook,view:View){
 const top=['arsenal','chelsea'].includes(look.top)?look.top:look.top==='base'?'base':look.top.includes('hoodie')?'casual':look.top.includes('tee')?'tee':'star';
 const lower=['arsenal','chelsea'].includes(look.bottoms)?look.bottoms:look.bottoms==='base'?'base':look.bottoms==='shorts'?'star':look.bottoms==='leggings'?'leggings':'casual';
 const asset=(kind:string)=>`/player-space/builder/${kind}-${view}.webp`;
 const [base,shirt,bottom,hair,boots,socks,logo]=await Promise.all([readImage(asset('base')),top==='base'?null:readImage(asset(top)),lower==='base'?null:readImage(asset(lower)),readImage(asset('hair-'+look.hairstyle)),['none','starter'].includes(look.boots)?null:readImage(bootAsset(look.boots)),look.socks==='none'?null:readImage(asset('star')),look.top==='star'&&view==='front'?readImage('/images/star-colour-transparent.webp'):null]);
 const out=surface(),ctx=out.getContext('2d')!;const scale={slim:.93,standard:1,strong:1.07}[look.build];ctx.translate(width/2,0);ctx.scale(scale,1);ctx.translate(-width/2,0);
 const body=skinLayer(base,look,view);ctx.drawImage(body,0,0);
 if(socks&&look.socks!=='none'&&!['trackies','leggings'].includes(look.bottoms))ctx.drawImage(sockLayer(socks,look),0,0);
 if(look.boots!=='none')drawBoots(ctx,boots,look.boots,view,body);
 if(bottom)ctx.drawImage(garment(bottom,lower,'bottoms',view),0,0);
 if(shirt){const g=garment(shirt,top,'top',view);if(['navy-tee','white-tee','gold-hoodie'].includes(look.top))recolour(g,look.top==='navy-tee'?[22,40,72]:look.top==='white-tee'?[243,246,252]:[210,166,55]);ctx.drawImage(g,0,0);}
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
