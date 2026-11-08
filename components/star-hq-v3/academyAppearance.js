"use client";
import * as THREE from "three";

/**
 * STAR HQ wardrobe pass:
 * - Uses the actual skin-weighted triangles of the licensed humanoid rig for
 *   fitted academy garments. Clothing therefore follows the player's bones.
 * - Does not turn or hide human skin blue, and makes no changes to account data.
 * - These are mobile preview garments, not yet an exact UV copy of the approved
 *   bespoke STAR training top. Exact seams/printing require bespoke texture art.
 */
const THEME={
  navy:0x132b4a, red:0xb3323c, gold:0xc9ac6c, short:0x111a27,
  sock:0x181d26, burgundy:0x80333c
};
function material(colour){
 return new THREE.MeshStandardMaterial({
  color:colour,metalness:.03,roughness:.83,
  polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide,
 });
}
function fittedMesh(source,range,colour,offset=0.007){
 const geometry=source.geometry;
 if(!geometry?.attributes?.position||!geometry.attributes.skinIndex||!geometry.attributes.skinWeight)return null;
 const pos=geometry.attributes.position;
 const ind=geometry.index;
 const box=new THREE.Box3().setFromBufferAttribute(pos);
 const lo=box.min.y,hi=box.max.y,scale=Math.max(.001,hi-lo);
 const cx=(box.min.x+box.max.x)/2, totalWidth=Math.max(.001,box.max.x-box.min.x);
 const picked=[];
 const count=ind?ind.count:pos.count;
 for(let i=0;i<count;i+=3){
  const ids=[0,1,2].map(j=>ind?ind.getX(i+j):i+j);
  const vertices=ids.map(j=>({
   y:(pos.getY(j)-lo)/scale,
   x:(pos.getX(j)-cx)/totalWidth
  }));
  const aveY=vertices.reduce((a,v)=>a+v.y,0)/3;
  const aveX=vertices.reduce((a,v)=>a+v.x,0)/3;
  if(aveY>=range[0]&&aveY<=range[1]&&Math.abs(aveX)<range[2]){
   picked.push(...ids);
  }
 }
 if(picked.length<12)return null;
 const result=geometry.clone();
 result.setIndex(picked);
 const verts=result.attributes.position;
 const norms=result.attributes.normal;
 if(norms){
  for(let k=0;k<verts.count;k++){
   verts.setXYZ(k,verts.getX(k)+norms.getX(k)*offset,
    verts.getY(k)+norms.getY(k)*offset,verts.getZ(k)+norms.getZ(k)*offset);
  }
  verts.needsUpdate=true;
 }
 result.clearGroups();
 const top=new THREE.SkinnedMesh(result,material(colour));
 top.name="STAR fitted kit / deforming skinned cloth";
 top.frustumCulled=false;
 // Use the *same* skeleton and bind matrix as the source skinned mesh. Thus
 // when the walk animation moves hips/spine/legs the clothing deforms with it.
 top.bind(source.skeleton,source.bindMatrix.clone());
 top.position.copy(source.position);top.quaternion.copy(source.quaternion);top.scale.copy(source.scale);
 top.castShadow=true;top.receiveShadow=true;
 return top;
}
function tintHairMaterials(meshRoot,id){
 const tint=id==="player"?new THREE.Color("#f2c974"):id==="mia"?new THREE.Color("#61432e"):null;
 if(!tint)return;
 meshRoot.traverse(obj=>{
  if(!obj.isMesh)return;
  const materials=Array.isArray(obj.material)?obj.material:[obj.material];
  const changed=materials.map(source=>{
   const cloned=source.clone();
   if(/opacity|hair/i.test(source.name||"")){
    cloned.color?.set(tint);
    cloned.emissive?.copy(tint).multiplyScalar(id==="player"?.13:.035);
    cloned.roughness=.88;
   }
   return cloned;
  });
  obj.material=Array.isArray(obj.material)?changed:changed[0];
 });
}
function ponytail(meshRoot){
 // Lightweight hairstyle augmentation, animated by the rig's own head bone.
 const head=meshRoot.getObjectByName("Bip01 Head");
 if(!head)return;
 const material=new THREE.MeshStandardMaterial({color:0xe4bd73,roughness:.88,metalness:0});
 const band=new THREE.MeshStandardMaterial({color:0x111f39,roughness:.6});
 const group=new THREE.Group();group.name="Alex blonde ponytail";head.add(group);
 // The offset is relative to the head bone, never an independent world mesh.
 // A tapered multi-strand shape looks less toy-like than primitive spheres.
 const curve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,.14,-.155),new THREE.Vector3(0,.15,-.23),
  new THREE.Vector3(.025,.035,-.28),new THREE.Vector3(.038,-.13,-.30),
  new THREE.Vector3(.02,-.24,-.26)
 ]);
 const hair=new THREE.Mesh(new THREE.TubeGeometry(curve,16,.058,7,false),material);
 hair.castShadow=true;group.add(hair);
 for(let n=0;n<5;n++){
  const shift=(n-2)*.015;
  const ribbon=new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(shift,.09,-.215),
      new THREE.Vector3(shift+.015,-.02,-.285),
      new THREE.Vector3(shift+.02,-.17,-.285)
    ]),10,.012,5,false),new THREE.MeshStandardMaterial({
     color:n%2===0?0xf4d88e:0xc79755,roughness:.83
    })
  );
  ribbon.castShadow=true;group.add(ribbon);
 }
 const elastic=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,5,12),band);
 elastic.position.set(0,.14,-.20);
 group.add(elastic);
}
function addJerseyPiping(root){
 const gold=new THREE.MeshStandardMaterial({color:THEME.gold,roughness:.48,metalness:.12});
 const shoulder=root.getObjectByName("Bip01 Spine2");
 if(!shoulder)return;
 for(const x of [-.15,.15]){
  const seam=new THREE.Mesh(new THREE.CapsuleGeometry(.008,.19,3,7),gold);
  seam.position.set(x,.075,.11);seam.rotation.z=x>0?-.46:.46;
  shoulder.add(seam);
 }
}
export function styleAcademyCharacter(meshRoot,id){
 tintHairMaterials(meshRoot,id);
 const primary=meshRoot.getObjectByName("Bip01");
 const skinned=[];
 meshRoot.traverse(o=>{if(o.isSkinnedMesh)skinned.push(o)});
 const isFootballer=id==="player"||id==="player-a"||id==="player-b";
 const isAcademyStaff=id==="mia"||id==="coach"||id==="admin";
 for(const mesh of skinned){
  // Render over the underlying licensed clothing. Torso, shorts and socks are
  // separate anatomically selected pieces from the original mesh triangles.
  if(isFootballer||isAcademyStaff){
   const jersey=fittedMesh(mesh,[.54,.80,.26],THEME.navy);
   if(jersey)mesh.parent.add(jersey);
  }
  if(isFootballer){
   const shorts=fittedMesh(mesh,[.38,.54,.29],THEME.short,.010);
   if(shorts)mesh.parent.add(shorts);
   const socks=fittedMesh(mesh,[.085,.33,.25],THEME.sock,.010);
   if(socks)mesh.parent.add(socks);
  }
  if(id==="mia"){
   const trousers=fittedMesh(mesh,[.10,.55,.24],THEME.short,.009);
   if(trousers)mesh.parent.add(trousers);
  }
 }
 if(id==="player"){ponytail(meshRoot);addJerseyPiping(meshRoot);}
 return {hasRig:!!primary};
}
