"use client";
import {useState,type FormEvent} from "react";
export function ScholarshipApplicationForm(){
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[sent,setSent]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setBusy(true);setError("");
  const form=e.currentTarget,details=Object.fromEntries(new FormData(form).entries());
  try{
   const response=await fetch("/api/scholarship-application",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...details,consent:details.consent==="on"})});
   const result=await response.json();
   if(!response.ok||!result.ok)throw Error(result.error||"Could not submit the request.");
   setSent(true);
  }catch(e){setError(e instanceof Error?e.message:"Something went wrong. Please try again.");}finally{setBusy(false);}
 }
 if(sent)return <div className="scholarship-form scholarship-sent" role="status"><span aria-hidden="true">✓</span><h3>Your request has been sent.</h3><p>Thank you for contacting STAR. We will review your request privately and get back to you about possible options. No scholarship or session has been awarded at this stage.</p><a href="/programmes">Explore coaching options →</a></div>;
 return <form className="scholarship-form" onSubmit={submit}><p className="scholarship-kicker">SCHOLARSHIP ENQUIRY</p><h3>Tell us about her next step.</h3><p className="scholarship-form-hint">For a parent or legal guardian. Fields marked * are required.</p>
 <div className="scholarship-fields"><label>Parent/guardian name *<input name="name" minLength={2} maxLength={100} autoComplete="name" required/></label><label>Email address *<input name="email" type="email" maxLength={200} autoComplete="email" required/></label><label>Contact number (optional)<input name="phone" type="tel" maxLength={40} autoComplete="tel"/></label><div className="scholarship-two"><label>Player's age *<select name="age" required defaultValue=""><option value="" disabled>Select age</option>{Array.from({length:14},(_,i)=>i+5).map(age=><option key={age} value={age}>{age}</option>)}</select></label><label>Town or area *<input name="area" placeholder="e.g. Taunton" maxLength={70} required/></label></div><label>Coaching support requested *<select name="programme" required defaultValue=""><option value="" disabled>Select an option</option><option value="group">Group coaching</option><option value="individual">Individual coaching</option><option value="flyers">STAR Flyers</option><option value="prestige">STAR Prestige</option><option value="unsure">Not sure yet</option></select></label><label>What would make coaching possible for your family? *<textarea name="message" rows={5} minLength={20} maxLength={1200} required placeholder="Briefly explain the financial barrier and what type of support might help. You do not need to share detailed financial records."/></label>
 <label className="scholarship-consent"><input name="consent" type="checkbox" required/><span>I am a parent or legal guardian aged 18 or over. I agree that STAR may use these details to review and respond to this coaching support request, as explained in its <a href="/privacy">privacy information</a>. *</span></label><div className="scholarship-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div></div>{error&&<p role="alert" className="scholarship-form-error">{error}</p>}<button className="scholarship-cta" type="submit" disabled={busy}>{busy?"Sending your request…":"Submit confidential request"} <span aria-hidden="true">→</span></button><p className="scholarship-form-hint">Submitting does not reserve a session. For an urgent private discussion, contact STAR directly.</p></form>;
}
