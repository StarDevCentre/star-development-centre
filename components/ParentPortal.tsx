"use client";
import {useEffect,useRef,useState} from "react";
import type {User} from "@supabase/supabase-js";
import {supabaseBrowser} from "../lib/supabaseBrowser";
import Link from "next/link";
import {PlayerAccountSetup} from "./PlayerAccountSetup";
import {FamilyUnreadBadge} from "./FamilyUnreadBadge";
import {PlayerTrainingHub} from "./PlayerTrainingHub";
import {SessionChangeRequests} from "./SessionChangeRequests";
import {FamilyCommunications} from "./FamilyCommunications";
import {ParentProgrammePrices} from "./ParentProgrammePrices";
import {programmes} from "../lib/siteData";
import {PlayerRegistrationDraft} from "./PlayerRegistrationDraft";
import {useParentUpdates} from "./useParentUpdates";
import {ParentUpdates} from "./ParentUpdates";
import {ParentPhoneAlerts} from "./ParentPhoneAlerts";
import {removeParentDevicePush} from "../lib/parentPush";
import {ParentExperience} from "./ParentExperience";
import {ParentAccountDetails} from "./ParentAccountDetails";
import {registrationFields,type ParentRegistration} from "../lib/parentProgrammes";
import type {LinkedPlayer,PlayerGoal,FamilyReport,FamilySession,PlayerAssessment} from "../lib/parentDashboard";
const playerDraftsEnabled=true;
type Profile={user_id:string;display_name:string;contact_phone:string|null};
type FamilyData={owner:string;loaded:boolean;loading:boolean;failed:boolean;players:LinkedPlayer[];goals:PlayerGoal[];assessments:PlayerAssessment[];reports:FamilyReport[];sessions:FamilySession[]};
const emptyFamily:FamilyData={owner:"",loaded:false,loading:false,failed:false,players:[],goals:[],assessments:[],reports:[],sessions:[]};
type Registration=ParentRegistration;
type AuthMode="login"|"signup"|"confirm"|"reset"|"update";
export function ParentPortal({initialMode="login",initialProgramme:requestedProgramme=""}:{initialMode?:"login"|"signup"|"reset";initialProgramme?:string}){
 const supabase=supabaseBrowser;
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false);
 const accountIdentity=useRef("");accountIdentity.current=user?.id||"";
 const [mode,setMode]=useState<AuthMode>(initialMode);
 const [initialProgramme,setInitialProgramme]=useState(requestedProgramme);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const requested=params.get("programme");let saved=requested||"";try{saved=saved||window.sessionStorage.getItem("star-programme-interest")||""}catch{}if(programmes.some(p=>p.slug===saved)){setInitialProgramme(saved);try{window.sessionStorage.setItem("star-programme-interest",saved)}catch{}}},[]);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[phone,setPhone]=useState("");
 const [profile,setProfile]=useState<Profile|null>(null),[registrations,setRegistrations]=useState<Registration[]>([]);
 const [family,setFamily]=useState<FamilyData>(emptyFamily),[familyAttempt,setFamilyAttempt]=useState(0);
 const [accountLoaded,setAccountLoaded]=useState(false),[accountFailed,setAccountFailed]=useState(false),[loadAttempt,setLoadAttempt]=useState(0),[accountUserId,setAccountUserId]=useState("");
 const ownFamily=family.owner===user?.id?family:emptyFamily;
 const linkedPlayers=ownFamily.players,linkedGoals=ownFamily.goals,linkedAssessments=ownFamily.assessments,familyReports=ownFamily.reports,familySessions=ownFamily.sessions;
 const updates=useParentUpdates(user?.id||"",!!user&&!!profile&&accountUserId===user.id&&accountLoaded&&!accountFailed&&mode!=="update");
 const linksReady=ownFamily.loaded;
 const [showPassword,setShowPassword]=useState(false),[resendSeconds,setResendSeconds]=useState(0),[adultConfirmed,setAdultConfirmed]=useState(false);
 const [showRegistration,setShowRegistration]=useState(false),[recentRegistration,setRecentRegistration]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 useEffect(()=>{if(resendSeconds<=0)return;const timer=window.setTimeout(()=>setResendSeconds(n=>n-1),1000);return()=>window.clearTimeout(timer)},[resendSeconds]);
 useEffect(()=>{if(!supabase){setReady(true);return;}let active=true;
  supabase.auth.getUser().then(({data})=>{if(active){setUser(data.user);setReady(true)}}).catch(()=>{if(active){setError("We couldn’t check your account. Please refresh and try again.");setReady(true)}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(active){setUser(session?.user||null);if(event==="PASSWORD_RECOVERY")setMode("update");setReady(true)}});
  return()=>{active=false;subscription.unsubscribe()};
 },[supabase]);
 useEffect(()=>{
  setProfile(null);setRegistrations([]);setAccountLoaded(false);setAccountFailed(false);setShowRegistration(false);setRecentRegistration(null);
  if(!supabase||!user){setAccountUserId("");return;}
  let active=true;
  async function load(){try{
   const [p,r]=await Promise.all([supabase!.from("guardian_profiles").select("user_id,display_name,contact_phone").eq("user_id",user!.id).maybeSingle(),supabase!.from("player_registrations").select(registrationFields).eq("guardian_id",user!.id).order("created_at",{ascending:false})]);
   if(p.error||r.error)throw Error();
   if(active){setProfile(p.data);setRegistrations(r.data||[]);setShowRegistration(!(r.data||[]).length);if(!p.data){const savedName=user!.user_metadata?.guardian_name;if(typeof savedName==="string")setName(savedName.slice(0,100))}}
  }catch{if(active){setAccountFailed(true);setError("We couldn’t load your account. Please try again.")}}finally{if(active){setAccountUserId(user!.id);setAccountLoaded(true)}}}
  void load();return()=>{active=false};
 },[supabase,user?.id,loadAttempt]);
 useEffect(()=>{
  if(!supabase||!user){setFamily(emptyFamily);return;}
  const guardianId=user.id;let active=true;
  setFamily(current=>current.owner===guardianId?{...current,loading:true,failed:false}:{...emptyFamily,owner:guardianId,loading:true});
  async function loadLinked(){try{
   const links=await supabase!.from("guardian_player_links").select("player_id").eq("guardian_id",guardianId);
   if(links.error)throw Error();
   const ids=(links.data||[]).map(x=>x.player_id);
   if(!ids.length){if(active)setFamily({...emptyFamily,owner:guardianId,loaded:true});return;}
   const [players,goals,assessments,reports,upcoming]=await Promise.all([
    supabase!.from("coaching_players").select("id,first_name,last_name,programme").in("id",ids),
    supabase!.from("coaching_development_goals").select("id,player_id,goal,status").in("player_id",ids),
    supabase!.from("coaching_idp_assessments").select("id,player_id,category,rating,assessed_on").in("player_id",ids).order("assessed_on",{ascending:false}),
    supabase!.from("family_monthly_reports").select("id,player_id,review_month,strengths,development_areas,next_steps").in("player_id",ids).order("review_month",{ascending:false}),
    supabase!.from("family_session_schedule").select("id,player_id,title,starts_at,ends_at,venue").in("player_id",ids).gte("ends_at",new Date().toISOString()).order("starts_at",{ascending:true})
   ]);
   if([players,goals,assessments,reports,upcoming].some(result=>result.error))throw Error();
   if(active)setFamily({owner:guardianId,loaded:true,loading:false,failed:false,players:players.data||[],goals:goals.data||[],assessments:assessments.data||[],reports:reports.data||[],sessions:upcoming.data||[]});
  }catch{if(active)setFamily({...emptyFamily,owner:guardianId,loaded:true,failed:true});}}
  void loadLinked();return()=>{active=false};
 },[supabase,user?.id,familyAttempt]);
 function confirmationUrl(){return window.location.origin+"/parent-portal"+(initialProgramme?"?programme="+encodeURIComponent(initialProgramme):"")}
 function changeMode(next:AuthMode){setMode(next);setError("");setNotice("");setPassword("");setShowPassword(false);document.getElementById("parent-form-start")?.scrollIntoView({block:"start"})}
 async function resendConfirmation(){
  if(!supabase||busy||resendSeconds>0)return;setBusy(true);setError("");setNotice("");
  try{const {error}=await supabase.auth.resend({type:"signup",email:email.trim(),options:{emailRedirectTo:confirmationUrl()}});if(error)throw error;setResendSeconds(60);setNotice("If confirmation is needed for this address, a new email is on its way. Check your inbox and junk folder.")}
  catch{setError("We couldn’t resend the email just now. Please wait a moment and try again.")}finally{setBusy(false)}
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();if(!supabase||busy)return;setBusy(true);setError("");setNotice("");
  try{
   if(mode==="update"){
    if(!user)throw Error("Open the password reset link from your email before choosing a new password.");
    if(password.length<12)throw Error("Use a password of at least 12 characters.");
    const {error}=await supabase.auth.updateUser({password});if(error)throw error;setMode("login");setNotice("Your password has been updated.");setPassword("");setShowPassword(false);
   }else if(mode==="reset"){
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:confirmationUrl()});if(error)throw error;setNotice("If an account exists for this email, password reset instructions have been sent. Check your inbox and junk folder.");
   }else if(mode==="signup"){
    if(password.length<12)throw Error("Use a password of at least 12 characters.");
    if(name.trim().length<2)throw Error("Please enter your name.");
    if(!adultConfirmed)throw Error("Please confirm that you are a parent or legal guardian aged 18 or over.");
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:confirmationUrl(),data:{guardian_name:name.trim()}}});
    if(error)throw error;setPassword("");setShowPassword(false);
    if(data.session){setUser(data.session.user);setMode("login")}else{setMode("confirm");setResendSeconds(60);document.getElementById("parent-form-start")?.scrollIntoView({block:"start"})}
   }else{
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;setPassword("");setShowPassword(false);
   }
  }catch(e){setError(e instanceof Error?e.message:"Something went wrong. Please try again.")}finally{setBusy(false)}
 }
 async function saveDraft(data:{player_first_name:string;player_last_name:string;date_of_birth:string;programme:string}){
  if(!playerDraftsEnabled||!supabase||!user||!profile)return false;
  setBusy(true);setError("");setNotice("");
  try{const {data:record,error:saveError}=await supabase.from("player_registrations").insert({...data,guardian_id:user.id,status:"submitted",submitted_at:new Date().toISOString()}).select(registrationFields).single();
   if(saveError||!record)throw Error("We couldn't submit this application. Please try again.");
   setRegistrations(current=>[{...record,recommended_programme:null},...current]);setRecentRegistration(record.id);setShowRegistration(false);setNotice("Your player registration has been submitted. Review prices and payment options below while STAR checks availability.");return true;
  }catch{setError("We couldn't submit this application. Please try again.");return false;}finally{setBusy(false);}
 }
 async function requestProgramme(sourceId:string,programme:string){
  if(!supabase||!user||!profile)throw Error("Sign in and complete your parent details first.");
  const guardianId=user.id;
  const {data,error}=await supabase.rpc("star_request_player_programme",{p_source_registration_id:sourceId,p_programme:programme});
  if(accountIdentity.current!==guardianId)throw Error("Your account changed. Please sign in again.");
  if(error)throw Error(error.message||"We couldn’t send this sign-up. Please try again.");
  const record=Array.isArray(data)?data[0]:data;
  if(!record?.id||record.guardian_id!==guardianId)throw Error("Please refresh your account to check the sign-up.");
  setRegistrations(current=>[record,...current.filter(r=>r.id!==record.id)]);
 }
 async function saveProfile(e:React.FormEvent){
  e.preventDefault();if(!supabase||!user||busy)return;setBusy(true);setError("");setNotice("");
  try{const display_name=name.trim();if(display_name.length<2||display_name.length>100)throw Error("Please enter your name (2–100 characters).");
   const {error}=await supabase.from("guardian_profiles").upsert({user_id:user.id,display_name,contact_phone:phone.trim()||null},{onConflict:"user_id"});if(error)throw error;
   setProfile({user_id:user.id,display_name,contact_phone:phone.trim()||null});setNotice("Parent details saved. Now add your player’s details.");
  }catch{setError("Could not save your parent details. Please check them and try again.")}finally{setBusy(false)}
 }
 async function signOut(){if(!supabase)return;try{if(user)await removeParentDevicePush(user.id);}catch{setError("We couldn’t disconnect phone alerts on this device. Try signing out again.");return;}const {error}=await supabase.auth.signOut();if(error){setError("We couldn’t sign you out. Please try again.");return;}setNotice("");setError("");setPassword("");setName("");setPhone("");setMode("login");}
 const hasRegistration=registrations.some(r=>r.status!=="draft");
 const selectedProgramme=programmes.find(p=>p.slug===initialProgramme);
 const steps=[{title:"Parent account",copy:"Your details and a secure password."},{title:"Confirm your email",copy:"Follow the link in your inbox."},{title:"Register your player",copy:"Add her details, then view prices."}];
 const currentStep=user?hasRegistration?4:3:mode==="confirm"?2:1;
 const programmeTitle=(slug:string)=>programmes.find(p=>p.slug===slug)?.title||slug;
 const statusText:Record<string,string>={draft:"Draft",submitted:"Awaiting STAR review",under_review:"Under review",waitlisted:"On the waiting list",accepted:"Accepted — STAR will confirm arrangements",declined:"Reviewed — contact STAR to discuss",enrolled:"Enrolled"};
 if(!ready)return <div className="parent-loading" id="parent-account" role="status">Checking your account…</div>;
 if(!supabase)return <p>Parent accounts are temporarily unavailable. Please <Link href="/contact">contact STAR</Link>.</p>;
 const usingDashboard=!!user&&mode!=="update"&&accountLoaded&&accountUserId===user.id&&!accountFailed&&linksReady&&!ownFamily.failed&&!!profile&&linkedPlayers.length>0;
 const accountContent=user?<>{profile&&<ParentAccountDetails key={user.id} supabase={supabase} user={user} profile={profile} onProfileSaved={p=>{if(accountIdentity.current===p.user_id)setProfile(p)}} onUserUpdated={u=>{if(accountIdentity.current===u.id)setUser(u)}}/>} {!profile?<section className="parent-profile-step"><h3>Your contact details</h3><p>Check your name and add a contact number if you’d like STAR to call you. Your player’s details come next.</p><form className="star-portal-form" onSubmit={saveProfile}><label>Your full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label><label>Phone number <small>Optional</small><input type="tel" maxLength={40} autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label><button disabled={busy} type="submit">{busy?"Saving…":"Save & continue to my player →"}</button></form></section>:<>
 {registrations.length>0&&<details className="parent-applications parent-registration-history" open={recentRegistration?true:undefined}><summary id="parent-applications-title">Player registrations ({registrations.length})</summary>{registrations.map(r=><article key={r.id} className={recentRegistration===r.id?"parent-application just-submitted":"parent-application"}><div className="parent-application-title"><h4>{r.player_first_name}</h4><span>{statusText[r.status]||r.status.replaceAll("_"," ")}</span></div><p>{programmeTitle(r.programme)}{r.recommended_programme&&<> · STAR recommends {programmeTitle(r.recommended_programme)}</>}</p>{recentRegistration===r.id&&<p className="parent-application-success" role="status">Registration received. STAR will review her details and discuss a suitable place with you.</p>}{r.status==="draft"?<button type="button" className="parent-primary" disabled={busy} onClick={async()=>{if(!supabase||!user||busy)return;setBusy(true);setError("");try{const {data,error}=await supabase.from("player_registrations").update({status:"submitted",submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",r.id).eq("guardian_id",user.id).eq("status","draft").select("id").single();if(error||!data)throw Error();setRegistrations(v=>v.map(a=>a.id===r.id?{...a,status:"submitted"}:a));setRecentRegistration(r.id);setNotice("Registration submitted. You can now view programme prices below.")}catch{setError("Could not submit this registration. Please try again.")}finally{setBusy(false)}}}>Submit this registration →</button>:<a href="#programme-prices" className="parent-inline-link">View prices & payment options ↓</a>}</article>)}</details>}
 {showRegistration?<><PlayerRegistrationDraft key={initialProgramme} onSave={saveDraft} busy={busy} initialProgramme={initialProgramme}/>{registrations.length>0&&<button className="parent-text-button" type="button" onClick={()=>setShowRegistration(false)}>Cancel adding another player</button>}</>:<button className="parent-secondary" type="button" onClick={()=>{setShowRegistration(true);setRecentRegistration(null)}}>{registrations.length?"+ Register another player":"+ Register a player"}</button>}
 </>}
 <ParentProgrammePrices key={user.id} supabase={supabase} userId={user.id} eligible={!!profile&&hasRegistration} registrations={registrations} players={linkedPlayers} onRequest={requestProgramme} onRegisterNew={programme=>{setInitialProgramme(programme);setShowRegistration(true);setRecentRegistration(null);window.requestAnimationFrame(()=>document.getElementById("player-registration")?.scrollIntoView({block:"start"}))}}/>
 {registrations.some(r=>["submitted","under_review","waitlisted","accepted"].includes(r.status))&&<section className="parent-next-steps"><h3>What happens next?</h3><ol><li><strong>STAR reviews her registration.</strong> We check the programme choice and availability.</li><li><strong>We agree her starting point.</strong> Discuss the venue, session arrangements and any support she needs directly with STAR.</li><li><strong>Confirm her place together.</strong> Enrolment consent and payment arrangements are completed separately.</li></ol><a href="https://wa.me/447902594064" className="parent-inline-link">Ask STAR on WhatsApp ↗</a></section>}
</>:null;
 const memberExperience=user?<ParentExperience key={user.id} ownerKey={user.id} guardianName={profile?.display_name||""} updatesContent={onOpen=><><ParentUpdates items={updates.items} players={linkedPlayers} loading={updates.loading} error={updates.error} onRefresh={()=>void updates.refresh()} onRead={updates.markRead} onOpen={(next,id)=>{setFamilyAttempt(n=>n+1);if(next==="account")setLoadAttempt(n=>n+1);onOpen(next,id)}}/><ParentPhoneAlerts key={user.id} userKey={user.id}/></>} updateCount={updates.unread} updateBadge={updates.unread>0?<span className="parent-update-badge">{updates.unread>99?"99+":updates.unread}</span>:null} onSignOut={()=>void signOut()} players={linkedPlayers} goals={linkedGoals} reports={familyReports} sessions={familySessions} assessments={linkedAssessments} refreshing={ownFamily.loading} onRefresh={()=>{setFamilyAttempt(n=>n+1);void updates.refresh()}} messageBadge={<FamilyUnreadBadge userId={user.id} role="guardian"/>} practiceContent={<PlayerTrainingHub userId={user.id} role="guardian"/>} messagesContent={active=><FamilyCommunications userId={user.id} role="guardian" active={active}/>} sessionRequestsContent={<SessionChangeRequests userId={user.id} role="guardian"/>} accountContent={<>{accountContent}<PlayerAccountSetup players={linkedPlayers} userId={user.id}/><p><Link className="parent-inline-link" href="/player-portal">Open family Player Space →</Link></p></>}/>:null;
 if(usingDashboard)return <div className="parent-member parent-new-member">{error&&<p className="star-portal-error" role="alert">{error}</p>}{notice&&<p className="star-portal-notice" role="status">{notice}</p>}{memberExperience}</div>;
 return <div className={usingDashboard?"star-portal parent-member":!user?"star-portal parent-auth-"+mode:"star-portal"} id="parent-account">
 <div className="star-portal-main" id="parent-form-start">
 {error&&<p className="star-portal-error" role="alert">{error}</p>}{notice&&<p className="star-portal-notice" role="status">{notice}</p>}
 {(!user||mode==="update")?<>
 {mode==="confirm"?<div className="parent-email-check"><span className="parent-mail-icon" aria-hidden="true">✉</span><p className="parent-eyebrow">STEP 2 / CHECK YOUR INBOX</p><h2>Confirm your email.</h2><p>We’ve requested a confirmation email for <strong>{email}</strong>. Follow the link to continue to your player’s registration.</p><ol><li>Open the confirmation email.</li><li>Select the confirmation link.</li><li>Return here to add your parent and player details.</li></ol><p className="parent-form-hint">Check your junk folder if it hasn’t arrived. If you already have an account, sign in below.</p><button className="parent-primary" type="button" disabled={busy||resendSeconds>0} onClick={resendConfirmation}>{resendSeconds>0?`Resend available in ${resendSeconds}s`:"Resend confirmation email"}</button><div className="star-portal-switch"><button type="button" onClick={()=>changeMode("login")}>Continue to sign in →</button><button type="button" onClick={()=>changeMode("signup")}>Use a different email</button></div></div>:<>
 <p className="parent-eyebrow">{mode==="signup"?"STEP 1 / YOUR PARENT ACCOUNT":mode==="reset"?"ACCOUNT HELP":mode==="update"?"ACCOUNT RECOVERY":"WELCOME BACK TO STAR"}</p>
 <h2>{mode==="signup"?"Start with you.":mode==="reset"?"Reset your password.":mode==="update"?"A new password.":"Parent sign in."}</h2>
 <p className="parent-form-intro">{mode==="signup"?"Create an account using your own details. You’ll add your player after confirming your email.":mode==="reset"?"Enter your account email and we’ll send you a reset link.":mode==="update"?"Choose a password of at least 12 characters.":"Sign in to register your player or catch up with her STAR development."}</p>
 <form onSubmit={submit} className="star-portal-form parent-auth-form">
 {mode==="signup"&&<label>Parent / guardian name<input required autoComplete="name" minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>}
 {mode!=="update"&&<label>Email address<input type="email" required autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e=>setEmail(e.target.value)} maxLength={200}/></label>}
 {mode!=="reset"&&<div className="parent-password-group"><label htmlFor="parent-password">Password</label><span className="parent-password-field"><input id="parent-password" type={showPassword?"text":"password"} required autoComplete={mode==="signup"||mode==="update"?"new-password":"current-password"} minLength={mode==="signup"||mode==="update"?12:1} aria-describedby={mode==="signup"||mode==="update"?"parent-password-help":undefined} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="parent-password-toggle" aria-pressed={showPassword} aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(v=>!v)}>{showPassword?"Hide":"Show"}</button></span>{(mode==="signup"||mode==="update")&&<small id="parent-password-help">At least 12 characters. A few memorable words work well.</small>}</div>}
 {mode==="signup"&&<label className="parent-checkbox"><input type="checkbox" checked={adultConfirmed} required onChange={e=>setAdultConfirmed(e.target.checked)}/><span>I’m a parent or legal guardian aged 18 or over.</span></label>}
 <button disabled={busy} type="submit">{busy?"Please wait…":mode==="signup"?"Create my parent account →":mode==="reset"?"Send reset link →":mode==="update"?"Save new password →":"Sign in →"}</button>
 </form>
 <div className="star-portal-switch"><button type="button" onClick={()=>changeMode(mode==="signup"?"login":"signup")}>{mode==="signup"?"Already have an account? Sign in":"New to STAR? Create a parent account"}</button>{mode!=="update"&&<button type="button" onClick={()=>changeMode(mode==="reset"?"login":"reset")}>{mode==="reset"?"Back to sign in":"Forgot password?"}</button>}</div>
 <p className="parent-form-hint">{mode==="signup"?"Creating an account doesn’t reserve a place or commit you to payment. ":"Your account is for parents and guardians aged 18 or over. "}<Link href="/privacy">Privacy & safeguarding</Link></p>
 </>}
 </>:<>
 <div className="star-portal-head"><div><p className="parent-eyebrow">YOUR STAR ACCOUNT</p><h2>{usingDashboard?"Your parent dashboard.":hasRegistration?"Welcome to STAR.":"Let’s meet your player."}</h2></div><button type="button" onClick={signOut}>Sign out</button></div><p className="parent-signed-in">{usingDashboard&&<>Welcome back, <strong>{profile?.display_name}</strong>. </>}Signed in as <strong>{user.email}</strong></p>
 {!accountLoaded||accountUserId!==user.id||!linksReady?<p role="status">Loading your parent account…</p>:accountFailed?<button type="button" className="parent-primary" onClick={()=>setLoadAttempt(n=>n+1)}>Try loading my account again</button>:<>
 {ownFamily.failed?<div className="parent-family-error"><h3>We couldn’t load her shared information.</h3><p>Your account is still available below. Try loading the family information again.</p><button type="button" className="parent-secondary" onClick={()=>setFamilyAttempt(n=>n+1)}>Reload family information</button>{accountContent}</div>:usingDashboard?memberExperience:<>{profile&&<div className="parent-pending-updates" id="updates"><ParentUpdates items={updates.items} loading={updates.loading} error={updates.error} onRefresh={()=>void updates.refresh()} onRead={updates.markRead} onOpen={()=>{setLoadAttempt(n=>n+1);document.getElementById("parent-account")?.scrollIntoView({block:"start"})}}/><ParentPhoneAlerts key={user.id} userKey={user.id}/></div>}{accountContent}{hasRegistration&&<div className="parent-future"><h3>Her development, in one place.</h3><p>When STAR links your player’s coaching profile, this area will show her shared goals, progress, sessions and coach updates.</p></div>}</>}

 </>}
 </>}
 </div>{!usingDashboard&&<aside className="star-portal-aside parent-journey"><p className="parent-eyebrow">JOINING STAR</p><h3>A few simple steps.</h3><ol className="parent-steps">{steps.map((step,i)=><li key={step.title} className={currentStep>i+1?"complete":currentStep===i+1?"current":""} aria-current={currentStep===i+1?"step":undefined}><span className="parent-step-number" aria-hidden="true">{currentStep>i+1?"✓":String(i+1).padStart(2,"0")}</span><div><strong>{step.title}{currentStep>i+1&&<span className="parent-step-done"> · Done</span>}</strong><p>{step.copy}</p></div></li>)}</ol>
 {selectedProgramme&&<div className="parent-programme-selection"><span>YOUR PROGRAMME INTEREST</span><strong>{selectedProgramme.title}</strong><small>{selectedProgramme.age}</small><Link href="/programmes">Explore other programmes →</Link></div>}
 <div className="parent-journey-help"><h4>A hand getting started?</h4><p>Talk to STAR about programmes, places or the registration process.</p><a href="https://wa.me/447902594064">WhatsApp STAR ↗</a><a href="tel:+447902594064">Call 07902 594064</a></div><p className="parent-journey-note">Your player’s details are shared with STAR for review. A place and any enrolment arrangements are confirmed separately.</p></aside>}</div>
}

