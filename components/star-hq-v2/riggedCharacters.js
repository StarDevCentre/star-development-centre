"use client";
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {MeshoptDecoder} from "three/addons/libs/meshopt_decoder.module.js";

const URL_ROOT="/api/star-hq/v2-assets/";
const ACTORS=[
 {id:"player",file:"player.glb",gender:"female",height:1.63},
 {id:"mia",file:"mia.glb",gender:"female",height:1.69},
 {id:"coach",file:"coach.glb",gender:"female",height:1.72},
 {id:"player-a",file:"academy-player-a.glb",gender:"female",height:1.49},
 {id:"player-b",file:"academy-player-b.glb",gender:"female",height:1.50},
 {id:"parent",file:"parent.glb",gender:"male",height:1.77},
 {id:"admin",file:"admin.glb",gender:"male",height:1.77}
];
const CLIPS={
 "female-idle":{file:"female-idle.glb",name:"Idle"},
 "female-walk":{file:"female-walk.glb",name:"Walk"},
 "female-talk":{file:"female-talk.glb",name:"Talk"},
 "female-look":{file:"female-look.glb",name:"Look"},
 "male-idle":{file:"male-idle.glb",name:"Idle"},
 "male-walk":{file:"male-walk.glb",name:"Walk"}
};
function makeShadow(){
 const m=new THREE.Mesh(new THREE.CircleGeometry(.31,25),
  new THREE.MeshBasicMaterial({color:0x07121d,transparent:true,opacity:.19,depthWrite:false}));
 m.rotation.x=-Math.PI/2;m.position.y=.014;return m;
}
function badgeTexture(){
 const tex=new THREE.TextureLoader().load("/images/star-colour-transparent.webp");
 tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function addBadge(root,texture){
 const badge=new THREE.Mesh(new THREE.PlaneGeometry(.22,.15),new THREE.MeshBasicMaterial({
  map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false
 }));
 badge.name="STAR kit badge — preview";
 badge.position.set(0,1.29,.235);root.add(badge);
 return badge;
}
function toneHair(avatar,id){
 // Rocketbox avatar transparency material is typically the hair/eyelash atlas.
 // A modest tint preserves texture detail; no wholesale re-colouring of skin.
 const tint=id==="player"?0xf8d99b:id==="mia"?0x9d6650:null;
 if(!tint)return;
 avatar.traverse(obj=>{
  if(!obj.isMesh||!obj.material)return;
  const materials=Array.isArray(obj.material)?obj.material:[obj.material];
  const copies=materials.map(material=>{
   const m=material.clone();
   if(m.name.toLowerCase().includes("opacity")&&m.color)m.color.lerp(new THREE.Color(tint),.60);
   if(m.roughness!==undefined)m.roughness=Math.min(.98,Math.max(.52,m.roughness));
   return m;
  });
  obj.material=Array.isArray(obj.material)?copies:copies[0];
 });
}
function setupModel(gltf,id,height,logo){
 const pivot=new THREE.Group();pivot.name="STAR HQ v2 actor: "+id;
 const meshRoot=gltf.scene;
 meshRoot.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(meshRoot);
 const size=bounds.getSize(new THREE.Vector3());
 const centre=bounds.getCenter(new THREE.Vector3());
 const factor=height/Math.max(.1,size.y);
 meshRoot.scale.setScalar(factor);
 meshRoot.position.set(-centre.x*factor,-bounds.min.y*factor,-centre.z*factor);
 // The model's bones are preserved, keeping real rig animation compatible.
 meshRoot.traverse(obj=>{
  if(obj.isMesh||obj.isSkinnedMesh){
   obj.castShadow=id==="player"||id==="mia";
   obj.receiveShadow=true;
  }
 });
 toneHair(meshRoot,id);
 pivot.add(meshRoot);
 pivot.add(makeShadow());
 if(id==="player"||id==="mia")addBadge(pivot,logo);
 return pivot;
}
function animationAction(mixer,clip){
 if(!clip)return null;
 const a=mixer.clipAction(clip);
 a.enabled=true;a.setLoop(THREE.LoopRepeat,Infinity);
 a.clampWhenFinished=false;return a;
}
export async function loadHumanCast(scene){
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const logo=badgeTexture();
 const all=[...ACTORS.map(x=>x.file),...Object.values(CLIPS).map(x=>x.file)];
 const urls=[...new Set(all)];
 const files=await Promise.all(urls.map(async file=>{
  const gltf=await loader.loadAsync(URL_ROOT+file);
  return [file,gltf];
 }));
 const gltfs=new Map(files);
 const clips={};
 for(const [key,info] of Object.entries(CLIPS)){
  const animation=gltfs.get(info.file)?.animations?.[0]||null;
  clips[key]=animation;
 }
 const actors=new Map();
 for(const definition of ACTORS){
  const gltf=gltfs.get(definition.file);
  if(!gltf)throw new Error("Unable to load STAR HQ 3D character "+definition.id);
  const pivot=setupModel(gltf,definition.id,definition.height,logo);
  scene.add(pivot);
  const mixer=new THREE.AnimationMixer(pivot);
  const gender=definition.gender;
  const actions={
   idle:animationAction(mixer,clips[gender+"-idle"]),
   walk:animationAction(mixer,clips[gender+"-walk"]),
   talk:gender==="female"?animationAction(mixer,clips["female-talk"]):null,
   look:gender==="female"?animationAction(mixer,clips["female-look"]):null
  };
  actions.idle?.play();
  actors.set(definition.id,{...definition,pivot,mixer,actions,current:"idle",phase:0});
 }
 function change(actor,state){
  if(actor.current===state)return;
  const previous=actor.actions[actor.current];
  const next=actor.actions[state]||actor.actions.idle;
  if(!next)return;
  next.reset().fadeIn(.23).play();
  previous?.fadeOut(.23);
  actor.current=state;
 }
 return {
  actors,
  update(frame,delta){
   const active=actors.get("player");
   if(active){
    active.pivot.position.set(frame.player.x,0,frame.player.z);
    active.pivot.rotation.y=frame.player.heading;
    change(active,frame.player.moving?"walk":"idle");
   }
   for(const npc of frame.npcs){
    const actor=actors.get(npc.id);if(!actor)continue;
    actor.pivot.position.set(npc.x,0,npc.z);
    const facingMia=npc.id==="mia"&&frame.talking;
    actor.pivot.rotation.y=facingMia?
      Math.atan2(frame.player.x-npc.x,frame.player.z-npc.z):npc.heading;
    change(actor,facingMia?"talk":npc.walking?"walk":"idle");
   }
   for(const actor of actors.values())actor.mixer.update(delta);
  },
  dispose(){
   for(const actor of actors.values()){
    actor.mixer.stopAllAction();
    actor.mixer.uncacheRoot(actor.pivot);
    scene.remove(actor.pivot);
    actor.pivot.traverse(obj=>{
     if(obj.isMesh){
      obj.geometry?.dispose();
      const materials=Array.isArray(obj.material)?obj.material:[obj.material];
      for(const m of materials){if(m&&m!==null)m.dispose?.();}
     }
    });
   }
   logo.dispose();
   actors.clear();
  }
 };
}
