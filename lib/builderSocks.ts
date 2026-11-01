/** Independently selectable sock artwork; all seven options are free. */
export const builderSocks=[
 {id:'nike-ankle-white',label:'Nike ankle socks · white'},
 {id:'nike-ankle-black',label:'Nike ankle socks · black'},
 {id:'nike-crew-white',label:'Nike crew socks · white'},
 {id:'nike-crew-black',label:'Nike crew socks · black'},
 {id:'adidas-ankle-black',label:'adidas ankle socks · black'},
 {id:'gain-the-edge-crew',label:'Gain The Edge grip crew socks · white'},
 {id:'cherry-ribbon',label:'Cherry ribbon grip socks · white/burgundy'}
] as const;
export const builderSockIds=builderSocks.map(s=>s.id);

/** Find the exposed knit, seeded below each trouser cuff. Connectivity follows
 * the actual curved cuff and boot collar; it never recolours adidas stripes or
 * assumes that two trouser styles end at the same horizontal pixel row. */
function exposedKnit(p:Uint8ClampedArray,width:number,bottoms:string){
 const selected=new Uint8Array(p.length/4),lower=bottoms==='adidas-firebird-trousers'?873:['nike-club-joggers','ellesse-pink-joggers'].includes(bottoms)?866:840;
 for(const [left,right] of [[60,180],[280,410]]){
  let seed=-1,brightest=-1;
  for(let y=883;y<=899;y++)for(let x=left;x<right;x++){
   const j=y*width+x,i=j*4,light=Math.min(p[i],p[i+1],p[i+2]);
   if(p[i+3]>200&&light>brightest){brightest=light;seed=j;}
  }
  if(seed<0)continue;
  const pending=[seed];
  while(pending.length){
   const j=pending.pop()!,x=j%width,y=Math.floor(j/width),i=j*4;
   if(selected[j]||x<left||x>=right||y<lower||y>915||!p[i+3])continue;
   const light=Math.min(p[i],p[i+1],p[i+2]);
   if(light<130||Math.max(p[i],p[i+1],p[i+2])-light>40)continue;
   selected[j]=1;pending.push(j-1,j+1,j-width,j+width);
  }
 }
 return selected;
}
export function paintBuilderSocks(canvas:HTMLCanvasElement,bottoms:string,socks:string,art:HTMLImageElement|null){
 const ctx=canvas.getContext('2d')!,frame=ctx.getImageData(0,0,canvas.width,canvas.height),p=frame.data,knit=exposedKnit(p,canvas.width,bottoms);
 const colour=({navy:[24,42,73],black:[30,32,40],red:[189,38,53]} as Record<string,number[]>)[socks];
 if(!art){
  if(!colour)return;
  for(let j=0;j<knit.length;j++)if(knit[j]){const i=j*4,light=(p[i]+p[i+1]+p[i+2])/765;for(let k=0;k<3;k++)p[i+k]=colour[k]*(.6+light*.4);}
 }else{
  const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;
  const source=layer.getContext('2d')!;source.drawImage(art,0,740);const q=source.getImageData(0,0,layer.width,layer.height).data;
  const trousers=['nike-club-joggers','adidas-firebird-trousers','ellesse-pink-joggers'].includes(bottoms);
  for(let y=780;y<=915;y++)for(let x=60;x<410;x++){
   const j=y*canvas.width+x,i=j*4;
   if(knit[j]){
    // Keep the existing cuff/boot silhouette and antialiasing, replacing every
    // exposed white pixel, including the band above the former fixed cutoff.
    let sample=i;
    // Fixed exports can differ by a subpixel at the knit silhouette. Extend
    // the nearest opaque texture over the template's antialiased sock edge.
    if(q[sample+3]<64)for(let dx=1;dx<=6;dx++){
     const left=i-dx*4,right=i+dx*4;
     if(q[left+3]>=64){sample=left;break;}if(q[right+3]>=64){sample=right;break;}
    }
    if(q[sample+3])for(let k=0;k<3;k++)p[i+k]=q[sample+k];
   }else if(!trousers&&y<875&&q[i+3]>50){
    const r=q[i],g=q[i+1],b=q[i+2],skin=r>g*1.12&&g>b*1.12&&r>90;
    // The upper shaft/frill overlays the bare calf. Warm skin remains the
    // personalised template; the source's illustrated boots are never copied.
    if(!skin)for(let k=0;k<4;k++)p[i+k]=q[i+k];
   }
  }
 }
 ctx.putImageData(frame,0,0);
}
