"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import Script from "next/script";

type Availability={open:boolean;remaining?:number;earlyBirdRemaining?:number;message?:string};
type Receipt={ok:true;reference:string;status:"pending";pricePence:number;message:string};
type TurnstileClient={
 render:(el:HTMLElement,opts:{sitekey:string;callback:(value:string)=>void;"expired-callback":()=>void;"error-callback":()=>void})=>string;
 reset:(widgetId:string)=>void;
};
declare global{interface Window{turnstile?:TurnstileClient}}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL?
 `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/star-festival-booking`:"";
const siteKey=process.env.NEXT_PUBLIC_STAR_FESTIVAL_TURNSTILE_SITE_KEY||"";

async function privateJPEG(file:File):Promise<File>{
 if(file.size>8_000_000)throw Error("Please select an image smaller than 8 MB.");
 if(!file.type.startsWith("image/"))throw Error("Please select a JPG, PNG or other supported photo.");
 const image=await createImageBitmap(file);
 try{
  const scale=Math.min(1,850/Math.max(image.width,image.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(image.width*scale);
  canvas.height=Math.round(image.height*scale);
  const context=canvas.getContext("2d");
  if(!context)throw Error("Your device could not process this image.");
  context.drawImage(image,0,0,canvas.width,canvas.height);
  const jpeg=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",.78));
  if(!jpeg||jpeg.size>1_024_000)throw Error("Please try a smaller photo.");
  // Canvas removes original file metadata, including embedded GPS information.
  return new File([jpeg],"player-photo.jpg",{type:"image/jpeg"});
 }finally{image.close()}
}

export function FestivalGuestBookingForm(){
 const [availability,setAvailability]=useState<Availability>({open:false});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [receipt,setReceipt]=useState<Receipt|null>(null);
 const [medicalStatus,setMedicalStatus]=useState("none_known");
 const [photoName,setPhotoName]=useState("");
 const [turnstileToken,setTurnstileToken]=useState("");
 const captchaEl=useRef<HTMLDivElement|null>(null),widgetId=useRef<string|null>(null);
 const startedAt=useRef(Date.now());
 const loadAvailability=useCallback(async()=>{
  if(!url||!siteKey){setAvailability({open:false,message:"Online registration is being prepared."});setLoading(false);return;}
  try{
   const response=await fetch(url,{method:"GET",cache:"no-store"});
   const result=await response.json();
   setAvailability(response.ok?result:{open:false,message:"Online registration is not available yet."});
  }catch{setAvailability({open:false,message:"Online registration is not available yet."})}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{void loadAvailability()},[loadAvailability]);
 const mountCaptcha=useCallback(()=>{
  if(!siteKey||!captchaEl.current||!window.turnstile||widgetId.current)return;
  widgetId.current=window.turnstile.render(captchaEl.current,{
   sitekey:siteKey,callback:setTurnstileToken,
   "expired-callback":()=>setTurnstileToken(""),
   "error-callback":()=>setTurnstileToken("")
  });
 },[]);
 const resetCaptcha=()=>{setTurnstileToken("");if(widgetId.current&&window.turnstile)window.turnstile.reset(widgetId.current)};
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||!availability.open||!url)return;
  if(!turnstileToken){setError("Complete the anti-spam check before sending.");return;}
  const form=event.currentTarget,fields=new FormData(form);
  fields.set("startedAt",String(startedAt.current));
  fields.set("turnstileToken",turnstileToken);
  fields.set("medicalStatus",medicalStatus);
  fields.set("mediaConsent",fields.has("mediaConsent")?"yes":"no");
  for(const name of ["guardianConsent","healthConsent","privacyConsent"])
   fields.set(name,fields.has(name)?"yes":"no");
  if(medicalStatus==="none_known"){
   for(const name of ["medicalConditions","allergies","medication","emergencyPlan"])fields.set(name,"");
  }
  setBusy(true);setError("");
  try{
   const file=fields.get("playerPhoto");
   if(file instanceof File&&file.size>0)fields.set("playerPhoto",await privateJPEG(file));
   else fields.delete("playerPhoto");
   const response=await fetch(url,{method:"POST",body:fields,cache:"no-store"});
   const result=await response.json();
   if(!response.ok)throw Error(typeof result.error==="string"?result.error:"Your registration could not be sent.");
   setReceipt(result as Receipt);
   form.reset();
   await loadAvailability();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to submit your request. Please try again.");resetCaptcha()}
  finally{setBusy(false)}
 }
 if(receipt)return <div className="star-festival-receipt" role="status">
  <span className="star-events-eyebrow">REQUEST RECEIVED</span>
  <h2>Thank you for registering your interest.</h2>
  <p>Your request has been securely received. <strong>This is not yet a confirmed place.</strong> STAR will contact the parent or guardian about confirmation and payment arrangements.</p>
  <dl><div><dt>Reference</dt><dd>{receipt.reference}</dd></div><div><dt>Ticket price allocated</dt><dd>£{(receipt.pricePence/100).toFixed(2)}</dd></div><div><dt>Status</dt><dd>Awaiting STAR confirmation</dd></div></dl>
  <p>No STAR account has been created. Keep a note of your reference and contact STAR if any medical or emergency details change.</p>
  <Link href="/events/christmas-football-festival-2026">Back to the festival details</Link>
 </div>;
 return <div className="star-festival-booking">
  {siteKey&&<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountCaptcha}/>}
  <div className="star-festival-booking-intro">
   <h2>Guest booking request</h2>
   <p>You do <strong>not</strong> need a STAR membership or login. This one-off form is for the Christmas Football Festival only.</p>
   <p>Monday 21 December 2026 · 10am–1pm · girls aged 5–16 · up to 36 places · £10 early bird / £15 standard.</p>
   <p>Places and prices are allocated on submission once booking opens. No payment is taken on this form; STAR will confirm arrangements separately.</p>
  </div>
  <div className="star-festival-availability" role="status">
   {loading?"Checking availability…":availability.open?
      availability.remaining===0?"All 36 places are currently requested. Please contact STAR about cancellations.":
      `${availability.remaining} of 36 places remaining. ${availability.earlyBirdRemaining||0} early-bird places currently available.`:
      "Booking requests are not open yet. You can preview the questions, but please do not enter personal or medical details until booking opens."}
  </div>
  <form onSubmit={submit} className="star-festival-booking-form">
   <fieldset disabled={busy||!availability.open||availability.remaining===0}>
    <legend>1. Parent or guardian details</legend>
    <p>These contact details are used only to manage this event and reach you if needed.</p>
    <div className="star-festival-field-grid">
     <label>First name <input name="guardianFirst" autoComplete="given-name" required maxLength={80} minLength={2}/></label>
     <label>Surname <input name="guardianLast" autoComplete="family-name" required maxLength={80} minLength={2}/></label>
     <label>Email address <input name="guardianEmail" type="email" autoComplete="email" required maxLength={254}/></label>
     <label>Mobile number <input name="guardianPhone" type="tel" autoComplete="tel" required maxLength={40}/></label>
     <label>Your relationship to the player <select name="guardianRelationship" required defaultValue=""><option value="" disabled>Select relationship</option><option>Mother</option><option>Father</option><option>Legal guardian</option><option>Other person with parental responsibility</option></select></label>
    </div>
   </fieldset>
   <fieldset disabled={busy||!availability.open||availability.remaining===0}>
    <legend>2. Player information</legend>
    <div className="star-festival-field-grid">
     <label>Player first name <input name="playerFirst" required minLength={2} maxLength={80}/></label>
     <label>Player surname <input name="playerLast" required minLength={2} maxLength={80}/></label>
     <label>Date of birth <input type="date" name="playerDob" min="2009-12-22" max="2021-12-21" required/><small>Players must be aged 5–16 on 21 December 2026.</small></label>
     <label>Current football club (optional) <input name="playerClub" maxLength={120}/></label>
     <label className="star-festival-wide">Player photo (optional)<input name="playerPhoto" type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={e=>setPhotoName(e.currentTarget.files?.[0]?.name||"")}/>
      <small>{photoName?`Selected: ${photoName}. `:""}For private identification by the organisers only; never displayed publicly. JPG/PNG recommended. The image is resized and GPS metadata removed before upload.</small>
     </label>
    </div>
   </fieldset>
   <fieldset disabled={busy||!availability.open||availability.remaining===0}>
    <legend>3. Emergency contact</legend>
    <p>Please provide another trusted adult who can be contacted if the registering parent is unavailable.</p>
    <div className="star-festival-field-grid">
     <label>Contact name <input name="emergencyName" required minLength={2} maxLength={160}/></label>
     <label>Relationship to player <input name="emergencyRelationship" required minLength={2} maxLength={80}/></label>
     <label>Contact number <input type="tel" name="emergencyPhone" required maxLength={40}/></label>
    </div>
   </fieldset>
   <fieldset disabled={busy||!availability.open||availability.remaining===0}>
    <legend>4. Medical information and support</legend>
    <p>Please give details relevant to safely taking part in the festival. Medical information is restricted to authorised STAR managers and is never included in public event listings or ordinary confirmation emails.</p>
    <label>Are there any relevant medical conditions, allergies, medications or emergency actions?
      <select value={medicalStatus} onChange={e=>setMedicalStatus(e.target.value)} required>
       <option value="none_known">None known</option>
       <option value="details">Yes — provide details below</option>
      </select>
    </label>
    {medicalStatus==="details"&&<div className="star-festival-field-grid">
     <label className="star-festival-wide">Medical conditions or injuries <textarea name="medicalConditions" rows={3} maxLength={1200} placeholder="Relevant conditions, symptoms or activity considerations"/></label>
     <label>Allergies <textarea name="allergies" rows={3} maxLength={800} placeholder="Include any severe allergic reactions"/></label>
     <label>Medication and access arrangements <textarea name="medication" rows={3} maxLength={800} placeholder="For example, inhalers or adrenaline auto-injectors"/></label>
     <label className="star-festival-wide">Emergency action plan <textarea name="emergencyPlan" rows={3} maxLength={1200} placeholder="What should the coaches and first-aider do if needed?"/></label>
    </div>}
    <label>Accessibility, communication or additional support needs (optional)<textarea name="supportNotes" rows={3} maxLength={800} placeholder="How can we make the event comfortable and accessible for the player?"/></label>
    <p className="star-festival-small">For sensitive information you would rather discuss privately, contact STAR before booking. Do not use this form to report an urgent medical emergency.</p>
   </fieldset>
   <fieldset disabled={busy||!availability.open||availability.remaining===0}>
    <legend>5. Parent declarations and permission</legend>
    <div className="star-festival-checks">
     <label><input type="checkbox" name="guardianConsent" required/> I confirm I have parental responsibility or appropriate authority to register this player for this event.</label>
     <label><input type="checkbox" name="healthConsent" required/> I explicitly consent to STAR processing the relevant health and support information supplied above for safe participation, and understand I can contact STAR to withdraw this consent.</label>
     <label><input type="checkbox" name="privacyConsent" required/> I have read the <Link href="/privacy" target="_blank">STAR privacy information</Link> and understand the details will be used to manage this event, not create a STAR account.</label>
     <label><input type="checkbox" name="mediaConsent"/> Separately, I give permission for STAR to take and use event photos or video of my child for STAR publicity. Leaving this unchecked does not affect the booking.</label>
    </div>
    <div className="star-festival-captcha" ref={captchaEl}/>
    <div className="star-festival-trap" aria-hidden="true"><label>Website <input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    {error&&<p className="star-festival-error" role="alert">{error}</p>}
    <button type="submit" disabled={busy||!turnstileToken||!availability.open||availability.remaining===0}>{busy?"Sending securely…":"Send guest booking request"}</button>
    <p className="star-festival-small">This is a request, not a confirmed booking. STAR will verify the details, availability and payment arrangements.</p>
   </fieldset>
  </form>
  <p className="star-festival-booking-help">Questions? Email <a href="mailto:coachdmp7@gmail.com">coachdmp7@gmail.com</a> before submitting sensitive information.</p>
 </div>;
}
