"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {supabaseBrowser} from "../../lib/supabaseBrowser";
const StarHQExperience=dynamic(()=>import("./StarHQExperience").then(m=>m.StarHQExperience),{ssr:false,loading:()=> <div className="hq-gate-card"><p>Preparing STAR HQ graphics…</p></div>});
type Status="checking"|"allowed"|"denied"|"error";
export function StarHQOwnerGate(){
 const [status,setStatus]=useState<Status>("checking");
 const check=useCallback(async()=>{
  setStatus("checking");
  const db=supabaseBrowser;
  if(!db){setStatus("error");return;}
  try{
   const {data:{session}}=await db.auth.getSession();
   if(!session?.access_token){setStatus("denied");return;}
   const r=await fetch("/api/star-hq/preview-access",{method:"POST",
    headers:{Authorization:"Bearer "+session.access_token},
    cache:"no-store",credentials:"same-origin"});
   if(r.status===401||r.status===403){setStatus("denied");return;}
   if(!r.ok){setStatus("error");return;}
   const result=await r.json() as {allowed?:boolean};
   setStatus(result.allowed===true?"allowed":"denied");
  }catch{setStatus("error");}
 },[]);
 useEffect(()=>{
  void check();
  const db=supabaseBrowser;
  const sub=db?.auth.onAuthStateChange((event)=>{
   if(event==="SIGNED_OUT"){setStatus("denied");return;}
   if(event==="SIGNED_IN"||event==="USER_UPDATED")void check();
  });
  return ()=>sub?.data.subscription.unsubscribe();
 },[check]);
 // Recheck active owner membership on focus after returning to the tab.
 useEffect(()=>{
  const focus=()=>{if(document.visibilityState==="visible")void check();};
  document.addEventListener("visibilitychange",focus);
  return ()=>document.removeEventListener("visibilitychange",focus);
 },[check]);
 return <div className="hq-outer">
  {status==="allowed"?<StarHQExperience/>:
   <main className="hq-gate-card">
    <span className="hq-eyebrow">STAR DEVELOPMENT CENTRE · OWNER PROTOTYPE</span>
    <h1>STAR HQ</h1>
    {status==="checking"?<p role="status">Checking your STAR owner access…</p>:
     status==="denied"?<p role="alert">Only the active STAR owner can access this private 3D prototype. Sign in through the staff portal first.</p>:
     <p role="alert">We could not verify your access. The preview stays locked until that check succeeds.</p>}
    <div className="hq-gate-actions"><Link href="/staff">Go to Staff Portal</Link>
     {status!=="checking"&&<button type="button" onClick={()=>void check()}>Retry check</button>}</div>
   </main>}
 </div>;
}
