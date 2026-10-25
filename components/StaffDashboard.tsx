"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient,type User} from "@supabase/supabase-js";
import {StaffAdmin} from "./StaffAdmin";
import {TrainingPlanner} from "./TrainingPlanner";
import {PlayerManagement} from "./PlayerManagement";
import {SessionAttendance} from "./SessionAttendance";
import {CoachingRecords} from "./CoachingRecords";
import {PlayerIDP} from "./PlayerIDP";
import {StaffCommandCentre} from "./StaffCommandCentre";
type Staff={user_id:string;role:"owner"|"manager"|"coach"|"assistant_coach";active:boolean;welfare_officer:boolean};
type StaffSection="overview"|"sessions"|"players"|"attendance"|"records"|"idps"|"administration";
const roles:Record<Staff["role"],string>={owner:"Owner",manager:"Manager",coach:"Coach",assistant_coach:"Assistant Coach"};
export function StaffDashboard(){
 const client=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createClient(url,key):null},[]);
 const [user,setUser]=useState<User|null>(null),[staff,setStaff]=useState<Staff|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [requested,setRequested]=useState(false);
 const [checkedStaffUserId,setCheckedStaffUserId]=useState<string|null>(null);
 const [staffCheckError,setStaffCheckError]=useState(false);
 const [section,setSection]=useState<StaffSection>("overview");
 const [hubPlayerId,setHubPlayerId]=useState("");
 const [coachingTarget,setCoachingTarget]=useState<{playerId:string;sessionId:string}|null>(null);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[mode,setMode]=useState<"login"|"register"|"reset"|"new_password">("login");
 useEffect(()=>{if(!client){setReady(true);return;}let alive=true;client.auth.getUser().then(({data})=>{if(alive){setUser(data.user);setReady(true);}}).catch(()=>{if(alive)setReady(true)});const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{if(alive){setUser(session?.user||null);if(event==="PASSWORD_RECOVERY")setMode("new_password");}});return()=>{alive=false;subscription.unsubscribe()}},[client]);
 useEffect(()=>{if(!client||!user){setStaff(null);setCheckedStaffUserId(null);setStaffCheckError(false);return;}let alive=true;setStaffCheckError(false);client.from("staff_members").select("user_id,role,active,welfare_officer").eq("user_id",user.id).maybeSingle().then(({data,error})=>{if(!alive)return;if(error){setStaff(null);setStaffCheckError(true);}else{setStaff(data as Staff|null);setStaffCheckError(false);}setCheckedStaffUserId(user.id);}).catch(()=>{if(!alive)return;setStaff(null);setStaffCheckError(true);setCheckedStaffUserId(user.id);});return()=>{alive=false}},[client,user]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!client)return;setBusy(true);setError("");setNotice("");
 try{
 if(mode==="login"){const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;}
 if(mode==="register"){const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/staff"}});if(error)throw error;setNotice("Check your inbox to verify your email. Your account must then be approved by the STAR owner before staff access is granted.");setMode("login");}
 if(mode==="reset"){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/staff"});if(error)throw error;setNotice("If this email is registered, password recovery instructions will be sent.");setMode("login");}
 if(mode==="new_password"){const {error}=await client.auth.updateUser({password});if(error)throw error;setNotice("Password updated.");setMode("login");}
 }catch{setError("This request could not be completed. Check your details or try again later.");}finally{setPassword("");setBusy(false);}}
 if(!ready)return <p>Checking staff access…</p>;
 if(!client)return <p>Staff sign-in is temporarily unavailable.</p>;
 return <div className="star-staff-shell">
 <div className="star-staff-panel">
 {!user||mode==="new_password"?<><h2>{mode==="register"?"Staff registration":mode==="reset"?"Reset password":mode==="new_password"?"Set new password":"Staff sign in"}</h2><p>{mode==="register"?"Create a STAR staff login. Registration does not grant access to staff records until the owner approves your account.":mode==="reset"?"Enter your staff email address to request a password reset.":mode==="new_password"?"Choose a new password for your account.":"Sign in to the private STAR staff portal."}</p><form className="star-portal-form" onSubmit={submit}>{mode!=="new_password"&&<label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}{mode!=="reset"&&<label>{mode==="new_password"?"New password":"Password"}<input type="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)}/></label>}<button disabled={busy} type="submit">{busy?"Please wait…":mode==="register"?"Create staff account":mode==="reset"?"Send reset email":mode==="new_password"?"Save new password":"Sign in"}</button></form><div className="star-staff-auth-links">{mode!=="login"&&<button type="button" onClick={()=>{setMode("login");setError("");}}>Back to sign in</button>}{mode==="login"&&<><button type="button" onClick={()=>{setMode("register");setError("");}}>Register as staff</button><button type="button" onClick={()=>{setMode("reset");setError("");}}>Forgot password?</button></>}</div></>:
 checkedStaffUserId!==user.id?<><h2>Checking staff access…</h2><p>Verifying your STAR permissions.</p></>:
 staffCheckError?<><h2>Unable to verify staff access</h2><p>We could not check your staff permissions. Please refresh the page and try again. Your account has not been denied access.</p><button type="button" onClick={()=>window.location.reload()}>Retry access check</button><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></>:
 !staff?.active?<><h2>Staff access required</h2><p>You are signed in, but the STAR owner must approve your staff access.</p><p>Account: {user.email}</p><button type="button" disabled={busy||requested||!user.email} onClick={async()=>{setBusy(true);setError("");const {error}=await client.from("staff_access_requests").insert({user_id:user.id,contact_email:user.email});if(error&&error.code!=="23505")setError("Request could not be submitted: "+error.message);else{setRequested(true);setNotice("Your request has been submitted for owner approval.");}setBusy(false);}}>{requested?"Request submitted":"Request staff access"}</button><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></>:
 <><div className="star-staff-header"><div><span className="kicker">STAR / PRIVATE STAFF AREA</span><h2>Staff dashboard</h2><p>{roles[staff.role]}{staff.welfare_officer?" · Designated Safeguarding Lead / Welfare Officer":""}</p></div><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></div>
 <nav className="star-staff-nav" aria-label="Staff dashboard sections">
 {([{id:"overview",label:"Overview"},{id:"sessions",label:"Training sessions"},{id:"players",label:"Players"},{id:"attendance",label:"Attendance"},{id:"records",label:"Coaching records"},{id:"idps",label:"Development plans"},...(staff.role==="owner"?[{id:"administration",label:"Staff administration"}]:[])] as {id:StaffSection;label:string}[]).map(item=><button key={item.id} type="button" aria-current={section===item.id?"page":undefined} className={section===item.id?"active":""} onClick={()=>{if(item.id==="records")setCoachingTarget(null);setSection(item.id)}}>{item.label}</button>)}
 </nav>
 {section==="overview"&&<StaffCommandCentre canManage={staff.role==="owner"||staff.role==="manager"} isOwner={staff.role==="owner"} onNavigate={(area,playerId)=>{if(playerId)setHubPlayerId(playerId);if(area==="records")setCoachingTarget(null);setSection(area)}}/>}
 {section==="sessions"&&<TrainingPlanner userId={user.id} canManage={staff.role==="owner"||staff.role==="manager"}/>}
 {section==="players"&&<PlayerManagement userId={user.id} canManage={staff.role==="owner"||staff.role==="manager"}/>}
 {section==="attendance"&&<SessionAttendance userId={user.id} onCoachPlayer={(playerId,sessionId)=>{setCoachingTarget({playerId,sessionId});setSection("records");}}/>}
 {section==="records"&&<CoachingRecords key={coachingTarget?coachingTarget.playerId+":"+coachingTarget.sessionId:"general"} userId={user.id} initialPlayerId={coachingTarget?.playerId} initialSessionId={coachingTarget?.sessionId}/>}
 {section==="idps"&&<PlayerIDP key={hubPlayerId||"all"} userId={user.id} initialPlayerId={hubPlayerId} onAddNote={playerId=>{setCoachingTarget({playerId,sessionId:""});setSection("records")}} onManageGoals={()=>setSection("players")}/>}
 {section==="administration"&&staff.role==="owner"&&<StaffAdmin ownerId={user.id}/>}

 </>}
 {error&&<p role="alert" className="star-portal-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </div></div>;
}
