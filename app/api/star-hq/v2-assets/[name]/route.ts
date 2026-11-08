/**
 * Licensed static GLB proxy for the owner-only STAR HQ v2 preview.
 * All sources are allowlisted MIT-licensed Microsoft Rocketbox avatars /
 * animations distributed by models.codelove.in, documented in
 * docs/star-hq/V2-ASSET-PROVENANCE.md.
 *
 * Clients load assets from STAR's origin rather than sending visitors'
 * requests and IP addresses directly to the upstream model site.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const sourceOrigin = "https://models.codelove.in";
const files: Record<string,string> = {
  "player.glb": "/models/female-adult-03.glb",
  "mia.glb": "/models/business-female-01.glb",
  "coach.glb": "/models/female-adult-05.glb",
  "academy-player-a.glb": "/models/female-child-01.glb",
  "academy-player-b.glb": "/models/female-child-02.glb",
  "parent.glb": "/models/male-adult-02.glb",
  "admin.glb": "/models/business-male-01.glb",
  "female-idle.glb": "/animations/f_idle_neutral_01.glb",
  "female-look.glb": "/animations/f_idle_look_around_01.glb",
  "female-talk.glb": "/animations/f_gestic_talk_neutral_01.glb",
  "female-walk.glb": "/animations/f_walk_neutral_01.glb",
  "male-idle.glb": "/animations/m_idle_neutral_01.glb",
  "male-walk.glb": "/animations/m_walk_neutral_01.glb",
};
export async function GET(_request:Request,{params}:{params:Promise<{name:string}>}){
  const {name}=await params;
  const path=Object.prototype.hasOwnProperty.call(files,name)?files[name]:undefined;
  if(!path)return new Response("Not found",{status:404,headers:{"X-Robots-Tag":"noindex"}});
  try{
    const response=await fetch(sourceOrigin+path,{
      next:{revalidate:86400},
      headers:{"Accept":"model/gltf-binary, application/octet-stream"}
    });
    if(!response.ok)return new Response("3D asset temporarily unavailable",{status:502});
    const data=await response.arrayBuffer();
    if(data.byteLength<24||data.byteLength>4_000_000||new DataView(data).getUint32(0,true)!==0x46546c67){
      return new Response("Invalid model asset",{status:502});
    }
    return new Response(data,{status:200,headers:{
      "Content-Type":"model/gltf-binary",
      "Cache-Control":"public,max-age=3600,s-maxage=86400,stale-while-revalidate=86400",
      "X-Content-Type-Options":"nosniff",
      "X-Robots-Tag":"noindex,nofollow"
    }});
  }catch{return new Response("3D asset temporarily unavailable",{status:502});}
}
