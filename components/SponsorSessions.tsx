"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {supabaseBrowser} from "../lib/supabaseBrowser";
const options=[
 {id:"one-group",title:"One group session",description:"45 minutes of coaching for one girl",amount:5},
 {id:"four-group",title:"Four group sessions",description:"Four chances to train, learn and belong",amount:20},
 {id:"one-individual",title:"One individual session",description:"One hour of dedicated one-to-one coaching",amount:40},
 {id:"two-individual",title:"Two individual sessions",description:"Two hours of individual coaching",amount:80}
] as const;
export function SponsorSessions(){
 const [userEmail,setUserEmail]=useState<string|null>(null),[checking,setChecking]=useState(true),[choice,setChoice]=useState<string>("one-individual"),[busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState("");
 useEffect(()=>{let live=true;if(!supabaseBrowser){setChecking(false);return;}void supabaseBrowser.auth.getUser().then(({data,error})=>{if(live){setUserEmail(error?null:data.user?.email||null);setChecking(false);}}).catch(()=>{if(live)setChecking(false)});return()=>{live=false};},[]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!supabaseBrowser||busy)return;setBusy(true);setError("");
  try{
   const {data,error:sessionError}=await supabaseBrowser.auth.getSession();
   const token=data.session?.access_token;
   if(sessionError||!token)throw Error("Your sign-in has expired. Please sign in to the parent portal again.");
   const response=await fetch("/api/sponsor-sessions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({choice})});
   const body=await response.json();
   if(!response.ok||!body.ok)throw Error(body.error||"We couldn't send your pledge.");
   setSuccess(true);
  }catch(e){setError(e instanceof Error?e.message:"We couldn't send your pledge. Please try again.");}finally{setBusy(false)}
 }
 if(checking)return <p role="status">Checking your parent account…</p>;
 if(!userEmail)return <div className="support-give-form"><h2>Sign in to sponsor coaching.</h2><p>Session sponsorship is available through a verified STAR parent account, so we can acknowledge and arrange your pledge privately.</p><Link className="scholarship-cta" href="/parent-portal">Open the Parent Portal →</Link></div>;
 if(success)return <div className="support-give-form" role="status"><div className="support-give-success"><h2>Thank you for offering to help.</h2><p>Your sponsorship pledge has been sent to STAR. We will contact you at <strong>{userEmail}</strong> about payment arrangements.</p><p><strong>No payment has been collected and no coaching place has been allocated yet.</strong> STAR will confirm both before issuing any funded sessions.</p></div><Link href="/parent-portal" className="scholarship-cta">Back to Parent Portal →</Link></div>;
 return <form className="support-give-form" onSubmit={submit}><p className="scholarship-kicker">CHOOSE HOW TO GIVE</p><h2>Sponsor her next session.</h2><p className="support-give-small">Signed in as {userEmail}. Select the coaching you would like to sponsor.</p><fieldset style={{border:0,padding:0,margin:0}}><legend className="support-give-small">Choose a sponsorship amount</legend><div className="support-give-options">{options.map(o=><label key={o.id} className="support-give-option"><input type="radio" name="session-choice" value={o.id} checked={choice===o.id} onChange={()=>setChoice(o.id)}/><span><strong>{o.title}</strong><small>{o.description}</small></span><b>£{o.amount}</b></label>)}</div></fieldset><p className="support-give-small">Your pledge will be used towards coaching for a family receiving STAR support. STAR chooses recipients confidentially, and the exact coaching slot depends on availability. If the chosen session cannot be funded, STAR will agree an alternative or refund before reallocating your payment.</p><p className="support-give-small"><strong>This is session sponsorship through STAR Development Centre, not a charity donation. Gift Aid is not available.</strong></p>{error&&<p role="alert" className="support-give-error">{error}</p>}<button className="scholarship-cta" type="submit" disabled={busy}>{busy?"Sending your pledge…":"Pledge these sessions →"}</button><p className="support-give-small">No card or bank details are taken here. STAR will contact you separately about payment. This form does not collect money.</p></form>;
}
