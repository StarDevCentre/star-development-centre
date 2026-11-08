"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import {DIALOGUE, NPC_PATHS, SAMPLE_PLAYER, START, londonHour, moveWithCollisions, nearestInteraction, npcAtTime} from "../../lib/starHQ/demoWorld";
import {StarHQRenderer, type HQPlayer} from "./StarHQRenderer";

type Nearby={kind:"mia"|"door";label:string;id:string}|null;
type DialogState={mode:"menu"|"reply";reply?:string}|null;
const WALK_METRES_PER_SECOND=1.38;
export function StarHQExperience(){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const stateRef=useRef<HQPlayer>({x:START.x,z:START.z,heading:Math.PI,moving:false,steps:0});
 const yawRef=useRef(Math.PI);
 const keysRef=useRef<Set<string>>(new Set());
 const joystickRef=useRef({x:0,y:0});
 const nearbyRef=useRef<Nearby>(null);
 const dialogRef=useRef<DialogState>(null);
 const soundRef=useRef(false);
 const musicRef=useRef(false);
 const soundAtRef=useRef(0);
 const musicAtRef=useRef(0);
 const ctxRef=useRef<AudioContext|null>(null);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [error,setError]=useState("");
 const [nearby,setNearby]=useState<Nearby>(null);
 const [dialog,setDialog]=useState<DialogState>(null);
 const [notice,setNotice]=useState("");
 const [help,setHelp]=useState(false);
 const [music,setMusic]=useState(false);
 const [sound,setSound]=useState(false);
 const [time,setTime]=useState(()=>londonHour(new Date()).label);
 const [quality,setQuality]=useState("auto");
 const [joystick,setJoystick]=useState({x:0,y:0});
 function tone(freq:number,duration:number,volume:number){
  const ctx=ctxRef.current;if(!ctx)return;
  const start=ctx.currentTime;
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type="sine";osc.frequency.value=freq;
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.02);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain).connect(ctx.destination);osc.start(start);osc.stop(start+duration+.03);
 }
 function enableAudio(){
  if(!ctxRef.current)ctxRef.current=new AudioContext();
  if(ctxRef.current.state==="suspended")void ctxRef.current.resume();
 }
 function openInteraction(){
  const near=nearbyRef.current;if(!near||dialogRef.current)return;
  if(soundRef.current)tone(510,.10,.028);
  if(near.kind==="mia"){
   dialogRef.current={mode:"menu"};setDialog({mode:"menu"});setNotice("");
  }else setNotice(near.label+" — Coming soon. We're preparing this area of STAR HQ!");
 }
 const openRef=useRef(openInteraction);openRef.current=openInteraction;
 const closeDialog=useCallback(()=>{dialogRef.current=null;setDialog(null);},[]);
 const choose=(id:string)=>{
  const option=DIALOGUE.find(o=>o.id===id);if(!option)return;
  if(soundRef.current)tone(380,.12,.020);
  const next:DialogState={mode:"reply",reply:option.reply};
  dialogRef.current=next;setDialog(next);
 };
 const reset=()=>{stateRef.current={x:START.x,z:START.z,heading:Math.PI,moving:false,steps:0};yawRef.current=Math.PI;setNotice("");closeDialog();};

 useEffect(()=>{
  const down=(ev:KeyboardEvent)=>{
   const key=ev.key.toLowerCase();
   if(["w","a","s","d","arrowup","arrowleft","arrowdown","arrowright","e","escape"].includes(key)){
    if(document.activeElement?.tagName!=="INPUT")ev.preventDefault();
    if(key==="e"&&!ev.repeat)openRef.current();
    else if(key==="escape")closeDialog();
    else keysRef.current.add(key);
   }
  };
  const up=(ev:KeyboardEvent)=>keysRef.current.delete(ev.key.toLowerCase());
  const blur=()=>{keysRef.current.clear();joystickRef.current={x:0,y:0};setJoystick({x:0,y:0});};
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
  return ()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
 },[closeDialog]);

 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  let renderer:StarHQRenderer;
  try{renderer=new StarHQRenderer(canvas);setStatus("ready");}
  catch(err){setError(err instanceof Error?err.message:"Could not initialise 3D graphics.");setStatus("error");return;}
  let running=true,frameId=0,last=performance.now(),elapsed=0,lastUpdate=0;
  const run=(now:number)=>{
   if(!running)return;
   frameId=requestAnimationFrame(run);
   if(document.visibilityState!=="visible"){last=now;return;}
   const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;
   elapsed+=dt;
   const keys=keysRef.current,joy=joystickRef.current;
   const forward=Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown"))-joy.y;
   const sideways=Number(keys.has("d")||keys.has("arrowright"))-Number(keys.has("a")||keys.has("arrowleft"))+joy.x;
   const amount=Math.hypot(forward,sideways);
   const player=stateRef.current;
   if(!dialogRef.current&&amount>.08){
    const f=forward/Math.max(1,amount),s=sideways/Math.max(1,amount),yaw=yawRef.current;
    const dx=(Math.sin(yaw)*f-Math.cos(yaw)*s)*WALK_METRES_PER_SECOND*dt;
    const dz=(Math.cos(yaw)*f+Math.sin(yaw)*s)*WALK_METRES_PER_SECOND*dt;
    const next=moveWithCollisions(player,dx,dz);
    const travelled=Math.hypot(next.x-player.x,next.z-player.z);
    if(travelled>.0001){
     player.x=next.x;player.z=next.z;player.moving=true;player.steps+=dt;
     const wanted=Math.atan2(dx,dz),difference=Math.atan2(Math.sin(wanted-player.heading),Math.cos(wanted-player.heading));
     player.heading+=difference*Math.min(1,dt*9);
     if(soundRef.current&&elapsed-soundAtRef.current>.49){
      soundAtRef.current=elapsed;tone(110,.07,.012);
     }
    }else player.moving=false;
   }else player.moving=false;
   if(musicRef.current&&elapsed-musicAtRef.current>2.2){
    musicAtRef.current=elapsed;
    const notes=[220,293.66,329.63,261.63];
    tone(notes[Math.floor(elapsed/2.2)%notes.length],1.8,.007);
   }
   const near=nearestInteraction(player);
   if(near?.id!==nearbyRef.current?.id){nearbyRef.current=near;setNearby(near);setNotice("");}
   if(now-lastUpdate>1400){lastUpdate=now;setTime(londonHour(new Date()).label);}
   renderer.render({player,yaw:yawRef.current,date:new Date(),npcs:NPC_PATHS.map(p=>npcAtTime(p,elapsed))});
  };
  frameId=requestAnimationFrame(run);
  return ()=>{running=false;cancelAnimationFrame(frameId);renderer.dispose();};
 },[]);

 useEffect(()=>()=>{if(ctxRef.current)void ctxRef.current.close();},[]);
 const cameraPointer=useRef<{id:number;x:number}|null>(null);
 function pointerDown(e:React.PointerEvent<HTMLCanvasElement>){if(dialogRef.current)return;cameraPointer.current={id:e.pointerId,x:e.clientX};e.currentTarget.setPointerCapture(e.pointerId);}
 function pointerMove(e:React.PointerEvent<HTMLCanvasElement>){
  if(cameraPointer.current?.id!==e.pointerId||dialogRef.current)return;
  const delta=e.clientX-cameraPointer.current.x;cameraPointer.current.x=e.clientX;
  yawRef.current+=delta*.0065;
 }
 function pointerEnd(e:React.PointerEvent<HTMLCanvasElement>){
  if(cameraPointer.current?.id===e.pointerId)cameraPointer.current=null;
 }
 const stickRef=useRef<{id:number;x:number;y:number}|null>(null);
 function stickDown(e:React.PointerEvent<HTMLDivElement>){
  e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
  const r=e.currentTarget.getBoundingClientRect();stickRef.current={id:e.pointerId,x:r.left+r.width/2,y:r.top+r.height/2};
 }
 function stickMove(e:React.PointerEvent<HTMLDivElement>){
  const v=stickRef.current;if(!v||v.id!==e.pointerId)return;
  const x=Math.max(-1,Math.min(1,(e.clientX-v.x)/49)),y=Math.max(-1,Math.min(1,(e.clientY-v.y)/49));
  joystickRef.current={x,y};setJoystick({x,y});
 }
 function stickEnd(e:React.PointerEvent<HTMLDivElement>){
  if(stickRef.current?.id!==e.pointerId)return;
  stickRef.current=null;joystickRef.current={x:0,y:0};setJoystick({x:0,y:0});
 }
 const toggleMusic=()=>{enableAudio();setMusic(v=>{musicRef.current=!v;return !v;});};
 const toggleSound=()=>{enableAudio();setSound(v=>{soundRef.current=!v;return !v;});};
 return <section className="hq-experience" aria-label="STAR HQ owner-only playable 3D preview">
  <canvas ref={canvasRef} className="hq-canvas" aria-label="Interactive three-dimensional STAR football academy reception"
   onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}/>
  <header className="hq-hud-header">
   <div className="hq-hud-brand"><strong>STAR HQ</strong><span>OWNER PROTOTYPE · FICTIONAL PLAYER</span></div>
   <div className="hq-time">{time}</div>
   <Link href="/staff" className="hq-exit">Exit HQ</Link>
  </header>
  {status==="loading"&&<div className="hq-overlay-center" role="status">Building your 3D academy…</div>}
  {status==="error"&&<div className="hq-overlay-center" role="alert"><strong>3D graphics unavailable</strong><p>{error}</p><Link href="/staff">Return to Staff Portal</Link></div>}
  {status==="ready"&&<>
   <div className="hq-character-name">Playing as <strong>{SAMPLE_PLAYER.firstName}</strong> · Test player only</div>
   {!dialog&&nearby&&<button className="hq-talk-prompt" type="button" onClick={openInteraction}>{nearby.label} <kbd>E</kbd></button>}
   {notice&&<div className="hq-notice" role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="Dismiss notice">×</button></div>}
   <div className="hq-controls-area">
    <div className="hq-stick" role="group" aria-label="Touch movement joystick" onPointerDown={stickDown}
      onPointerMove={stickMove} onPointerUp={stickEnd} onPointerCancel={stickEnd}>
     <span className="hq-stick-inner" style={{transform:"translate("+(joystick.x*38)+"px,"+(joystick.y*38)+"px)"}}/>
    </div>
    <div className="hq-control-buttons">
     {nearby&&!dialog&&<button type="button" className="hq-interact" onClick={openInteraction}>Interact</button>}
     <button type="button" onClick={()=>setHelp(v=>!v)} aria-expanded={help}>Controls</button>
    </div>
   </div>
   <div className="hq-side-tools">
    <button type="button" aria-pressed={sound} onClick={toggleSound}>Sounds: {sound?"On":"Off"}</button>
    <button type="button" aria-pressed={music} onClick={toggleMusic}>Music: {music?"On":"Off"}</button>
    <button type="button" onClick={reset}>Restart</button>
   </div>
   {help&&<div className="hq-help" role="dialog" aria-label="STAR HQ controls">
    <button type="button" className="hq-close" onClick={()=>setHelp(false)} aria-label="Close controls">×</button>
    <h2>How to explore</h2><p>Walk with WASD or arrow keys. Drag the view to move the camera. On mobile, use the joystick and swipe the right side of the 3D view. Approach Mia and press E or tap Interact. Exit at any time.</p>
    <p>All characters and account details are fictional in this prototype.</p>
   </div>}
   {dialog&&<div className="hq-dialogue-backdrop">
    <div className="hq-dialogue" role="dialog" aria-modal="true" aria-label="Conversation with Mia">
     <div className="hq-dialogue-heading"><span className="hq-person-badge">M</span><div><strong>Mia</strong><span>STAR Reception · Age 22</span></div>
      <button type="button" onClick={closeDialog} aria-label="End conversation">×</button></div>
     {dialog.mode==="menu"?<>
      <p>Hi, {SAMPLE_PLAYER.firstName}! Welcome to STAR HQ. It's lovely to see you. What would you like to know?</p>
      <div className="hq-dialogue-options">{DIALOGUE.map(option=><button key={option.id} type="button" onClick={()=>choose(option.id)}>{option.label}</button>)}</div>
     </>:<>
      <p>{dialog.reply}</p>
      <div className="hq-dialogue-options"><button type="button" onClick={()=>{dialogRef.current={mode:"menu"};setDialog({mode:"menu"});}}>Ask Mia another question</button>
       <button type="button" onClick={closeDialog}>Finish conversation</button></div>
     </>}
    </div>
   </div>}
  </>}
 </section>;
}
