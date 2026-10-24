"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient,type User} from "@supabase/supabase-js";
import Link from "next/link";
type Staff={user_id:string;role:"owner"|"manager"|"coach"|"assistant_coach";active:boolean;welfare_officer:boolean};
const roles:Record<Staff["role"],string>={owner:"Owner",manager:"Manager",coach:"Coach",assistant_coach:"Assistant Coach"};
export function StaffDashboard(){
 const client=useMemo(()=>{const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return url&&key?createClient(url,key):null},[]);
 const [user,setUser]=useState<User|null>(null),[staff,setStaff]=useState<Staff|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState("");
 useEffect(()=>{if(!client){setReady(true);return;}let alive=true;client.auth.getUser().then(({data})=>{if(alive){setUser(data.user);setReady(true);}}).catch(()=>{if(alive)setReady(true)});const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{if(alive)setUser(session?.user||null)});return()=>{alive=false;subscription.unsubscribe()}},[client]);
 useEffect(()=>{if(!client||!user){setStaff(null);return;}let alive=true;client.from("staff_members").select("user_id,role,active,welfare_officer").eq("user_id",user.id).maybeSingle().then(({data,error})=>{if(!alive)return;if(error){setError("Staff access could not be checked. Please try again.");setStaff(null);}else setStaff(data as Staff|null)});return()=>{alive=false}},[client,user]);
 async function signIn(e:React.FormEvent){e.preventDefault();if(!client)return;setBusy(true);setError("");const {error}=await client.auth.signInWithPassword({email,password});setPassword("");if(error)setError("Sign in failed. Check your email and password.");setBusy(false);}
 if(!ready)return <p>Checking staff access…</p>;
 if(!client)return <p>Staff sign-in is temporarily unavailable.</p>;
 return <div className="star-staff-shell">
 <div className="star-staff-panel">
 {!user?<><h2>Staff sign in</h2><p>For authorised STAR staff only. Use your existing STAR account credentials.</p><form className="star-portal-form" onSubmit={signIn}><label>Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy} type="submit">{busy?"Signing in…":"Sign in"}</button></form><p>Need an account? <Link href="/parent-portal">Account sign-in and recovery</Link>.</p></>:
 !staff?.active?<><h2>Staff access required</h2><p>You're signed in, but this account has not been approved for STAR staff access. Staff roles are assigned privately by the business owner.</p><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></>:
 <><div className="star-staff-header"><div><span className="kicker">STAR / PRIVATE STAFF AREA</span><h2>Staff dashboard</h2><p>{roles[staff.role]}{staff.welfare_officer?" · Designated Safeguarding Lead / Welfare Officer":""}</p></div><button type="button" onClick={()=>client.auth.signOut()}>Sign out</button></div>
 <div className="star-staff-grid">
 <article><span className="kicker">YOUR ACCESS</span><h3>{roles[staff.role]}</h3><p>Staff permissions are linked to your verified account and checked in the database.</p></article>
 <article><span className="kicker">PLAYERS & SESSIONS</span><h3>Coming next</h3><p>Assigned player lists, sessions and coaching records will appear after access controls are tested.</p></article>
 <article><span className="kicker">SAFEGUARDING</span><h3>{staff.welfare_officer||staff.role==="owner"?"Lead access planned":"Report a concern"}</h3><p>Confidential safeguarding case records are not yet enabled. For an urgent concern, follow STAR's safeguarding procedure rather than entering sensitive details here.</p></article>
 <article><span className="kicker">ADMINISTRATION</span><h3>Controlled rollout</h3><p>Registration review, staff invitations and programme management will be introduced in stages.</p></article>
 </div></>}
 {error&&<p role="alert" className="star-portal-error">{error}</p>}
 </div><aside className="star-staff-side"><h3>Security first</h3><p>Staff access is invitation-controlled. A parent account does not grant staff permissions.</p><p>Safeguarding files, medical information and player records remain inaccessible from this dashboard until dedicated permissions and audit controls are complete.</p><Link href="/privacy">Privacy and safeguarding information</Link></aside></div>;
}
