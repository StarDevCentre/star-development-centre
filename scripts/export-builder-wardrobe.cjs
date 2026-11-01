// Export generated two-view garment sheets to the character's shared coordinate grid.
// Input manifest entries: {id,path,frames?:[[x,y,w,h],[x,y,w,h]],target:[x,y,w,h]}.
// No garments are drawn or recoloured here. Keep the generated alpha and outlines.
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
async function main(){
 const manifest=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 const destination=path.resolve('public/player-space/builder/wardrobe');fs.mkdirSync(destination,{recursive:true});
 for(const item of manifest){
  const im=await loadImage(item.path),source=createCanvas(im.width,im.height),s=source.getContext('2d');s.drawImage(im,0,0);
  const data=s.getImageData(0,0,im.width,im.height).data;
  const boxes=item.frames||[0,1].map(half=>{
   let x0=im.width,y0=im.height,x1=0,y1=0;
   for(let y=0;y<im.height;y++)for(let x=Math.floor(half*im.width/2);x<Math.floor((half+1)*im.width/2);x++)if(data[(y*im.width+x)*4+3]>224){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
   if(x1<=x0||y1<=y0)throw Error('Missing sprite '+item.id+' '+half);
   return [Math.max(half*im.width/2,x0-2),Math.max(0,y0-2),x1-x0+5,y1-y0+5];
  });
  const scale=Math.min(item.target[2]/Math.max(...boxes.map(b=>b[2])),item.target[3]/Math.max(...boxes.map(b=>b[3])));
  for(let i=0;i<2;i++){
   const out=createCanvas(460,1024),ctx=out.getContext('2d'),b=boxes[i];
   const w=item.fitWidth||b[2]*scale,h=b[3]*scale,x=230-w/2,y=item.target[1];
   ctx.drawImage(source,...b,x,y,w,h);
   const file=path.join(destination,item.id+'-'+(i?'back':'front')+'.webp');
   fs.writeFileSync(file,out.toBuffer('image/webp',90));
  }
  console.log(item.id,JSON.stringify(boxes), 'scale',scale.toFixed(4));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
