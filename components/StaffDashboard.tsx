"use client";
import {useEffect,useRef,useState} from "react";
import {type User} from "@supabase/supabase-js";
import {StaffWorkspace} from "./StaffWorkspace";
import {supabaseBrowser} from "../lib/supabaseBrowser";
type Staff={user_id:string;role:"owner"|"manager"|"coach"|"assistant_coach";active:boolean;welfare_officer:boolean};
export function StaffDashboard(){
 const client=supabaseBrowser;
 const authRevision=useRef(0),identity=useRef("");
 const [user,setUser]=useState<User|null>(null),[staff,setStaff]=useState<Staff|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [requested,setRequested]=useState(false);
 const [checkedStaffUserId,setCheckedStaffUserId]=useState<string|null>(null);
 const [staffCheckError,setStaffCheckError]=useState(false);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[mode,setMode]=useState<"login"|"register"|"reset"|"new_password">("login");
 useEffect(()=>{if(!client){setReady(true);return;}let alive=true;const revision=authRevision.current;
 client.auth.getUser().then(({data})=>{if(alive&&authRevision.current===revision){identity.current=data.user?.id||"";setUser(data.user)}}).catch(()=>{}).finally(()=>{if(alive)setReady(true)});
 const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{if(!alive)return;authRevision.current++;const next=session?.user?.id||"";if(identity.current!==next||event==="SIGNED_OUT"){setStaff(null);setCheckedStaffUserId(null);setRequested(false);setError("");setNotice("")}identity.current=next;setUser(session?.user||null);setReady(true);if(event==="PASSWORD_RECOVERY")setMode("new_password");});return()=>{alive=false;subscription.unsubscribe()}},[client]);
 useEffect(()=>{if(!client||!user){setStaff(null);setCheckedStaffUserId(null);setStaffCheckError(false);return;}let alive=true;setStaffCheckError(false);Promise.resolve(client.from("staff_members").select("user_id,role,active,welfare_officer").eq("user_id",user.id).maybeSingle()).then(({data,error})=>{if(!alive)return;if(error){setStaff(null);setStaffCheckError(true);}else{setStaff(data as Staff|null);setStaffCheckError(false);}setCheckedStaffUserId(user.id);}).catch(()=>{if(!alive)return;setStaff(null);setStaffCheckError(true);setCheckedStaffUserId(user.id);});return()=>{alive=false}},[client,user]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!client)return;setBusy(true);setError("");setNotice("");
 try{
 if(mode==="login"){const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;}
 if(mode==="register"){const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/staff"}});if(error)throw error;setNotice("Check your inbox to verify your email. Your account must then be approved by the STAR owner before staff access is granted.");setMode("login");}
 if(mode==="reset"){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/staff"});if(error)throw error;setNotice("If this email is registered, password recovery instructions will be sent.");setMode("login");}
 if(mode==="new_password"){const {error}=await client.auth.updateUser({password});if(error)throw error;setNotice("Password updated.");setMode("login");}
 }catch{setError("This request could not be completed. Check your details or try again later.");}finally{setPassword("");setBusy(false);}}
 if(!ready)return <p>Checking staff access…</p>;
 if(!client)return <p>Staff sign-in is temporarily unavailable.</p>;
 return <div className={user&&mode!=="new_password"&&checkedStaffUserId===user.id&&staff?.active?"star-staff-shell staff-workspace-host":"star-staff-shell staff-auth-host"}>
 <div className="star-staff-panel">
 {!user||mode==="new_password"?<><h2>{mode==="register"?"Staff registration":mode==="reset"?"Reset password":mode==="new_password"?"Set new password":"Staff sign in"}</h2><p>{mode==="register"?"Create a STAR staff login. Registration does not grant access to staff records until the owner approves your account.":mode==="reset"?"Enter your staff email address to request a password reset.":mode==="new_password"?"Choose a new password for your account.":"Sign in to the private STAR staff portal."}</p><form className="star-portal-form" onSubmit={submit}>{mode!=="new_password"&&<label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}{mode!=="reset"&&<label>{mode==="new_password"?"New password":"Password"}<input type="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)}/></label>}<button disabled={busy} type="submit">{busy?"Please wait…":mode==="register"?"Create staff account":mode==="reset"?"Send reset email":mode==="new_password"?"Save new password":"Sign in"}</button></form><div className="star-staff-auth-links">{mode!=="login"&&<button type="button" onClick={()=>{setMode("login");setError("");}}>Back to sign in</button>}{mode==="login"&&<><button type="button" onClick={()=>{setMode("register");setError("");}}>Register as staff</button><button type="button" onClick={()=>{setMode("reset");setError("");}}>Forgot password?</button></>}</div></>:
 checkedStaffUserId!==user.id?<><h2>Checking staff access…</h2><p>Verifying your STAR permissions.</p></>:
 staffCheckError?<><h2>Unable to verify staff access</h2><p>We could not check your staff permissions. Please refresh the page and try again. Your account has not been denied access.</p><button type="button" onClick={()=>window.location.reload()}>Retry access check</button><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></>:
 (!staff?.active||staff.user_id!==user.id)?<><h2>Staff access required</h2><p>You are signed in, but the STAR owner must approve your staff access.</p><p>Account: {user.email}</p><button type="button" disabled={busy||requested||!user.email} onClick={async()=>{setBusy(true);setError("");const {error}=await client.from("staff_access_requests").insert({user_id:user.id,contact_email:user.email});if(error&&error.code!=="23505")setError("Request could not be submitted: "+error.message);else{setRequested(true);setNotice("Your request has been submitted for owner approval.");}setBusy(false);}}>{requested?"Request submitted":"Request staff access"}</button><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></>:
 <StaffWorkspace key={user.id+":"+staff.role} userId={user.id} role={staff.role} onSignOut={()=>void client.auth.signOut()}/>}
 {error&&<p role="alert" className="star-portal-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </div></div>;
}
