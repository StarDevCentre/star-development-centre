"use client";
import {useState,type FormEvent} from "react";
import type {SupabaseClient,User} from "@supabase/supabase-js";
import "./parent-account-deletion.css";

type Preview={ok:boolean;child_count?:number;linked_player_count?:number;deleted?:boolean;error?:string};
async function failureMessage(error:unknown):Promise<string>{
 const context=(error as {context?:{json?:()=>Promise<{error?:string}>}}|null)?.context;
 try{const response=await context?.json?.();if(response&&typeof response.error==="string")return response.error;}catch{}
 return "We couldn't complete this request. Please try again or contact STAR.";
}

export function ParentAccountDeletion({supabase,user}:{supabase:SupabaseClient;user:User}){
 const [open,setOpen]=useState(false),[plan,setPlan]=useState<Preview|null>(null);
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirmation,setConfirmation]=useState("");
 async function preview(){
  setOpen(true);setLoading(true);setError("");setPlan(null);
  try{
   const {data,error}=await supabase.functions.invoke<Preview>("delete-family-account",{body:{action:"preview"}});
   if(error)throw new Error(await failureMessage(error));
   if(!data?.ok)throw new Error(data?.error||"Deletion checks are unavailable.");
   setPlan(data);
  }catch(e){setError(e instanceof Error?e.message:"Could not check linked accounts.")}
  finally{setLoading(false);}
 }
 function cancel(){if(busy)return;setOpen(false);setPassword("");setEmail("");setConfirmation("");setError("");setPlan(null);}
 async function remove(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||!plan?.ok)return;
  if(email.trim().toLowerCase()!==user.email?.toLowerCase()||confirmation!=="DELETE"||!password){
   setError("Enter your current email, password and the word DELETE.");return;
  }
  setBusy(true);setError("");
  try{
   const {data,error}=await supabase.functions.invoke<Preview>("delete-family-account",{
    body:{action:"delete",confirm_email:email,password,confirmation}
   });
   if(error)throw new Error(await failureMessage(error));
   if(!data?.ok||!data.deleted)throw new Error(data?.error||"Account deletion was not confirmed.");
   setPassword("");
   // The Auth identity no longer exists; clear the browser's local session too.
   try{await supabase.auth.signOut({scope:"local"});}catch{}
   window.location.replace("/parent-portal?deleted=1");
  }catch(e){setError(e instanceof Error?e.message:"The request could not be completed. Your account may still be active.");}
  finally{setPassword("");setBusy(false);}
 }
 return <section className="parent-delete-account" aria-labelledby="parent-delete-heading">
  <h3 id="parent-delete-heading">Delete your account</h3>
  <p>You can permanently close your STAR parent account from here.</p>
  {!open?<button type="button" className="parent-delete-open" onClick={()=>void preview()}>Delete account…</button>:
   <div className="parent-delete-confirm">
    <p><strong>This is permanent and cannot be undone.</strong> Your parent sign-in and any exclusively linked child logins will be deleted. Family account links and personal registration information will be removed.</p>
    <p>STAR may need to keep certain coaching, booking or safeguarding records where required. Child coaching records are not necessarily the same as child login accounts. Accounts shared with another guardian require assistance so no other family loses access.</p>
    {loading?<p role="status">Checking linked child accounts…</p>:plan?.ok?<p className="parent-delete-count" role="status">Connected child logins to delete: <strong>{plan.child_count??0}</strong>. Linked player profiles: <strong>{plan.linked_player_count??0}</strong>.</p>:null}
    {error&&<p className="parent-delete-error" role="alert">{error}</p>}
    {plan?.ok&&<form onSubmit={remove}>
     <label>Confirm your sign-in email<input type="email" autoComplete="email" required maxLength={254} disabled={busy} value={email} onChange={e=>setEmail(e.target.value)} /></label>
     <label>Current password<input type="password" autoComplete="current-password" required disabled={busy} value={password} onChange={e=>setPassword(e.target.value)} /></label>
     <label>Type DELETE to confirm<input type="text" autoComplete="off" required disabled={busy} value={confirmation} onChange={e=>setConfirmation(e.target.value)} /></label>
     <div className="parent-delete-actions">
      <button type="submit" className="parent-delete-submit" disabled={busy||confirmation!=="DELETE"||!password||email.trim().toLowerCase()!==user.email?.toLowerCase()}>{busy?"Deleting your account…":"Permanently delete my account"}</button>
      <button type="button" disabled={busy} onClick={cancel}>Cancel</button>
     </div>
    </form>}
    {!loading&&!plan?.ok&&<div className="parent-delete-actions"><button type="button" onClick={()=>void preview()}>Try again</button><button type="button" onClick={cancel}>Cancel</button></div>}
   </div>}
 </section>;
}