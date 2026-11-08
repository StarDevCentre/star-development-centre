"use client";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const C = {
  navy:0x10223c, deep:0x09172b, midnight:0x122a48, gold:0xc9a46b,
  paleGold:0xf5db9a, porcelain:0xe9e6df, cream:0xf8f4ec,
  walnut:0x806249, grey:0x777b7c, green:0x2d6d43
};
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const pct=(color,roughness=.3,metalness=.05)=>new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:.48,clearcoatRoughness:.14});
function rounded(w,h,d,r=.05){return new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3));}
function block(parent,x,y,z,w,h,d,material,r=.02){
 const m=new THREE.Mesh(rounded(w,h,d,r),material);
 m.position.set(x,y,z);m.castShadow=h>.25;m.receiveShadow=true;parent.add(m);return m;
}
function cylinder(parent,x,y,z,rt,rb,h,material,segments=24){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function seedNoise(n){const v=Math.sin(n*68.519+73.29)*10237.615;return v-Math.floor(v);}
function makeSurface(type){
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext("2d");if(!ctx)return null;
 if(type==="stone"){
  ctx.fillStyle="#d4cfc6";ctx.fillRect(0,0,512,512);
  for(let i=0;i<25000;i++){
   const v=seedNoise(i),x=seedNoise(i+19300)*512,y=seedNoise(i+8300)*512;
   ctx.fillStyle=v>.5?"rgba(120,110,99,.06)":"rgba(255,255,255,.08)";
   ctx.fillRect(x,y,v*2+.2,v*2+.2);
  }
  ctx.strokeStyle="rgba(116,109,102,.28)";ctx.lineWidth=3;
  ctx.strokeRect(0,0,512,512);
 }else{
  ctx.fillStyle="#927052";ctx.fillRect(0,0,512,512);
  for(let i=0;i<700;i++){
   const a=seedNoise(i+500)*512;
   ctx.fillStyle=i%3?"rgba(60,32,16,.10)":"rgba(226,183,121,.13)";
   ctx.fillRect(0,a,512,seedNoise(i*7)*2+.3);
  }
 }
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
 tex.anisotropy=4;
 tex.repeat.set(type==="stone"?9:1,type==="stone"?6:3);
 return tex;
}
function textTexture(title,subtitle,accent="#d6b47a"){
 const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=512;
 const ctx=canvas.getContext("2d");if(!ctx)return null;
 const gradient=ctx.createLinearGradient(0,0,1024,512);
 gradient.addColorStop(0,"#0a1b33");gradient.addColorStop(1,"#1c3959");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);
 ctx.strokeStyle="rgba(201,164,107,.28)";ctx.lineWidth=2;
 for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(i*140-260,0);ctx.lineTo(i*140+60,512);ctx.stroke();}
 ctx.strokeStyle=accent;ctx.lineWidth=8;ctx.strokeRect(17,17,990,478);
 ctx.fillStyle=accent;ctx.fillRect(70,110,7,300);
 ctx.textAlign="left";ctx.fillStyle="#fff7ee";
 ctx.font="900 63px Arial";ctx.fillText(title,110,225,830);
 ctx.font="600 29px Arial";ctx.fillStyle="#e3c28a";ctx.fillText(subtitle,112,294,820);
 ctx.font="500 23px Arial";ctx.fillStyle="#cbd6e2";ctx.fillText("BELIEVE. DEVELOP. ACHIEVE.",112,354);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
