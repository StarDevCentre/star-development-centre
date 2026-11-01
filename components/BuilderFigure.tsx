'use client';
import {useEffect,useRef,useState} from 'react';
import {builderLook,type BuilderLook} from '../lib/buildMyPlayer';
import {renderBuilderArtwork} from '../lib/builderArtwork';

/** The editor, card and squad share exactly the same garment-aware renderer. */
export function BuilderFigure({look:input,view='front',className='',name='Your player'}:{look:BuilderLook;view?:'front'|'back';className?:string;name?:string}){
 const canvas=useRef<HTMLCanvasElement>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 const key=JSON.stringify(builderLook(input));
 useEffect(()=>{let live=true;setError(false);void renderBuilderArtwork(JSON.parse(key) as BuilderLook,view).then(art=>{
  if(!live||!canvas.current)return;const ctx=canvas.current.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,460,1024);ctx.drawImage(art,0,0);
 }).catch(()=>{if(live)setError(true);});return()=>{live=false;};},[key,view,retry]);
 return <div className={`bp-art ${className}`}><canvas ref={canvas} width={460} height={1024} role="img" aria-label={`${name}, ${view} view in your chosen outfit`}/>{error&&<button type="button" onClick={()=>setRetry(v=>v+1)}>Reload character artwork</button>}</div>;
}
