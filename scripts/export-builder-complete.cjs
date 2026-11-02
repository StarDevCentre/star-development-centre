/** Register independent generated sprites to the shared 460×1024 game rig.
 * Inputs are generated art, never a second character body. Bone positions are
 * explicit; long legs and boots register separately rather than stretching hips.
 */
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require(process.env.BUILDER_CANVAS_MODULE||'@napi-rs/canvas');
const W=460,H=1024,root='public/player-space/builder',dest=root+'/v3';
const spec=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
function canvas(){return createCanvas(W,H)}
async function save(c,name){let file=dest+'/'+name+'.webp';fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,c.toBuffer('image/webp',94));}
function bounds(c,x0=0,x1=c.width){let p=c.getContext('2d').getImageData(0,0,c.width,c.height).data,b=[x1,c.height,x0,0];for(let y=0;y<c.height;y++)for(let x=x0;x<x1;x++)if(p[(y*c.width+x)*4+3]>180){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x+1);b[3]=Math.max(b[3],y+1)}return[b[0],b[1],b[2]-b[0],b[3]-b[1]]}
async function source(file){let im=await loadImage(file),c=createCanvas(im.width,im.height);c.getContext('2d').drawImage(im,0,0);return c}
async function paired(file,name,target){let s=await source(file);for(let i=0;i<2;i++){let b=bounds(s,Math.floor(i*s.width/2),Math.floor((i+1)*s.width/2)),c=canvas(),x=c.getContext('2d'),scale=Math.min(target[2]/b[2],target[3]/b[3]);x.drawImage(s,...b,230-b[2]*scale/2,target[1],b[2]*scale,b[3]*scale);await save(c,name+'-'+(i?'back':'front'));}}
async function main(){
 let body=await source(spec.body);for(let [i,v]of ['front','back'].entries()){let c=canvas();c.getContext('2d').drawImage(body,i?854:222,0,W,H,0,0,W,H);await save(c,'body-'+v);}
 let socked=await source(spec.knit);for(let[i,v]of ['front','back'].entries()){let c=canvas(),x=c.getContext('2d');x.drawImage(socked,i?854:222,840,W,184,0,840,W,184);let d=x.getImageData(0,0,W,H),p=d.data;for(let k=0;k<p.length;k+=4)if(Math.max(p[k],p[k+1],p[k+2])-Math.min(p[k],p[k+1],p[k+2])>35)p[k+3]=0;x.putImageData(d,0,0);await save(c,'knit-'+v);}
 // The original plain tee is hairless; only its shirt pixels are exported.
 for(let v of ['front','back']){let c=await source(root+'/tee-'+v+'.webp'),x=c.getContext('2d'),d=x.getImageData(0,0,W,H),p=d.data;for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){let i=(y*W+xx)*4,r=p[i],g=p[i+1],b=p[i+2];if(y<164||y>437||r>g*1.12&&g>b*1.12&&r>90)p[i+3]=0;}x.putImageData(d,0,0);await save(c,'wardrobe/core-tee-white-'+v);for(let i=0;i<p.length;i+=4)if(p[i+3]){let l=(p[i]+p[i+1]+p[i+2])/765;for(let k=0;k<3;k++)p[i+k]=[24,42,73][k]*(.4+l*.9);}x.putImageData(d,0,0);await save(c,'wardrobe/core-tee-'+v);}
 const prov=JSON.parse(fs.readFileSync('docs/player-space/builder-art-provenance.json'));
 for(let g of prov.wardrobe){for(let v of ['front','back']){let file=root+'/wardrobe/'+g.id+'-'+v+'.webp';if(!fs.existsSync(file))continue;let s=await source(file),c=canvas(),x=c.getContext('2d');if(g.part==='bottoms'){
   const long=g.target[3]>400;
   // Waist/hips/crotch stay one continuous piece. Each lower leg follows its bone.
   if(!long)x.drawImage(s,0,-2);else{
    const sp=s.getContext('2d').getImageData(0,0,W,H).data,bp=body.getContext('2d').getImageData(v==='front'?222:854,0,W,H).data;
    for(let sy=392;sy<600;sy++){let yy=390+(sy-392)*.855,iy=Math.floor(yy),s0=W,s1=0,b0=W,b1=0;for(let xx=70;xx<390;xx++){if(sp[(sy*W+xx)*4+3]>150){s0=Math.min(s0,xx);s1=Math.max(s1,xx);}if(xx>=110&&xx<=350&&bp[(iy*W+xx)*4+3]>150&&(iy>=530||bp[(iy*W+xx)*4]<bp[(iy*W+xx)*4+1]&&bp[(iy*W+xx)*4+1]<bp[(iy*W+xx)*4+2])){b0=Math.min(b0,xx);b1=Math.max(b1,xx);}}let grow=Math.max(0,(b1-b0+6)-(s1-s0))*Math.min(1,Math.max(0,(568-yy)/38));if(s1>s0)x.drawImage(s,s0,sy,s1-s0+1,1,s0-grow/2,yy,s1-s0+1+grow,1.1);}

    for(let y=600;y<960;y++){const yy=568+(y-600)*.855,t=(y-600)/360;for(let side=0;side<2;side++){const shift=(side?1:-1)*24*t;x.drawImage(s,side?230:0,y,230,1,(side?230:0)+shift,yy,230,1.1);}}
   }
  }else if(g.id==='nike-pro-crop'){x.drawImage(s,0,0,W,270,0,-8,W,270);x.drawImage(s,0,270,W,90,0,262,W,102);}else{x.drawImage(s,0,-8);}await save(c,'wardrobe/'+g.id+'-'+v);
 }}
 // Exact fitted Ellesse bottoms already share the new body leg landmarks.
 for(let v of ['front','back']){let s=await source(root+'/v2/nike-pro-crop-ellesse-pink-joggers-'+v+'.webp'),x=s.getContext('2d'),d=x.getImageData(0,0,W,H),p=d.data;for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){let i=(y*W+xx)*4,r=p[i],g=p[i+1],b=p[i+2];if(y<400||y>877||xx<70||xx>400||r>g*1.12&&g>b*1.12&&!(v==='front'&&xx>310&&xx<345&&y>490&&y<530)||b>r*1.1||y>=840&&Math.max(r,g,b)-Math.min(r,g,b)<35)p[i+3]=0;}x.putImageData(d,0,0);let c=canvas();c.getContext('2d').drawImage(s,0,-10);await save(c,'wardrobe/ellesse-pink-joggers-'+v);}

 for(let j of spec.garments||[])if(j.id!=='core-hoodie')await paired(j.file,'wardrobe/'+j.id,j.target);
 for(let v of ['front','back']){let c=await source(root+'/casual-'+v+'.webp'),x=c.getContext('2d'),d=x.getImageData(0,0,W,H),p=d.data;for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){let i=(y*W+xx)*4,r=p[i],g=p[i+1],b=p[i+2],hem=455-Math.abs(xx-230)*.05;if(y<140||y>502||(xx>110&&xx<350&&y>hem)||r>g*1.12&&g>b*1.12&&r>90)p[i+3]=0;}x.putImageData(d,0,0);await save(c,'wardrobe/core-hoodie-'+v);}

 for(let kit of prov.kits)for(let v of ['front','back'])for(let part of ['top','bottoms','socks']){let s=await source(root+'/kits/'+kit.id+'-'+part+'-'+v+'.webp'),c=canvas(),x=c.getContext('2d');if(part==='top')x.drawImage(s,0,-8);else if(part==='bottoms')x.drawImage(s,0,-2);else {
    const bp=body.getContext('2d').getImageData(v==='front'?222:854,0,W,H).data,sp=s.getContext('2d').getImageData(0,0,W,H).data;
    for(let y=703;y<1009;y++){const yy=Math.floor(y<925?700+(y-703)*183/222:883+(y-925));for(let side=0;side<2;side++){let lo=side?255:35,hi=side?435:205,s0=hi,s1=lo,b0=hi,b1=lo;for(let xx=lo;xx<hi;xx++){if(sp[(y*W+xx)*4+3]>100){s0=Math.min(s0,xx);s1=Math.max(s1,xx);}if(bp[(yy*W+xx)*4+3]>150){b0=Math.min(b0,xx);b1=Math.max(b1,xx);}}if(s1>s0&&b1>b0)x.drawImage(s,s0,y,s1-s0+1,1,b0-1,yy,b1-b0+3,1.1);}}
   }await save(c,'kits/'+kit.id+'-'+part+'-'+v);}
 // Independent boot bones: preserve each generated boot's aspect ratio.
 for(let boot of prov.footwear)for(let v of ['front','back']){let s=await source(root+'/footwear/'+boot.id+'-'+v+'.webp'),c=canvas(),x=c.getContext('2d');for(let side=0;side<2;side++){let b=bounds(s,side*230,(side+1)*230),scale=98/b[3],center=v==='front'?(side?373:94):(side?363:98);x.drawImage(s,...b,center-b[2]*scale/2,879,b[2]*scale,98);}await save(c,'footwear/'+boot.id+'-'+v);}
 for(let h of spec.hair){let s=await source(h.file);for(let i=0;i<2;i++){let c=canvas(),x=c.getContext('2d'),a=h.anchors[i];x.drawImage(s,i*s.width/2,0,s.width/2,s.height,230-(a[0]-i*s.width/2)*a[2],a[1]+60,s.width/2*a[2],s.height*a[2]);await save(c,'hair/'+h.id+'-'+(i?'back':'front'));}}
 console.log('Exported complete rig');
}
main().catch(e=>{console.error(e);process.exitCode=1});
