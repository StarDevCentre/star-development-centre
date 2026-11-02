import {heroSkinTones,heroHairColours} from './heroCharacter';
import type {BuilderLook} from './buildMyPlayer';
import {builderSockIds,paintBuilderSocks} from './builderSocks';
import {wardrobeFullLength} from './builderWardrobe';
type View='front'|'back';
const width=460,height=1024;
const images=new Map<string,Promise<HTMLImageElement>>();
function readImage(src:string){let image=images.get(src);if(!image){image=new Promise<HTMLImageElement>((resolve,reject)=>{const im=new window.Image();im.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(new Error('Character artwork could not load.'));};im.src=src;});images.set(src,image);while(images.size>32)images.delete(images.keys().next().value!);}return image;}
function surface(){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
function shade(r:number,g:number,b:number,tone:{shadow:readonly number[];mid:readonly number[];light:readonly number[]}){const t=Math.min(1,Math.max(0,((r*.3+g*.59+b*.11)/255-.08)/.83)),a=t<.5?t*2:(t-.5)*2,from=t<.5?tone.shadow:tone.mid,to=t<.5?tone.mid:tone.light;return from.map((n,i)=>n+(to[i]-n)*a);}
function coloured(im:HTMLImageElement,look:BuilderLook,hair=false){const c=surface(),x=c.getContext('2d')!;x.drawImage(im,0,0);const d=x.getImageData(0,0,width,height),p=d.data,tone=hair?heroHairColours.find(t=>t.key===look.hair)!:heroSkinTones.find(t=>t.key===look.skin)!;if(hair&&look.hair==='brown'||!hair&&look.skin==='light')return c;for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const[r,g,b]=[p[i],p[i+1],p[i+2]];if(hair||r>g*1.12&&g>b*1.12&&r>90){const rgb=shade(r,g,b,tone);for(let k=0;k<3;k++)p[i+k]=rgb[k];}}x.putImageData(d,0,0);return c;}
function details(ctx:CanvasRenderingContext2D,look:BuilderLook,view:View){if(view==='front'){
 if(look.face==='freckles'){ctx.fillStyle='#9b6047';for(const[x,y]of [[210,104],[215,108],[221,105],[244,105],[250,108],[255,104]]){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}}
 if(look.accessory==='glasses'){ctx.strokeStyle='#192a46';ctx.lineWidth=2;for(const x of [214,247]){ctx.beginPath();ctx.ellipse(x,91,14,9,0,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(228,91);ctx.lineTo(233,91);ctx.stroke();}}
 if(look.accessory.includes('headband')){ctx.strokeStyle=look.accessory==='gold-headband'?'#e5bc57':'#8c54bc';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(231,52,46,20,0,Math.PI,Math.PI*2);ctx.stroke();}}
function garmentPath(id:string,part:'top'|'bottoms'){if(id.startsWith('home-2627-')||id==='arsenal'||id==='chelsea')return 'kits/'+id.replace('home-2627-','')+'-'+part;const aliases:Record<string,string>={'navy-tee':'core-tee','white-tee':'core-tee-white',hoodie:'core-hoodie','gold-hoodie':'core-hoodie',shorts:'core-shorts',leggings:'core-leggings',trackies:'core-trackies'};return 'wardrobe/'+(aliases[id]||id);}
function topColour(im:HTMLImageElement,id:string){if(id!=='gold-hoodie')return im;const c=surface(),x=c.getContext('2d')!;x.drawImage(im,0,0);const d=x.getImageData(0,0,width,height),p=d.data,colour=[221,180,72];for(let i=0;i<p.length;i+=4)if(p[i+3]){const light=Math.min(1,(p[i]+p[i+1]+p[i+2])/220);for(let k=0;k<3;k++)p[i+k]=colour[k]*(.60+light*.40);}x.putImageData(d,0,0);return c;}
/** Body, garments, socks, hair and boots are independent sprites on one rig.
 * Personalisation runs on body/hair before branding is composited. Sock shafts
 * precede trousers; boots never bring a source outfit's white ankle band. */
export async function renderBuilderArtwork(look:BuilderLook,view:View){const asset=(name:string)=>readImage(`/player-space/builder/v3/${name}-${view}.webp`),clubSock=look.socks.startsWith('home-2627-'),sockArt=builderSockIds.includes(look.socks as typeof builderSockIds[number]);
 const[body,top,bottom,hair,boots,knit,socks]=await Promise.all([asset('body'),look.top==='base'?null:asset(garmentPath(look.top,'top')),look.bottoms==='base'?null:asset(garmentPath(look.bottoms,'bottoms')),asset('hair/'+look.hairstyle),look.boots==='none'?null:asset('footwear/'+look.boots),look.socks==='none'?null:asset('knit'),clubSock?asset('kits/'+look.socks.replace('home-2627-','')+'-socks'):sockArt?readImage(`/player-space/builder/v2/socks/${look.socks}-${view}.webp`):null]);
 const out=surface(),ctx=out.getContext('2d')!;const skin=coloured(body,look);ctx.drawImage(skin,0,0);
 const long=wardrobeFullLength(look.bottoms)||['leggings','trackies'].includes(look.bottoms);
 if(long){ctx.clearRect(100,530,260,40);ctx.clearRect(0,570,width,280);}
 if(knit){ctx.clearRect(0,840,width,184);ctx.drawImage(knit,0,0);paintBuilderSocks(out,'shorts',look.socks,clubSock?null:socks);}
 if(clubSock&&socks)ctx.drawImage(socks,0,0);
 if(bottom)ctx.drawImage(bottom,0,0);
 if(top){
 const longSleeves=['hoodie','gold-hoodie','nike-club-hoodie','whitefox-shadow-hoodie','whitefox-glacier-hoodie','adidas-firebird-top','ua-tech-halfzip','puma-essentials-hoodie','ellesse-pink-sweatshirt','hollister-ivy-jumper','hm-rib-cardigan','juicy-velour-hoodie'].includes(look.top);
 if(longSleeves){for(const side of [0,1]){ctx.save();ctx.beginPath();for(const[i,[x,y]]of [[118,180],[159,208],[120,355],[85,460],[45,465],[75,340]].entries()){const xx=side?width-x:x;i?ctx.lineTo(xx,y):ctx.moveTo(xx,y);}ctx.closePath();ctx.clip();ctx.clearRect(0,0,width,height);ctx.restore();}}
 ctx.drawImage(topColour(top,look.top),0,0);}

 // Garment neck openings sit behind the face and neck, including raised hoods.
 // Restore the complete head so a source collar cannot cross the mouth.
 if(top){ctx.save();ctx.beginPath();ctx.moveTo(165,0);ctx.lineTo(295,0);ctx.lineTo(295,155);ctx.lineTo(260,155);ctx.lineTo(260,160);ctx.lineTo(275,185);ctx.lineTo(185,185);ctx.lineTo(199,160);ctx.lineTo(199,155);ctx.lineTo(165,155);ctx.closePath();ctx.clip();ctx.drawImage(skin,0,0);ctx.restore();}
 if(boots){ctx.clearRect(0,910,width,height-910);ctx.drawImage(boots,0,0);}
 const framed=surface(),fc=framed.getContext('2d')!;fc.drawImage(out,14,45,width*.94,height*.94);fc.setTransform(.94,0,0,.94,14,45);fc.drawImage(coloured(hair,look,true),0,-60);details(fc,look,view);return framed;}
