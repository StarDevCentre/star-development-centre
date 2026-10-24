"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient,type User} from "@supabase/supabase-js";
import Link from "next/link";
import {StaffAdmin} from "./StaffAdmin";
type Staff={user_id:string;role:"owner"|"manager"|"coach"|"assistant_coach";active:boolean;welfare_officer:boolean};
const roles:Record<Staff["role"],string>={owner:"Owner",manager:"Manager",coach:"Coach",assistant_coach:"Assistant Coach"};
export function StaffDashboard(){
 const client=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createClient(url,key):null},[]);
 const [user,setUser]=useState<User|null>(null),[staff,setStaff]=useState<Staff|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [requested,setRequested]=useState(false);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[mode,setMode]=useState<"login"|"register"|"reset"|"new_password">("login");
 useEffect(()=>{if(!client){setReady(true);return;}let alive=true;client.auth.getUser().then(({data})=>{if(alive){setUser(data.user);setReady(true);}}).catch(()=>{if(alive)setReady(true)});const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{if(alive){setUser(session?.user||null);if(event==="PASSWORD_RECOVERY")setMode("new_password");}});return()=>{alive=false;subscription.unsubscribe()}},[client]);
 useEffect(()=>{if(!client||!user){setStaff(null);return;}let alive=true;client.from("staff_members").select("user_id,role,active,welfare_officer").eq("user_id",user.id).maybeSingle().then(({data,error})=>{if(!alive)return;if(error){setError("Staff access could not be checked. Please try again.");setStaff(null);}else setStaff(data as Staff|null)});return()=>{alive=false}},[client,user]);
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
 !staff?.active?<><h2>Staff access required</h2><p>You are signed in, but the STAR owner must approve your staff access.</p><p>Account: {user.email}</p><button type="button" disabled={busy||requested||!user.email} onClick={async()=>{setBusy(true);setError("");const {error}=await client.from("staff_access_requests").insert({user_id:user.id,contact_email:user.email});if(error&&error.code!=="23505")setError("Request could not be submitted: "+error.message);else{setRequested(true);setNotice("Your request has been submitted for owner approval.");}setBusy(false);}}>{requested?"Request submitted":"Request staff access"}</button><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></>:
 <><div className="star-staff-header"><div><span className="kicker">STAR / PRIVATE STAFF AREA</span><h2>Staff dashboard</h2><p>{roles[staff.role]}{staff.welfare_officer?" · Designated Safeguarding Lead / Welfare Officer":""}</p></div><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></div>
 <div className="star-staff-grid">
 <article><span className="kicker">YOUR ACCESS</span><h3>{roles[staff.role]}</h3><p>Staff permissions are linked to your verified account and checked in the database.</p></article>
 <article><span className="kicker">PLAYERS & SESSIONS</span><h3>Coming next</h3><p>Assigned player lists, sessions and coaching records will appear after access controls are tested.</p></article>
 <article><span className="kicker">SAFEGUARDING</span><h3>{staff.welfare_officer||staff.role==="owner"?"Lead access planned":"Report a concern"}</h3><p>Confidential safeguarding case records are not yet enabled. For an urgent concern, follow STAR's safeguarding procedure rather than entering sensitive details here.</p></article>
 <article><span className="kicker">ADMINISTRATION</span><h3>Controlled rollout</h3><p>Registration review, staff invitations and programme management will be introduced in stages.</p></article>
 {staff.role==="owner"&&<StaffAdmin ownerId={user.id}/>}
 </div></>}
 {error&&<p role="alert" className="star-portal-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </div><aside className="star-staff-side"><h3>Security first</h3><p>Staff access requires owner approval. Register and recover your login here; parent portal registration is not required.</p><p>Safeguarding files, medical information and player records remain inaccessible from this dashboard until dedicated permissions and audit controls are complete.</p><Link href="/privacy">Privacy and safeguarding information</Link></aside></div>;
}
