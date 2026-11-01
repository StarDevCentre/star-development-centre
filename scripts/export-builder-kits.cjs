const fs=require('node:fs'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
// Find the actual isolated garments; generated atlas rows need not have equal heights.
function components(data,width,height,col){
 const ax=Math.floor(col*width/2),bw=Math.floor((col+1)*width/2)-ax,seen=new Uint8Array(bw*height),queue=new Int32Array(bw*height),out=[];
 for(let py=0;py<height;py++)for(let px=0;px<bw;px++){const start=py*bw+px;if(seen[start]||data[(py*width+ax+px)*4+3]<=224)continue;let at=0,end=1,count=0,x0=width,y0=height,x1=0,y1=0;queue[0]=start;seen[start]=1;
  while(at<end){const p=queue[at++],x=p%bw,y=Math.floor(p/bw);count++;x0=Math.min(x0,x+ax);x1=Math.max(x1,x+ax);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,k=yy*bw+xx;if(xx<0||xx>=bw||yy<0||yy>=height||seen[k]||data[(yy*width+ax+xx)*4+3]<=224)continue;seen[k]=1;queue[end++]=k;}}
  if(count>100)out.push({count,x0,y0,x1,y1});
 }
 return out.sort((a,b)=>b.count-a.count).slice(0,4).sort((a,b)=>a.y0-b.y0);
}
function crop(b){return [b.x0-1,b.y0-1,b.x1-b.x0+3,b.y1-b.y0+3];}
async function main(){const items=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),dest=path.resolve('public/player-space/builder/kits');fs.mkdirSync(dest,{recursive:true});
 for(const item of items){const im=await loadImage(item.path),s=createCanvas(im.width,im.height),c=s.getContext('2d');c.drawImage(im,0,0);const data=c.getImageData(0,0,im.width,im.height).data;
  for(let col=0;col<2;col++){const parts=components(data,im.width,im.height,col);if(parts.length!==4)throw Error('Expected shirt, shorts and two socks: '+item.id+' '+col);
   const view=col?'back':'front';
   for(let index=0;index<2;index++){const out=createCanvas(460,1024),x=out.getContext('2d'),target=index?[95,392,270,185]:[65,164,330,285];x.drawImage(s,...crop(parts[index]),...target);fs.writeFileSync(path.join(dest,`${item.id}-${index?'bottoms':'top'}-${view}.webp`),out.toBuffer('image/webp',92));}
   const socks=createCanvas(460,1024),x=socks.getContext('2d'),pair=parts.slice(2).sort((a,b)=>a.x0-b.x0);
   for(let side=0;side<2;side++){const box=crop(pair[side]);
    // Register knee and ankle joints independently, following the standing leg angle.
    for(let y=0;y<305;y++){const t=Math.min(1,y/222),center=side?307+(329-307)*t:151+(130-151)*t;x.drawImage(s,box[0],box[1]+box[3]*y/305,box[2],Math.max(1,box[3]/305),center-45,703+y,90,1.4);}
   }
   fs.writeFileSync(path.join(dest,`${item.id}-socks-${view}.webp`),socks.toBuffer('image/webp',92));
  }
  console.log(item.id);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
