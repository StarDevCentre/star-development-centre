// Each generated sheet contains front left/right boots, then rear left/right boots.
const fs=require('node:fs'),path=require('node:path');const {createCanvas,loadImage}=require('@napi-rs/canvas');
function largestSprite(d,width,height,col,row){
 const ax=Math.floor(col*width/2),ay=Math.floor(row*height/2),bw=Math.floor((col+1)*width/2)-ax,bh=Math.floor((row+1)*height/2)-ay,seen=new Uint8Array(bw*bh),queue=new Int32Array(bw*bh);let best=null;
 for(let py=0;py<bh;py++)for(let px=0;px<bw;px++){const start=py*bw+px;if(seen[start]||d[((ay+py)*width+ax+px)*4+3]<=224)continue;let n=0,end=1,count=0,x0=width,y0=height,x1=0,y1=0;queue[0]=start;seen[start]=1;
  while(n<end){const pos=queue[n++],x=pos%bw,y=Math.floor(pos/bw);count++;x0=Math.min(x0,x+ax);y0=Math.min(y0,y+ay);x1=Math.max(x1,x+ax);y1=Math.max(y1,y+ay);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,k=yy*bw+xx;if(xx<0||xx>=bw||yy<0||yy>=bh||seen[k]||d[((ay+yy)*width+ax+xx)*4+3]<=224)continue;seen[k]=1;queue[end++]=k;}}
  if(!best||count>best.count)best={count,x0,y0,x1,y1};
 }
 if(!best)throw Error('Missing boot sprite');return best;
}
async function main(){
 const items=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),dest=path.resolve('public/player-space/builder/footwear');fs.mkdirSync(dest,{recursive:true});
 for(const item of items){const im=await loadImage(item.path),s=createCanvas(im.width,im.height),ctx=s.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,im.width,im.height).data;
  for(let row=0;row<2;row++){const out=createCanvas(460,1024),o=out.getContext('2d');
   for(let col=0;col<2;col++){const {x0,y0,x1,y1}=largestSprite(d,im.width,im.height,col,row);
    if(x0>=x1||y0>=y1)throw Error('Missing boot '+item.id+' '+row+' '+col);
    // Register the opening above the foot, rather than the shoe's bounding-box centre.
    let sum=0,count=0;for(let y=y0;y<y0+(y1-y0)*.20;y++)for(let x=x0;x<=x1;x++)if(d[(y*im.width+x)*4+3]>224){sum+=x;count++;}
    const ankle=(sum/count-x0)/(x1-x0),w=90,h=row?84:94,x=(col?329:130)-ankle*w;
    o.drawImage(s,x0-1,y0-1,x1-x0+3,y1-y0+3,x,row?920:918,w,h);
   }
   fs.writeFileSync(path.join(dest,item.id+'-'+(row?'back':'front')+'.webp'),out.toBuffer('image/webp',92));
  }
  console.log(item.id);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
