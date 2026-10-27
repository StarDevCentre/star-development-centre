"use client";
import {useEffect,useState} from "react";
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
const playerDraftsEnabled=true;
type Profile={user_id:string;display_name:string;contact_phone:string|null};
type LinkedPlayer={id:string;first_name:string;last_name:string;programme:string};
type PlayerGoal={id:string;player_id:string;goal:string;status:string};
type FamilyReport={id:string;player_id:string;review_month:string;strengths:string;development_areas:string;next_steps:string};
type FamilySession={id:string;player_id:string;title:string;starts_at:string;ends_at:string;venue:string};
type PlayerAssessment={id:string;player_id:string;category:string;rating:number;assessed_on:string};
type Registration={id:string;player_first_name:string;programme:string;status:string;created_at:string;recommended_programme:string|null};
type AuthMode="login"|"signup"|"confirm"|"reset"|"update";
export function ParentPortal({initialMode="login",initialProgramme:requestedProgramme=""}:{initialMode?:"login"|"signup"|"reset";initialProgramme?:string}){
 const supabase=supabaseBrowser;
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false);
 const [mode,setMode]=useState<AuthMode>(initialMode);
 const [initialProgramme,setInitialProgramme]=useState(requestedProgramme);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const requested=params.get("programme");let saved=requested||"";try{saved=saved||window.sessionStorage.getItem("star-programme-interest")||""}catch{}if(programmes.some(p=>p.slug===saved)){setInitialProgramme(saved);try{window.sessionStorage.setItem("star-programme-interest",saved)}catch{}}},[]);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[phone,setPhone]=useState("");
 const [profile,setProfile]=useState<Profile|null>(null),[registrations,setRegistrations]=useState<Registration[]>([]);
 const [linkedPlayers,setLinkedPlayers]=useState<LinkedPlayer[]>([]),[linkedGoals,setLinkedGoals]=useState<PlayerGoal[]>([]),[linkedAssessments,setLinkedAssessments]=useState<PlayerAssessment[]>([]),[linksReady,setLinksReady]=useState(false);
 const [familyReports,setFamilyReports]=useState<FamilyReport[]>([]),[familySessions,setFamilySessions]=useState<FamilySession[]>([]);
 const [accountLoaded,setAccountLoaded]=useState(false),[accountFailed,setAccountFailed]=useState(false),[loadAttempt,setLoadAttempt]=useState(0);
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
  if(!supabase||!user){setLinkedPlayers([]);setLinkedGoals([]);setLinkedAssessments([]);setFamilyReports([]);setFamilySessions([]);setLinksReady(false);return;}
  let active=true;
  async function load(){try{
   const [p,r]=await Promise.all([supabase!.from("guardian_profiles").select("user_id,display_name,contact_phone").eq("user_id",user!.id).maybeSingle(),supabase!.from("player_registrations").select("id,player_first_name,programme,status,created_at,recommended_programme").eq("guardian_id",user!.id).order("created_at",{ascending:false})]);
   if(p.error||r.error)throw Error();
   if(active){setProfile(p.data);setRegistrations(r.data||[]);setShowRegistration(!(r.data||[]).length);if(!p.data){const savedName=user!.user_metadata?.guardian_name;if(typeof savedName==="string")setName(savedName.slice(0,100))}}
  }catch{if(active){setAccountFailed(true);setError("We couldn’t load your account. Please try again.")}}finally{if(active)setAccountLoaded(true)}}
  void load();return()=>{active=false};
 },[supabase,user?.id,loadAttempt]);
 useEffect(()=>{if(!supabase||!user)return;let active=true;async function loadLinked(){setLinksReady(false);const links=await supabase!.from("guardian_player_links").select("player_id").eq("guardian_id",user!.id);if(!active)return;if(links.error){setLinksReady(true);return;}const ids=(links.data||[]).map(x=>x.player_id);if(!ids.length){setLinkedPlayers([]);setLinkedGoals([]);setLinkedAssessments([]);setFamilyReports([]);setFamilySessions([]);setLinksReady(true);return;}const [players,goals,assessments,reports,upcoming]=await Promise.all([supabase!.from("coaching_players").select("id,first_name,last_name,programme").in("id",ids),supabase!.from("coaching_development_goals").select("id,player_id,goal,status").in("player_id",ids),supabase!.from("coaching_idp_assessments").select("id,player_id,category,rating,assessed_on").in("player_id",ids).order("assessed_on",{ascending:false}),supabase!.from("family_monthly_reports").select("id,player_id,review_month,strengths,development_areas,next_steps").in("player_id",ids).order("review_month",{ascending:false}),supabase!.from("family_session_schedule").select("id,player_id,title,starts_at,ends_at,venue").in("player_id",ids).gte("ends_at",new Date().toISOString()).order("starts_at",{ascending:true})]);if(active){if(players.error||goals.error||assessments.error||reports.error||upcoming.error)setError("Unable to load approved player development information.");else{setLinkedPlayers(players.data||[]);setLinkedGoals(goals.data||[]);setLinkedAssessments(assessments.data||[]);setFamilyReports(reports.data||[]);setFamilySessions(upcoming.data||[]);}setLinksReady(true)}}void loadLinked();return()=>{active=false}},[supabase,user]);
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
  try{const {data:record,error:saveError}=await supabase.from("player_registrations").insert({...data,guardian_id:user.id,status:"submitted",submitted_at:new Date().toISOString()}).select("id,player_first_name,programme,status,created_at,recommended_programme").single();
   if(saveError||!record)throw Error("We couldn't submit this application. Please try again.");
   setRegistrations(current=>[{...record,recommended_programme:null},...current]);setRecentRegistration(record.id);setShowRegistration(false);setNotice("Your player registration has been submitted. Review prices and payment options below while STAR checks availability.");return true;
  }catch{setError("We couldn't submit this application. Please try again.");return false;}finally{setBusy(false);}
 }
 async function saveProfile(e:React.FormEvent){
  e.preventDefault();if(!supabase||!user||busy)return;setBusy(true);setError("");setNotice("");
  try{const display_name=name.trim();if(display_name.length<2||display_name.length>100)throw Error("Please enter your name (2–100 characters).");
   const {error}=await supabase.from("guardian_profiles").upsert({user_id:user.id,display_name,contact_phone:phone.trim()||null},{onConflict:"user_id"});if(error)throw error;
   setProfile({user_id:user.id,display_name,contact_phone:phone.trim()||null});setNotice("Parent details saved. Now add your player’s details.");
  }catch{setError("Could not save your parent details. Please check them and try again.")}finally{setBusy(false)}
 }
 const hasRegistration=registrations.some(r=>r.status!=="draft");
 const selectedProgramme=programmes.find(p=>p.slug===initialProgramme);
 const steps=[{title:"Parent account",copy:"Your details and a secure password."},{title:"Confirm your email",copy:"Follow the link in your inbox."},{title:"Register your player",copy:"Add her details, then view prices."}];
 const currentStep=user?hasRegistration?4:3:mode==="confirm"?2:1;
 const programmeTitle=(slug:string)=>programmes.find(p=>p.slug===slug)?.title||slug;
 const statusText:Record<string,string>={draft:"Draft",submitted:"Awaiting STAR review",under_review:"Under review",waitlisted:"On the waiting list",accepted:"Accepted — STAR will confirm arrangements",declined:"Reviewed — contact STAR to discuss",enrolled:"Enrolled"};
 if(!ready)return <div className="parent-loading" id="parent-account" role="status">Checking your account…</div>;
 if(!supabase)return <p>Parent accounts are temporarily unavailable. Please <Link href="/contact">contact STAR</Link>.</p>;
 return <div className="star-portal" id="parent-account">
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
 <div className="star-portal-head"><div><p className="parent-eyebrow">YOUR STAR ACCOUNT</p><h2>{hasRegistration?"Welcome to STAR.":"Let’s meet your player."}</h2></div><button type="button" onClick={async()=>{const {error}=await supabase.auth.signOut();if(error){setError("We couldn’t sign you out. Please try again.");return;}setNotice("");setError("");setPassword("");setName("");setPhone("");setMode("login");}}>Sign out</button></div><p className="parent-signed-in">Signed in as <strong>{user.email}</strong></p>
 {!accountLoaded?<p role="status">Loading your parent account…</p>:accountFailed?<button type="button" className="parent-primary" onClick={()=>setLoadAttempt(n=>n+1)}>Try loading my account again</button>:<>
 {!profile?<section className="parent-profile-step"><h3>Your contact details</h3><p>Check your name and add a contact number if you’d like STAR to call you. Your player’s details come next.</p><form className="star-portal-form" onSubmit={saveProfile}><label>Your full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label><label>Phone number <small>Optional</small><input type="tel" maxLength={40} autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label><button disabled={busy} type="submit">{busy?"Saving…":"Save & continue to my player →"}</button></form></section>:<>
 {registrations.length>0&&<section className="parent-applications" aria-labelledby="parent-applications-title"><h3 id="parent-applications-title">Your player registrations</h3>{registrations.map(r=><article key={r.id} className={recentRegistration===r.id?"parent-application just-submitted":"parent-application"}><div className="parent-application-title"><h4>{r.player_first_name}</h4><span>{statusText[r.status]||r.status.replaceAll("_"," ")}</span></div><p>{programmeTitle(r.programme)}{r.recommended_programme&&<> · STAR recommends {programmeTitle(r.recommended_programme)}</>}</p>{recentRegistration===r.id&&<p className="parent-application-success" role="status">Registration received. STAR will review her details and discuss a suitable place with you.</p>}{r.status==="draft"?<button type="button" className="parent-primary" disabled={busy} onClick={async()=>{if(!supabase||!user||busy)return;setBusy(true);setError("");try{const {data,error}=await supabase.from("player_registrations").update({status:"submitted",submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",r.id).eq("guardian_id",user.id).eq("status","draft").select("id").single();if(error||!data)throw Error();setRegistrations(v=>v.map(a=>a.id===r.id?{...a,status:"submitted"}:a));setRecentRegistration(r.id);setNotice("Registration submitted. You can now view programme prices below.")}catch{setError("Could not submit this registration. Please try again.")}finally{setBusy(false)}}}>Submit this registration →</button>:<a href="#programme-prices" className="parent-inline-link">View prices & payment options ↓</a>}</article>)}</section>}
 {showRegistration?<><PlayerRegistrationDraft key={initialProgramme} onSave={saveDraft} busy={busy} initialProgramme={initialProgramme}/>{registrations.length>0&&<button className="parent-text-button" type="button" onClick={()=>setShowRegistration(false)}>Cancel adding another player</button>}</>:<button className="parent-secondary" type="button" onClick={()=>{setShowRegistration(true);setRecentRegistration(null)}}>+ Register another player</button>}
 </>}
 <ParentProgrammePrices key={user.id} supabase={supabase} userId={user.id} eligible={!!profile&&hasRegistration} preferred={registrations.flatMap(r=>[r.programme,...(r.recommended_programme?[r.recommended_programme]:[])])}/>
 {hasRegistration&&<section className="parent-next-steps"><h3>What happens next?</h3><ol><li><strong>STAR reviews her registration.</strong> We check the programme choice and availability.</li><li><strong>We agree her starting point.</strong> Discuss the venue, session arrangements and any support she needs directly with STAR.</li><li><strong>Confirm her place together.</strong> Enrolment consent and payment arrangements are completed separately.</li></ol><a href="https://wa.me/447902594064" className="parent-inline-link">Ask STAR on WhatsApp ↗</a></section>}
 {linkedPlayers.length>0?<section className="parent-development-area">
 <p><Link href="/player-portal"><strong>Open the Player Portal trophy cabinet →</strong></Link></p><h3>My children's development</h3><p><a href="#star-family-messages"><strong>Go to family messages</strong></a> <FamilyUnreadBadge userId={user.id} role="guardian"/></p>{!linksReady?<p>Checking approved family access…</p>:linkedPlayers.length?linkedPlayers.map(p=><article key={p.id} className="star-hub-panel"><h4>{p.first_name} {p.last_name}</h4><p>{p.programme}</p><h5>Development goals</h5>{linkedGoals.filter(g=>g.player_id===p.id).length?linkedGoals.filter(g=>g.player_id===p.id).map(g=><p key={g.id}>{g.goal} — <strong>{g.status==="achieved"?"Achieved":"Working on"}</strong></p>):<p>No goals available.</p>}<h5>Latest coach assessments</h5><p>Coach-rated development (1–5). These are subjective assessments, not standardised tests.</p>{["Technical","Tactical","Physical","Psychological","Social"].map(cat=>{const latest=linkedAssessments.find(a=>a.player_id===p.id&&a.category===cat);return <div key={cat} className="star-family-progress"><div><strong>{cat}</strong><span>{latest?latest.rating+"/5":"Not assessed"}</span></div><div className="star-family-progress-track"><div style={{width:latest?(latest.rating/5*100)+"%":"0%"}}/></div>{latest&&<small>Assessed {new Date(latest.assessed_on+"T12:00:00").toLocaleDateString("en-GB")}</small>}</div>})}<h5>Progress over time</h5>{(()=>{const history=linkedAssessments.filter(a=>a.player_id===p.id).sort((a,b)=>a.assessed_on.localeCompare(b.assessed_on));const categories=["Technical","Tactical","Physical","Psychological","Social"];const dates=[...new Set(history.map(a=>a.assessed_on))].slice(-8);if(dates.length<2)return <p>More assessments are needed to show progress over time.</p>;const width=340,height=175,x=(i:number)=>36+(dates.length===1?135:i*280/(dates.length-1)),y=(rating:number)=>12+(5-rating)*26;const colors=["#215a94","#bd6b1b","#16846c","#8254a8","#b34466"];return <div className="star-family-chart"><svg viewBox="0 0 340 175" role="img" aria-label="Development rating trends over time">{[1,2,3,4,5].map(n=><g key={n}><line x1="36" x2="320" y1={y(n)} y2={y(n)} stroke="#d7e1ec"/><text x="24" y={y(n)+4} fontSize="11" textAnchor="end">{n}</text></g>)}{dates.map((d,i)=><text key={d} x={x(i)} y="155" fontSize="9" textAnchor="middle">{new Date(d+"T12:00:00").toLocaleDateString("en-GB",{month:"short",year:"2-digit"})}</text>)}{categories.map((cat,i)=>{const pts=dates.map((d,j)=>{const a=history.filter(a=>a.category===cat&&a.assessed_on===d).at(-1);return a?{x:x(j),y:y(a.rating),rating:a.rating,date:d}:null}).filter((v):v is {x:number;y:number;rating:number;date:string}=>v!==null);return <g key={cat}>{pts.length>1&&<polyline points={pts.map(q=>q.x+","+q.y).join(" ")} stroke={colors[i]} strokeWidth="2.5" fill="none"/>}{pts.map(q=><circle key={q.date} cx={q.x} cy={q.y} r="4" fill={colors[i]}><title>{cat}: {q.rating}/5 on {q.date}</title></circle>)}</g>})}</svg><div className="star-family-legend">{categories.map((cat,i)=><span key={cat}><i style={{background:colors[i]}}/>{cat}</span>)}</div></div>})()}
 <h5>Approved monthly reports</h5>{familyReports.filter(r=>r.player_id===p.id).length?familyReports.filter(r=>r.player_id===p.id).map(r=><section className="star-family-detail" key={r.id}><h6>{new Date(r.review_month+"T12:00:00").toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</h6><p><strong>Strengths:</strong> {r.strengths}</p><p><strong>Areas to develop:</strong> {r.development_areas}</p><p><strong>Next steps:</strong> {r.next_steps}</p></section>):<p>No monthly reports have been approved for sharing yet.</p>}
 <h5>Upcoming training sessions</h5>{familySessions.filter(s=>s.player_id===p.id).length?familySessions.filter(s=>s.player_id===p.id).map(s=><div className="star-family-detail" key={s.id}><strong>{s.title}</strong><p>{new Date(s.starts_at).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"})} – {new Date(s.ends_at).toLocaleTimeString("en-GB",{timeStyle:"short"})}</p><p>{s.venue}</p></div>):<p>No upcoming sessions have been shared yet.</p>}
 </article>):<p>No approved player development profiles are linked to your account yet. STAR must verify and approve each parent-child link before any coaching information is shared.</p>}
 <PlayerTrainingHub userId={user.id} role="guardian"/><PlayerAccountSetup players={linkedPlayers} userId={user.id}/><p><Link href="/player-portal">Open family Player Space: progress, messages and player controls →</Link></p>
 <SessionChangeRequests userId={user.id} role="guardian"/>
 <FamilyCommunications key={user.id} userId={user.id} role="guardian"/>
 </section>:hasRegistration?<div className="parent-future"><h3>Her development, in one place.</h3><p>When STAR links your player’s coaching profile, this area will show her shared goals, progress, sessions and coach updates.</p></div>:null}
 </>}
 </>}
 </div><aside className="star-portal-aside parent-journey"><p className="parent-eyebrow">JOINING STAR</p><h3>A few simple steps.</h3><ol className="parent-steps">{steps.map((step,i)=><li key={step.title} className={currentStep>i+1?"complete":currentStep===i+1?"current":""} aria-current={currentStep===i+1?"step":undefined}><span className="parent-step-number" aria-hidden="true">{currentStep>i+1?"✓":String(i+1).padStart(2,"0")}</span><div><strong>{step.title}{currentStep>i+1&&<span className="parent-step-done"> · Done</span>}</strong><p>{step.copy}</p></div></li>)}</ol>
 {selectedProgramme&&<div className="parent-programme-selection"><span>YOUR PROGRAMME INTEREST</span><strong>{selectedProgramme.title}</strong><small>{selectedProgramme.age}</small><Link href="/programmes">Explore other programmes →</Link></div>}
 <div className="parent-journey-help"><h4>A hand getting started?</h4><p>Talk to STAR about programmes, places or the registration process.</p><a href="https://wa.me/447902594064">WhatsApp STAR ↗</a><a href="tel:+447902594064">Call 07902 594064</a></div><p className="parent-journey-note">Your player’s details are shared with STAR for review. A place and any enrolment arrangements are confirmed separately.</p></aside></div>
}
