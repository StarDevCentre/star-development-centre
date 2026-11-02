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
// Individually measured textile end, before source footwear fragments.
const clubSockEnd:Record<string,number>={'home-2627-bristol-city':860};

/** Each source cuff is measured independently on the original 740px crop.
 * The textile is registered to the body's silhouette, never pasted as a second
 * leg. The same mask continues through the foot when no boots are selected. */
export const sockFit:Record<string,{sourceTop:number;rearTop:number;sourceEnd?:number;rearEnd?:number;top:number;dark?:boolean}>={
 'nike-ankle-white':{sourceTop:847,rearTop:851,top:840},
 'nike-ankle-black':{sourceTop:849,rearTop:855,top:840,dark:true},
 'nike-crew-white':{sourceTop:806,rearTop:804,top:804},
 'nike-crew-black':{sourceTop:814,rearTop:813,top:804,dark:true},
 'adidas-ankle-black':{sourceTop:844,rearTop:852,sourceEnd:891,rearEnd:898,top:840,dark:true},
 'gain-the-edge-crew':{sourceTop:810,rearTop:810,sourceEnd:885,top:804},
 'cherry-ribbon':{sourceTop:846,rearTop:851,top:840}
};
function pixels(im:CanvasImageSource,width:number,height:number,offset=0){const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d')!;x.drawImage(im,0,offset);return x.getImageData(0,0,width,height).data;}
/** Ignore detached antialias specks; use the actual connected leg/foot span. */
function span(p:Uint8ClampedArray,width:number,y:number,side:number,textile=false){let best:[number,number]=[0,0],start=-1;const lo=side?250:20,hi=side?440:210;for(let x=lo;x<=hi;x++){const i=(y*width+x)*4,r=p[i],g=p[i+1],b=p[i+2],skin=r>g*1.12&&g>b*1.12&&r>90,hit=x<hi&&p[i+3]>160&&(!textile||!skin);if(hit&&start<0)start=x;if(!hit&&start>=0){if(x-start>best[1]-best[0])best=[start,x];start=-1;}}return best;}
export function paintBuilderSocks(body:HTMLCanvasElement,socks:string,art:HTMLImageElement|null,knit:HTMLImageElement,view:'front'|'back'){
 const width=body.width,height=body.height,ctx=body.getContext('2d')!,shape=ctx.getImageData(0,0,width,height).data;
 const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d')!,frame=x.createImageData(width,height),p=frame.data;
 const club=socks.startsWith('home-2627-'),fit=sockFit[socks],top=club?700:fit?.top??840;
 const q=art?pixels(art,width,height,club?0:740):null,k=pixels(knit,width,height);
 const sourceTop=fit?(view==='back'?fit.rearTop:fit.sourceTop):849;
 const colour=fit?.dark?[30,32,40]:({navy:[24,42,73],black:[30,32,40],red:[189,38,53]} as Record<string,number[]>)[socks]||[245,247,252];
 for(let y=top;y<height;y++)for(let side=0;side<2;side++){
  const [bl,br]=span(shape,width,y,side),[kl,kr]=span(k,width,Math.max(846,y),side);
  const transition=Math.min(1,Math.max(0,(y-824)/40));
  const lo=bl*(1-transition)+kl*transition,hi=br*(1-transition)+kr*transition;if(hi<=lo)continue;
  const sourceY=club?Math.min(y,clubSockEnd[socks]??880):Math.round(sourceTop+(Math.min(y,883)-top)/(883-top)*((view==='back'?(fit?.rearEnd??fit?.sourceEnd??879):(fit?.sourceEnd??879))-sourceTop));
  const [sl,sr]=q?span(q,width,sourceY,side,!club):[0,0];
  for(let xx=Math.floor(lo);xx<Math.ceil(hi);xx++){
   const u=Math.max(0,Math.min(1,(xx-lo)/(hi-lo))),cuff=top+3*Math.sin(Math.PI*u)+(socks==='cherry-ribbon'?1.4*Math.sin(u*Math.PI*12):0),coverage=Math.min(1,Math.max(0,y+1-cuff));if(!coverage)continue;
   const i=(y*width+xx)*4,ki=((q?y:Math.max(883,y))*width+Math.min(width-1,Math.round(kl+2+u*Math.max(0,kr-kl-5))))*4;
   const light=kr>kl?(k[ki]+k[ki+1]+k[ki+2])/765:.9;
   const shade=Math.pow(Math.max(0,Math.min(1,(light-.65)/.35)),2);
   let rgb=fit?.dark||['black','navy','red'].includes(socks)?colour.map(v=>v*(.3+shade*.95)):colour.map(v=>v*light);
   if(club&&q){const end=clubSockEnd[socks]??880,[fl,fr]=span(q,width,end,side),fi=(end*width+Math.round((fl+fr)/2))*4;if(fr>fl)rgb=[q[fi],q[fi+1],q[fi+2]].map(v=>Math.min(255,v*light/.9));}
   if(q&&sr>sl){const qi=(sourceY*width+Math.min(sr-1,Math.round(sl+u*(sr-sl-1))))*4;
    const blend=Math.min(1,Math.max(0,(885-y)/4));
    if(q[qi+3]>160)rgb=rgb.map((v,n)=>v*(1-blend)+q[qi+n]*blend);
   }
   for(let n=0;n<3;n++)p[i+n]=rgb[n];p[i+3]=255*coverage*Math.min(1,xx+1-lo,hi-xx);
  }
 }
 x.putImageData(frame,0,0);return c;
}

