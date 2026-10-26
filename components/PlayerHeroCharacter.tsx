"use client";
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {heroAppearance,heroHairColours,heroHairTypes,heroSkinTones,type HeroAppearance} from '../lib/heroCharacter';
import {playerBall} from '../lib/playerBalls';

// Recolour the skin and hair without changing the official kit or stickers.
// Composite a selected football afterwards, behind the original hand.
const skinPaths = [
  [[546,192],[591,181],[626,190],[653,214],[667,243],[681,257],[681,269],[699,274],[709,285],[705,297],[694,303],[699,313],[707,323],[707,342],[702,353],[706,373],[698,392],[682,402],[650,412],[618,419],[608,429],[603,455],[606,489],[617,522],[640,550],[613,582],[572,615],[531,591],[499,566],[467,546],[448,526],[460,502],[468,469],[473,431],[473,399],[466,373],[445,359],[432,339],[440,321],[461,311],[480,306],[503,294],[515,267],[529,230]],
  [[111,772],[158,786],[222,830],[197,858],[133,881],[113,905],[129,962],[147,1007],[203,1046],[252,1046],[287,1055],[326,1074],[336,1084],[320,1099],[303,1094],[288,1090],[287,1114],[304,1127],[338,1131],[347,1143],[329,1156],[317,1164],[287,1179],[255,1193],[223,1195],[192,1178],[170,1168],[147,1150],[119,1121],[88,1098],[63,1068],[31,1033],[9,992],[0,953],[12,917],[40,879],[73,837]],
  [[767,902],[837,885],[839,946],[846,990],[862,1043],[885,1104],[894,1150],[898,1214],[866,1233],[835,1253],[821,1217],[815,1167],[806,1111],[791,1074],[780,1023],[762,989]],
];
const crownPath=[[365,76],[402,88],[441,116],[449,47],[468,45],[493,103],[518,82],[539,77],[547,95],[534,147],[511,160],[451,181],[419,179],[393,147]];
type Palette={shadow:readonly number[];mid:readonly number[];light:readonly number[]};
function inside(x:number,y:number,points:number[][]){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function tint(data:Uint8ClampedArray,index:number,luma:number,palette:Palette){
  const t=Math.max(0,Math.min(1,(luma-.06)/.94));
  const a=t<.53?palette.shadow:palette.mid,b=t<.53?palette.mid:palette.light,f=t<.53?t/.53:(t-.53)/.47;
  for(let c=0;c<3;c++)data[index+c]=Math.round(a[c]+(b[c]-a[c])*f);
}
export function PlayerHeroCharacter({appearance,className='',decorative=false,priority=false}:{appearance?:Partial<HeroAppearance>;className?:string;decorative?:boolean;priority?:boolean}){
  const look=heroAppearance(appearance),type=heroHairTypes.find(t=>t.key===look.hero_hair_type)!,ball=playerBall(look.hero_ball);
  const canvas=useRef<HTMLCanvasElement>(null),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const custom=look.hero_skin!=='light'||look.hero_hair_colour!=='blonde'||look.hero_ball!=='classic';
  useEffect(()=>{
    setFailed(false);if(!custom){setReady(false);return;}
    let active=true;const image=new window.Image();
    image.onload=async()=>{
      if(!active||!canvas.current)return;
      try{
        const ballImage=ball.asset?await new Promise<HTMLImageElement>((resolve,reject)=>{const texture=new window.Image();texture.onload=()=>resolve(texture);texture.onerror=reject;texture.src=ball.asset!;}):null;
        if(!active||!canvas.current)return;
        const node=canvas.current,ctx=node.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Canvas unavailable');
        ctx.clearRect(0,0,600,900);ctx.drawImage(image,0,0,600,900);
        const pixels=ctx.getImageData(0,0,600,900),data=pixels.data;
        const skin=heroSkinTones.find(t=>t.key===look.hero_skin)!,hair=heroHairColours.find(t=>t.key===look.hero_hair_colour)!;
        for(let y=0;y<900;y++)for(let x=0;x<600;x++){
          const i=(y*600+x)*4;if(data[i+3]<80)continue;
          const r=data[i],g=data[i+1],b=data[i+2];
          const px=x*1.5,py=y*1.5;
          if(look.hero_skin!=='light'&&px>620&&px<715&&py>300&&py<350&&r>g*1.8&&r>b*1.5){const strength=look.hero_skin==='deep'?.58:look.hero_skin==='brown'?.7:look.hero_skin==='medium'?.85:.95;for(let c=0;c<3;c++)data[i+c]*=strength;continue;}
          if(r<g*1.035||g<b*1.08||r-b<24)continue;
          const luma=(.2126*r+.7152*g+.0722*b)/255;
          const skinPixel=skinPaths.some(path=>inside(px,py,path));
          if(skinPixel){if(look.hero_skin!=='light'&&g>r*.28)tint(data,i,luma,skin);}
          else if(look.hero_hair_colour!=='blonde'){
            const hairPixel=(py<540&&px<760)||(py>=540&&py<900&&px<Math.max(0,400-(py-540)*1.12))||(py>750&&py<875&&px>210&&px<330);
            const yellowSticker=(py<190&&inside(px,py,crownPath))||(px>710&&py<390);
            if(hairPixel&&!yellowSticker&&(g-b)/(r-b)>.12)tint(data,i,luma,hair);
          }
        }
        ctx.putImageData(pixels,0,0);
        if(ballImage){
          // Place the chosen ball behind the existing forearm and fingers.
          ctx.save();ctx.beginPath();ctx.ellipse(255/1.5,1025/1.5,151/1.5,171/1.5,0,0,Math.PI*2);ctx.clip();
          ctx.fillStyle=ball.colour;ctx.fillRect(104/1.5,854/1.5,302/1.5,342/1.5);ctx.drawImage(ballImage,104/1.5,854/1.5,302/1.5,342/1.5);ctx.restore();
          const composed=ctx.getImageData(0,0,600,900),output=composed.data;
          for(let y=569;y<800;y++)for(let x=69;x<273;x++){
            const i=(y*600+x)*4;
            if(data[i+3]>0&&inside(x*1.5,y*1.5,skinPaths[1]))for(let c=0;c<4;c++)output[i+c]=data[i+c];
          }
          ctx.putImageData(composed,0,0);
        }
        if(active)setReady(true);
      }catch{if(active){setFailed(true);setReady(false);}}
    };
    image.onerror=()=>{if(active){setFailed(true);setReady(false);}};image.src=type.asset;
    return()=>{active=false;image.onload=null;image.onerror=null;};
  },[look.hero_skin,look.hero_hair_colour,look.hero_hair_type,look.hero_ball,custom,type.asset,ball.asset,ball.colour]);
  const description=`STAR footballer: ${heroSkinTones.find(t=>t.key===look.hero_skin)!.label.toLowerCase()} skin, ${heroHairColours.find(t=>t.key===look.hero_hair_colour)!.label.toLowerCase()} hair, ${type.label.toLowerCase()}, wearing the official STAR top, holding the ${ball.label} ball`;
  return <div className={`ps-hero-character ${className}`} role={decorative?undefined:'img'} aria-label={decorative?undefined:description} aria-hidden={decorative||undefined}>
    <Image src={type.asset} alt="" width={600} height={900} priority={priority} className={ready?'ps-character-base ps-character-hidden':'ps-character-base'}/>
    <canvas ref={canvas} width={600} height={900} className={ready?'ps-character-canvas':'ps-character-canvas ps-character-hidden'} aria-hidden="true"/>
    {failed&&!decorative&&<span className="ps-character-error" role="status">Preview colours could not load. Try again.</span>}
  </div>;
}
