"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";
import {emptySpaceData,type SpaceData} from "../lib/playerSpace";
import type {PortalFeatureActions} from "../lib/playerPortalFeatures";

const PlayerSpace=dynamic(()=>import("./PlayerSpace").then(x=>x.PlayerSpace),{loading:()=> <p role="status">Opening the player's view…</p>});
const noWrite=async()=>{};
const previewActions:PortalFeatureActions={
 onSaveSquad:noWrite,onBootAnswer:noWrite,onSavePreparation:noWrite,
 onSendMessage:noWrite,onSaveMatchPlan:noWrite,onSaveMatch:noWrite,
 onLearningProgress:noWrite,onLearningAnswer:noWrite,onUnlockHairstyle:noWrite,
 onReadNotifications:noWrite,onShareAward:noWrite,onSaveAlias:noWrite
};
const validPlayerId=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OwnerPlayerSpacePreview(){
 const [target,setTarget]=useState("");
 const [data,setData]=useState<SpaceData|null>(null);
 const [userId,setUserId]=useState("");
 const [busy,setBusy]=useState(true);
 const [revision,setRevision]=useState(0);
 const [error,setError]=useState("");
 const [photoWarning,setPhotoWarning]=useState(false);
 useEffect(()=>{
  const requested=new URLSearchParams(window.location.search).get("player")||"";
  if(validPlayerId.test(requested))setTarget(requested);
  else{setError("Choose a player from Staff Portal → Players.");setBusy(false);}
 },[]);
 useEffect(()=>{
  if(!db)return;
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
   if(!session){setData(null);setUserId("");setError("Please sign in as the STAR owner to open this preview.");}
  });
  return()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
  if(!target)return;
  let active=true;
  setBusy(true);setError("");setData(null);setPhotoWarning(false);
  void(async()=>{
   try{
    if(!db)throw Error("Staff connection unavailable.");
    const {data:auth,error:authError}=await db.auth.getUser();
    if(authError||!auth.user)throw Error("Sign in to your staff account.");
    const result=await db.rpc("owner_player_space_preview",{p_player_id:target});
    if(result.error||!result.data)throw Error("This Player Space cannot be opened. Owner access or player record could not be verified.");
    const snapshot=result.data as SpaceData;
    if(!Array.isArray(snapshot.players)||snapshot.players.length!==1||snapshot.players[0]?.id!==target)throw Error("Player data could not be verified.");
    const profiles=await Promise.all((snapshot.profiles||[]).map(async profile=>{
     if(!profile.photo_path)return profile;
     const image=await db!.storage.from("player-card-photos").createSignedUrl(profile.photo_path,3600);
     if(image.error||!image.data?.signedUrl){if(active)setPhotoWarning(true);return profile;}
     return {...profile,photo_url:image.data.signedUrl};
    }));
    if(active){setUserId(auth.user.id);setData({...emptySpaceData,...snapshot,profiles});}
   }catch(err){if(active)setError(err instanceof Error?err.message:"Could not load the owner preview.");}
   finally{if(active)setBusy(false);}
  })();
  return()=>{active=false;};
 },[target,revision]);
 const name=data?.players[0]?[data.players[0].first_name,data.players[0].last_name].join(" "):"Player";
 return <main className="owner-preview-page" style={{background:"#061327",minHeight:"100vh"}}>
  <div style={{background:"#10243c",borderBottom:"2px solid #c49a4a",padding:"16px clamp(14px,3vw,38px)",color:"#fff",position:"relative",zIndex:5}}>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
    <div><strong style={{color:"#e7bf71",fontSize:12,letterSpacing:2}}>STAR OWNER PREVIEW · READ ONLY</strong><h1 style={{fontSize:"clamp(19px,3vw,27px)",margin:"6px 0"}}>{name} — Player Space</h1><p style={{margin:0,opacity:.85,fontSize:14}}>This is the player's saved appearance and content. Nothing in preview is saved to their account.</p></div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
     <Link href="/staff#players" style={{background:"#fff",color:"#10243c",padding:"11px 15px",borderRadius:9,fontWeight:800,textDecoration:"none"}}>← Back to staff</Link>
     <button type="button" disabled={!target||busy} onClick={()=>setRevision(n=>n+1)} style={{background:"#c49a4a",color:"#061327",padding:"11px 15px",border:0,borderRadius:9,fontWeight:800,cursor:"pointer"}}>{busy?"Loading…":"Refresh preview"}</button>
    </div>
   </div>
  </div>
  {busy&&<p role="status" style={{color:"#fff",padding:24}}>Loading saved Player Space…</p>}
  {error&&<p role="alert" style={{color:"#fff",padding:24}}>{error}</p>}
  {photoWarning&&<p role="status" style={{color:"#fff",padding:"12px 24px"}}>The private card photo could not be displayed; other saved choices are still visible.</p>}
  {data&&userId&&!busy&&<PlayerSpace key={target} data={data} userKey={userId} actorRole="player" readOnlyPreview
   onRefresh={()=>setRevision(n=>n+1)}
   onSavePractice={noWrite} onUpdateProfile={noWrite} onSaveGoal={noWrite} onCelebrate={noWrite}
   {...previewActions}/>}
 </main>;
}