function showScreen(parent,x,y,z,w,h,title,subtitle,side=0){
 const board=block(parent,x,y,z,w+.12,h+.12,.12,mat(0x0b121e,.27,.1),.055);
 const image=textTexture(title,subtitle);
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
  new THREE.MeshBasicMaterial({map:image,transparent:false,toneMapped:false}));
 plane.position.set(x,y,z+.075);plane.rotation.y=side;parent.add(plane);
 return {board,image};
}
function door(parent,side,z,title){
 const x=side*8.87,frame=mat(C.navy,.47),bronze=pct(C.gold,.25,.56);
 block(parent,x,1.42,z,.26,2.88,2.15,bronze,.04);
 block(parent,x+(side===-1?.02:-.02),1.42,z,.29,2.65,1.91,frame,.035);
 block(parent,x-side*.20,1.32,z+.59,.06,.23,.08,bronze,.025);
 const texture=textTexture(title.toUpperCase(),"COMING SOON");
 const face=new THREE.Mesh(new THREE.PlaneGeometry(1.93,.44),
  new THREE.MeshBasicMaterial({map:texture,transparent:false,side:THREE.DoubleSide,toneMapped:false}));
 face.rotation.y=side===-1?Math.PI/2:-Math.PI/2;
 face.position.set(x-side*.18,3.13,z);
 parent.add(face);
}
function plant(parent,x,z,height=1.2){
 const planter=pct(0xd6d0c4,.42,.06),leaf=mat(0x2e6952,.8),leaf2=mat(0x427c5a,.7),stem=mat(0x5b4a34,.9);
 cylinder(parent,x,.33,z,.37,.28,.66,planter);
 cylinder(parent,x,.77,z,.07,.10,.50,stem,10);
 for(let i=0;i<11;i++){
  const a=i*Math.PI*2/11,rad=.25+seedNoise(i+33)*.22;
  const center=new THREE.Vector3(x+Math.cos(a)*rad,1.12+seedNoise(i+88)*.55,z+Math.sin(a)*rad);
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.21,9,6),i%2?leaf:leaf2);
  mesh.position.copy(center);mesh.scale.set(.6,1.35,.7);mesh.rotation.z=Math.sin(a)*.58;mesh.rotation.x=Math.cos(a)*.56;
  mesh.castShadow=true;parent.add(mesh);
 }
}
function seating(parent){
 const blue=mat(0x566c83,.84),cushion=mat(0x7c92a2,.95),gold=pct(C.gold,.36,.42);
 const lounge=new THREE.Group();parent.add(lounge);
 block(lounge,-6.58,.35,-1.82,3.3,.56,1.0,blue,.20);
 block(lounge,-6.58,.70,-2.17,3.35,.89,.29,blue,.11);
 block(lounge,-8.16,.62,-1.82,.25,.72,1.02,blue,.08);
 block(lounge,-5.00,.62,-1.82,.25,.72,1.02,blue,.08);
 for(const x of [-7.5,-6.6,-5.7])block(lounge,x,.68,-1.66,.77,.22,.61,cushion,.11);
 const top=cylinder(lounge,-6.6,.39,-.11,.96,.96,.09,pct(0xbea07b,.33),32);
 top.scale.z=.53;
 cylinder(lounge,-6.6,.19,-.11,.09,.28,.32,gold,20);
 const art=block(lounge,-8.48,2.65,-3.4,.05,1.25,2.0,mat(0xe3d8c7,.82),.035);
 art.rotation.y=Math.PI/2;
}
function createPitches(scene){
 const grass=mat(0x37764c,.96),grass2=mat(0x357049,.97),white=mat(0xddeee2,.82);
 block(scene,18,-.20,0,18,.08,33,grass,.005);
 for(let i=0;i<9;i++)block(scene,18,-.154,-14+i*3.4,17.9,.008,1.7,i%2?grass:grass2,.001);
 for(const z of [-10,10]){
  block(scene,17,-.13,z,8,.018,.11,white,.005);
  block(scene,13,-.13,z,8,.018,.11,white,.005);
  block(scene,13,-.13,z,0.12,.018,15,white,.005);
  block(scene,21,-.13,z,0.12,.018,15,white,.005);
 }
 for(const [x,z] of [[13,-4],[21,4]]){
  const steel=mat(0xf3f4ee,.25,.5);
  cylinder(scene,x,1.08,z,.05,.05,2.15,steel);
  cylinder(scene,x+3,1.08,z,.05,.05,2.15,steel);
  block(scene,x+1.5,2.15,z,3.04,.09,.08,steel,.02);
 }
 const building=mat(0x60798c,.65),window=pct(0x8db3c2,.18,.38);
 block(scene,29,1.90,-5,6.8,3.8,12,building,.15);
 block(scene,29,3.90,-5,7.2,.23,12.4,mat(0x24364a,.48,.2),.07);
 for(const z of [-9,-6,-3,0])block(scene,25.52,2.1,z,.045,1.9,1.9,window,.005);
 for(const [x,z] of [[12,-11],[22,11]]){
  cylinder(scene,x,4,z,.09,.12,8,mat(0x8b929c,.36,.8),12);
  block(scene,x,8.02,z,1.22,.23,.28,new THREE.MeshBasicMaterial({color:0xf7ead0}),.07);
 }
}
function addCeiling(scene){
 const white=mat(0xe4dfd7,.88),walnut=mat(C.walnut,.65),light=new THREE.MeshBasicMaterial({color:0xfff0d4});
 block(scene,0,4.14,0,18.0,.14,12.0,white,.02);
 for(const z of [-4.7,-2.55,-.4,1.75,3.9,5.5]){
  block(scene,0,3.99,z,17.4,.20,.13,walnut,.02);
  for(const x of [-6.9,-3.5,0,3.5,6.9]){
   block(scene,x,3.86,z,1.12,.045,.06,light,.015);
  }
 }
}
export function createReception(scene){
 const group=new THREE.Group();group.name="STAR HQ v2 · Luxury reception";scene.add(group);
 const stoneTex=makeSurface("stone"),woodTex=makeSurface("wood");
 const floor=new THREE.MeshPhysicalMaterial({color:0xffffff,map:stoneTex,roughness:.29,metalness:.04,clearcoat:.22,clearcoatRoughness:.21});
 const timber=new THREE.MeshStandardMaterial({color:0xd1b596,map:woodTex,roughness:.66});
 const cream=mat(0xe3ddd5,.90),glass=new THREE.MeshPhysicalMaterial({
  color:0xbcd4e1,roughness:.08,metalness:.18,transparent:true,opacity:.18,
  depthWrite:false,side:THREE.DoubleSide
 });
 const stone=pct(0xe2dbd1,.25,.025),brass=pct(C.gold,.24,.72),dark=pct(C.navy,.42,.19);
 block(group,0,-.16,0,18.2,.27,12.2,floor,.01);
 // Architectural walls: timber only in focused zones, not all across reception.
 block(group,0,2.10,-6.03,18.2,4.25,.20,cream,.01);
 block(group,0,2.10,-5.90,8.65,4.03,.12,timber,.01);
 block(group,-9.03,2.10,0,.2,4.2,12.18,cream,.01);
 // South glazing and the real entrance frame; spawn is inside.
 for(const x of [-5.4,5.4])block(group,x,2.1,6.03,7.25,4.2,.18,stone,.01);
 for(const x of [-1.74,0,1.74])block(group,x,2.1,6.02,.065,4.15,.11,dark,.01);
 block(group,0,3.98,6.02,3.48,.16,.13,dark,.02);
 // East glass wall with mullions (training pitch vista).
 block(group,9.02,.45,0,.18,.9,12.05,stone,.02);
 block(group,9.02,3.78,0,.18,.84,12.05,stone,.02);
 for(const z of [-5.9,-3.8,-1.7,.4,2.5,4.6,5.9])block(group,9.02,2.08,z,.11,3.2,.13,dark,.01);
 block(group,9.02,2.10,0,.036,2.50,12.05,glass,.01);
 addCeiling(group);
 // The desk: curved edges and multiple contrasting architectural layers.
 block(group,0,.68,-4.22,5.08,1.33,1.33,timber,.23);
 block(group,0,.77,-3.55,4.78,.99,.16,dark,.06);
 block(group,0,1.37,-4.22,5.37,.15,1.59,stone,.10);
 block(group,0,.75,-3.43,4.28,.055,.07,new THREE.MeshBasicMaterial({color:0xe5b66b}),.02);
 for(const x of [-2.1,-1.7,-1.3,-.9,-.5,-.1,.3,.7,1.1,1.5,1.9])
  block(group,x,.78,-3.46,.036,.87,.07,brass,.012);
 // Full-height STAR identity on a dark but correctly facing feature plane.
 const logoFrame=block(group,0,2.66,-5.71,4.23,2.44,.12,dark,.09);
 block(group,0,3.92,-5.64,4.37,.055,.11,new THREE.MeshBasicMaterial({color:0xf1d18b}),.025);
 const logoTexture=new THREE.TextureLoader().load("/images/star-colour-transparent.webp",tex=>{
  const ratio=(tex.image?.width||900)/(tex.image?.height||550);
  logoMesh.scale.x=Math.min(3.65,2.02*ratio);
 });
 logoTexture.colorSpace=THREE.SRGBColorSpace;
 const logoMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),
  new THREE.MeshBasicMaterial({map:logoTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
 logoMesh.position.set(0,2.69,-5.625);logoMesh.scale.set(3.45,2.02,1);group.add(logoMesh);
 // Desk computer and subtle workstation items.
 block(group,.98,1.50,-4.70,.85,.75,.085,mat(0x1b2632,.48,.14),.04);
 block(group,.98,1.56,-4.62,.72,.59,.02,mat(0x2e4655,.39),.01);
 cylinder(group,.98,1.13,-4.45,.055,.11,.16,mat(0x5b6368,.36,.5),14);
 block(group,-1.30,1.50,-4.22,.61,.08,.38,mat(0xc7c5bf,.83),.02);
 // Screens use original inspirational content pending licensed highlights.
 showScreen(group,-6.10,2.64,-5.71,2.85,1.27,"WOMEN'S FOOTBALL","BELIEVE IN YOUR GAME");
 showScreen(group,6.15,2.64,-5.71,2.85,1.27,"YOUR GAME","YOUR FUTURE");
 seating(group);
 for(const [x,z] of [[-8.15,-4.40],[6.38,4.72],[5.82,-4.38]])plant(group,x,z);
 door(group,-1,.55,"Changing Rooms");
 door(group,1,-2.65,"Trophy Gallery");
 door(group,1,2.10,"Training Pitches");
 createPitches(group);
 const rug=block(group,0,.012,2.20,3.05,.015,2.8,mat(0x264466,.90),.09);
 rug.receiveShadow=true;
 const hemi=new THREE.HemisphereLight(0xe9f0ff,0x715c45,1.35);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffefdb,2.85);
 sun.position.set(5,9,5);sun.target.position.set(0,0,0);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;
 sun.shadow.camera.top=11;sun.shadow.camera.bottom=-11;sun.shadow.camera.near=.1;sun.shadow.camera.far=32;
 sun.shadow.normalBias=.018;
 scene.add(sun,sun.target);
 const practical=[];
 for(const [x,z] of [[-5,-1.5],[0,-2.8],[5,-1.5],[0,2.6]]){
  const lamp=new THREE.PointLight(0xffdbab,6,9,2.2);lamp.position.set(x,3.6,z);
  scene.add(lamp);practical.push(lamp);
 }
 return {
  group,hemi,sun,practical,
  updateLight(value){
   hemi.intensity=.68+value*.75;
   sun.intensity=.35+value*2.50;
   for(const lamp of practical)lamp.intensity=3.5+(1-value)*3.0;
   scene.background=new THREE.Color().setRGB(.06+.23*value,.11+.32*value,.18+.45*value);
  },
  dispose(){
   group.traverse(obj=>{
    if(obj.isMesh){obj.geometry.dispose();
     const ms=Array.isArray(obj.material)?obj.material:[obj.material];
     for(const m of ms){if(m.map&&m.map.isTexture)m.map.dispose();m.dispose();}
    }
   });
  }
 };
}
