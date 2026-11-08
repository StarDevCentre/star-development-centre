"use client";
import * as THREE from "three";
import {daylight} from "../../lib/starHQ/demoWorld";
import {createReception} from "./receptionScene";
import {loadHumanCast} from "./riggedCharacters";

/**
 * STAR HQ v2: actual glTF-skinned people and a PBR 3D academy reception.
 * Retains the existing v1 gameplay/controller interface.
 * The canvas, WebGL scene, rigs and textures are torn down when leaving HQ.
 */
export class StarHQRenderer {
 constructor(canvas){
  if(!canvas.getContext("webgl2"))throw new Error("STAR HQ v2 requires WebGL2 graphics support.");
  this.canvas=canvas;
  this.disposed=false;
  this.last=performance.now();
  this.cameraStarted=false;
  this.clockSample=0;
  this.scene=new THREE.Scene();
  this.scene.background=new THREE.Color(0x19334d);
  this.scene.fog=new THREE.Fog(0x263c53,28,82);
  this.camera=new THREE.PerspectiveCamera(58,1,.06,95);
  const narrow=window.matchMedia("(max-width: 760px)").matches;
  this.renderer=new THREE.WebGLRenderer({
   canvas,alpha:false,antialias:!narrow,
   powerPreference:"high-performance",stencil:false
  });
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.27;
  this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type=THREE.PCFShadowMap;
  this.pixelRatio=Math.min(narrow?1.35:1.65,window.devicePixelRatio||1);
  this.renderer.setPixelRatio(this.pixelRatio);
  this.world=createReception(this.scene);
  this.cast=null;
  this.readyPromise=loadHumanCast(this.scene).then(cast=>{
   if(this.disposed){cast.dispose();return;}
   this.cast=cast;
  });
 }
 render(frame){
  if(this.disposed)return;
  const now=performance.now();
  const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
  const width=Math.max(1,Math.round(this.canvas.clientWidth));
  const height=Math.max(1,Math.round(this.canvas.clientHeight));
  if(this.lastWidth!==width||this.lastHeight!==height){
   this.renderer.setSize(width,height,false);
   this.camera.aspect=width/height;
   this.camera.updateProjectionMatrix();
   this.lastWidth=width;this.lastHeight=height;
  }
  const player=frame.player;
  const yaw=frame.yaw;
  let back=3.32;
  const dx=-Math.sin(yaw),dz=-Math.cos(yaw);
  if(dx>0)back=Math.min(back,(8.55-player.x)/Math.max(.01,dx));
  if(dx<0)back=Math.min(back,(player.x+8.55)/Math.max(.01,-dx));
  if(dz>0)back=Math.min(back,(5.50-player.z)/Math.max(.01,dz));
  if(dz<0)back=Math.min(back,(player.z+5.50)/Math.max(.01,-dz));
  back=Math.max(.80,Math.min(3.32,back));
  const goal=new THREE.Vector3(player.x+dx*back,2.64,player.z+dz*back);
  const target=new THREE.Vector3(player.x,1.20,player.z);
  if(this.cameraStarted)this.camera.position.lerp(goal,Math.min(1,dt*8));
  else {this.camera.position.copy(goal);this.cameraStarted=true;}
  this.camera.lookAt(target);
  this.world.updateLight(daylight(frame.date).light);
  if(this.cast)this.cast.update(frame,dt);
  this.renderer.render(this.scene,this.camera);
 }
 dispose(){
  if(this.disposed)return;
  this.disposed=true;
  this.cast?.dispose();
  this.world.dispose();
  this.renderer.dispose();
  this.renderer.forceContextLoss();
 }
}
