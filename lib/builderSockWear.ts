/** Fit selected knit to a boot's actual collar, while keeping the full crew or
 * club shaft above it. Footwear is drawn independently over this sock layer.
 */
export function sockInBoot(sock:CanvasImageSource,cuff:HTMLImageElement){
 const c=document.createElement('canvas');c.width=460;c.height=1024;const x=c.getContext('2d')!;x.drawImage(sock,0,0);const source=x.getImageData(0,0,460,1024).data;x.clearRect(0,0,460,1024);x.drawImage(cuff,0,0);const out=x.getImageData(0,0,460,1024),p=out.data;
 for(let y=0;y<1024;y++)for(let side=0;side<2;side++){
  let sl=460,sr=0,dl=460,dr=0;for(let xx=side*230;xx<(side+1)*230;xx++){const i=(y*460+xx)*4;if(source[i+3]>150){sl=Math.min(sl,xx);sr=Math.max(sr,xx);}if(p[i+3]>150){dl=Math.min(dl,xx);dr=Math.max(dr,xx);}}
  if(sr<=sl||dr<=dl)continue;for(let xx=side*230;xx<(side+1)*230;xx++){const i=(y*460+xx)*4;if(!p[i+3])continue;const u=Math.min(1,Math.max(0,(xx-dl)/(dr-dl))),si=(y*460+Math.round(sl+u*(sr-sl)))*4;for(let k=0;k<3;k++)p[i+k]=source[si+k];}
 }
 x.putImageData(out,0,0);x.clearRect(0,0,460,860);x.drawImage(sock,0,0,460,860,0,0,460,860);return c;
}
