"use client";
import {useEffect,useState,type ReactNode} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {StaffPlayer,StaffGoal} from "../lib/staffApp";
import {staffDate} from "../lib/staffApp";
import {playerAttendanceSummary,nextLinkedSession} from "../lib/staffPlayer360";
import "./staff-player-360.css";

type Tab="overview"|"development"|"sessions"|"coaching"|"achievements"|"family";
type Assessment={id:string;assessed_on:string;category:string;rating:number;strength:string;development_area:string;action_plan:string};
type Observation={id:string;session_id:string|null;stage:string;category:string;observation:string;next_action:string|null;recorded_at:string};
type Review={id:string;review_month:string;strengths:string;development_areas:string;next_steps:string};
type Attendance={session_id:string;status:string};
type LinkedSession={id:string;title:string;programme:string;starts_at:string;ends_at:string;venue:string|null};
type Achievement={id:string;title:string;description:string;awarded_on:string};
type PublishedReport={id:string;review_month:string};
type Dataset="assessments"|"observations"|"reviews"|"roster"|"attendance"|"sessions"|"achievements"|"reports";
type Snapshot={assessments:Assessment[];observations:Observation[];reviews:Review[];sessions:LinkedSession[];attendance:Attendance[];achievements:Achievement[];reports:PublishedReport[];errors:Dataset[]};
const empty=():Snapshot=>({assessments:[],observations:[],reviews:[],sessions:[],attendance:[],achievements:[],reports:[],errors:[]});
const statusLabel:Record<string,string>={present:"Present",late:"Late",absent:"Absent",excused:"Excused"};
const date=(value:string)=>new Date(value.includes("T")?value:value+"T12:00:00").toLocaleDateString("en-GB",{timeZone:"Europe/London",day:"numeric",month:"short",year:"numeric"});
const summary=(value:string,max=260)=>value.length>max?value.slice(0,max).trimEnd()+"…":value;
const name=(player:StaffPlayer)=>player.first_name+" "+player.last_name;

type Props={
 player:StaffPlayer;client:SupabaseClient|null;canManage:boolean;ownerPreview?:boolean;goals:StaffGoal[];developmentControls:ReactNode;
 onNote?:(id:string)=>void;onDevelopment?:(id:string)=>void;onBadge?:(id:string)=>void;onPositions?:(id:string)=>void;
 onOpenSession?:(id:string)=>void;onPlayerSpace?:(id:string)=>void;onTrainingHub?:(id:string)=>void;
 onFamilyInbox?:(id:string)=>void;onShareWithFamily?:(id:string)=>void;
};
export function StaffPlayer360({player,client,canManage,ownerPreview=false,goals,developmentControls,onNote,onDevelopment,onBadge,onPositions,onOpenSession,onPlayerSpace,onTrainingHub,onFamilyInbox,onShareWithFamily}:Props){
 const [tab,setTab]=useState<Tab>("overview"),[snapshot,setSnapshot]=useState<Snapshot>(empty),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0);
 const tabs:{id:Tab;label:string}[]=[{id:"overview",label:"Overview"},{id:"development",label:"Development"},{id:"sessions",label:"Sessions"},{id:"coaching",label:"Coaching"},{id:"achievements",label:"Achievements"},...(canManage?[{id:"family" as Tab,label:"Family & sharing"}]:[])];
 useEffect(()=>{
  let alive=true;setLoading(true);setSnapshot(empty());
  if(!client){setSnapshot({...empty(),errors:["assessments","observations","reviews","roster","attendance","sessions","achievements",...(canManage?["reports" as Dataset]:[])]});setLoading(false);return;}
  void (async()=>{
   const id=player.id;
   const failures:Dataset[]=[];
   try{
    const queries=await Promise.all([
     client.from("coaching_idp_assessments").select("id,assessed_on,category,rating,strength,development_area,action_plan").eq("player_id",id).order("assessed_on",{ascending:false}).limit(60),
     client.from("coaching_observations").select("id,session_id,stage,category,observation,next_action,recorded_at").eq("player_id",id).order("recorded_at",{ascending:false}).limit(100),
     client.from("coaching_monthly_reviews").select("id,review_month,strengths,development_areas,next_steps").eq("player_id",id).order("review_month",{ascending:false}).limit(36),
     client.from("training_session_participants").select("session_id").eq("player_id",id).limit(250),
     client.from("training_attendance").select("session_id,status").eq("player_id",id).limit(250),
     client.from("player_achievements").select("id,title,description,awarded_on").eq("player_id",id).order("awarded_on",{ascending:false}).limit(60),
     canManage?client.from("family_monthly_reports").select("id,review_month").eq("player_id",id).order("review_month",{ascending:false}).limit(60):Promise.resolve({data:[] as PublishedReport[],error:null})
    ]);
    if(!alive)return;
    const keys:Dataset[]=["assessments","observations","reviews","roster","attendance","achievements","reports"];
    queries.forEach((q,i)=>{if(q.error)failures.push(keys[i])});
    const ids=queries[3].error?[]:[...new Set((queries[3].data||[]).map(row=>row.session_id))];
    let sessions:LinkedSession[]=[];
    if(ids.length){
     try{
      const result=await client.from("training_sessions").select("id,title,programme,starts_at,ends_at,venue").in("id",ids).is("cancelled_at",null).order("starts_at",{ascending:false}).limit(250);
      if(result.error)failures.push("sessions");else sessions=(result.data||[]) as LinkedSession[];
     }catch{failures.push("sessions");}
    }else if(queries[3].error)failures.push("sessions");
    if(!alive)return;
    setSnapshot({
     assessments:queries[0].error?[]:(queries[0].data||[]) as Assessment[],
     observations:queries[1].error?[]:(queries[1].data||[]) as Observation[],
     reviews:queries[2].error?[]:(queries[2].data||[]) as Review[],
     sessions,
     attendance:queries[4].error?[]:(queries[4].data||[]) as Attendance[],
     achievements:queries[5].error?[]:(queries[5].data||[]) as Achievement[],
     reports:queries[6].error?[]:(queries[6].data||[]) as PublishedReport[],
     errors:failures
    });
   }catch{
    if(alive)setSnapshot({...empty(),errors:["assessments","observations","reviews","roster","attendance","sessions","achievements",...(canManage?["reports" as Dataset]:[])]});
   }finally{if(alive)setLoading(false);}
  })();
  return()=>{alive=false};
 },[client,player.id,canManage,attempt]);
 const unreadable=(...datasets:Dataset[])=>datasets.some(d=>snapshot.errors.includes(d));
 const attendanceSummary=playerAttendanceSummary(snapshot.attendance,snapshot.sessions);
 const marked=attendanceSummary.marked;
 const attended=attendanceSummary.attended;
 const attendanceRate=attendanceSummary.rate;
 const active=goals.filter(g=>g.status==="working_on");
 const now=Date.now();
 const nextSession=nextLinkedSession(snapshot.sessions,now);
 const recentSessions=[...snapshot.sessions].filter(s=>Date.parse(s.starts_at)<=now).sort((a,b)=>b.starts_at.localeCompare(a.starts_at)).slice(0,20);
 const assessmentCategories=[...new Set(snapshot.assessments.map(a=>a.category))];
 const latestDirection=snapshot.observations.find(o=>o.next_action?.trim())?.next_action||snapshot.reviews[0]?.next_steps;
 const showError=(...keys:Dataset[])=>unreadable(...keys)?<p className="staff360-error" role="alert">This information could not be loaded with your current access or connection. Refresh to try again.</p>:null;
 const formatMetric=(value:number|string,missing:boolean)=>missing?"—":value;
 return <section className="staff360" aria-label={"Player 360 workspace for "+name(player)}>
  <header className="staff360-hero">
   <div className="staff360-avatar" aria-hidden="true">{player.first_name.charAt(0)}{player.last_name.charAt(0)}</div>
   <div className="staff360-heading"><span className="staff360-eyebrow">STAR · PLAYER 360°</span><h3>{name(player)}</h3><p>{player.programme} · Coaching development profile</p></div>
   <button type="button" onClick={()=>setAttempt(n=>n+1)} disabled={loading} className="staff360-refresh">{loading?"Refreshing…":"Refresh profile ↻"}</button>
  </header>
  <div className="staff360-tools" aria-label="Player shortcuts">
    {ownerPreview&&<button type="button" onClick={()=>window.location.assign("/staff/player-preview?player="+encodeURIComponent(player.id))}>View as player · Read only ↗</button>}
   {onNote&&<button type="button" onClick={()=>onNote(player.id)}>Add coaching note ↗</button>}
   {onDevelopment&&<button type="button" onClick={()=>onDevelopment(player.id)}>Full development plan ↗</button>}
   {onPositions&&<button type="button" onClick={()=>onPositions(player.id)}>Positions & family view ↗</button>}
  </div>
  <nav className="staff360-tabs" aria-label="Player profile sections">{tabs.map(t=><button key={t.id} type="button" aria-current={tab===t.id?"page":undefined} onClick={()=>setTab(t.id)}>{t.label}</button>)}</nav>
  {loading?<p role="status" className="staff360-loading">Loading this player’s coaching records…</p>:
  <div className="staff360-panel">
  {tab==="overview"&&<section aria-label="Player overview">
   <div className="staff360-metrics">
    <div><strong>{active.length}</strong><span>Active goals</span></div>
    <div><strong>{formatMetric(attendanceRate===null?"—":attendanceRate+"%",unreadable("attendance","roster","sessions"))}</strong><span>Recorded attendance</span></div>
    <div><strong>{formatMetric(assessmentCategories.length,unreadable("assessments"))}</strong><span>IDP categories reviewed</span></div>
    <div><strong>{formatMetric(snapshot.achievements.length,unreadable("achievements"))}</strong><span>Achievements</span></div>
   </div>
   <div className="staff360-columns">
    <article className="staff360-card"><span className="staff360-kicker">NEXT BOOKED SESSION</span>{showError("roster","sessions")}{!unreadable("roster","sessions")&&(nextSession?<><h4>{nextSession.title}</h4><p>{staffDate(nextSession.starts_at)}</p><p>{nextSession.venue||"Venue to be confirmed"}</p>{onOpenSession&&<button onClick={()=>onOpenSession(nextSession.id)}>Open session workspace →</button>}</>:<p>No future session is recorded in this player's linked staff roster.</p>)}</article>
    <article className="staff360-card"><span className="staff360-kicker">CURRENT COACHING FOCUS</span><h4>{active.length?active.length+" development priorities":"Development focus"}</h4>{active.length?<ul>{active.slice(0,3).map(g=><li key={g.id}>{g.goal}</li>)}</ul>:<p>No active goals recorded yet.</p>}{onDevelopment&&<button onClick={()=>onDevelopment(player.id)}>Review full IDP →</button>}</article>
    <article className="staff360-card"><span className="staff360-kicker">LATEST NEXT STEP</span>{showError("observations","reviews")}{!unreadable("observations","reviews")&&<><h4>Coaching direction</h4><p>{latestDirection?summary(latestDirection,330):"No recent next action has been recorded."}</p>{onNote&&<button onClick={()=>onNote(player.id)}>Add observation →</button>}</>}</article>
    <article className="staff360-card"><span className="staff360-kicker">LATEST SESSION</span>{showError("sessions","attendance")}{!unreadable("sessions","attendance")&&(recentSessions[0]?<><h4>{recentSessions[0].title}</h4><p>{date(recentSessions[0].starts_at)}</p><p>Attendance: {statusLabel[snapshot.attendance.find(a=>a.session_id===recentSessions[0].id)?.status||""]||"Not recorded"}</p>{onOpenSession&&<button onClick={()=>onOpenSession(recentSessions[0].id)}>View session →</button>}</>:<p>No earlier sessions linked to the roster.</p>)}</article>
   </div>
  </section>}
  {tab==="development"&&<section aria-label="Player development">
   <div className="staff360-section-head"><div><span className="staff360-kicker">DEVELOPMENT</span><h4>Goals and assessment evidence</h4><p>Set priorities and review progress in one place.</p></div>{onDevelopment&&<button onClick={()=>onDevelopment(player.id)}>Open full IDP ↗</button>}</div>
   {developmentControls}
   <div className="staff360-card"><h4>Recent IDP assessments</h4>{showError("assessments")}{!unreadable("assessments")&&(snapshot.assessments.length?<div className="staff360-records">{snapshot.assessments.slice(0,8).map(a=><article key={a.id}><span className="staff360-kicker">{a.category} · {date(a.assessed_on)} · Rating {a.rating}/5</span><p><strong>Strength:</strong> {a.strength}</p><p><strong>To develop:</strong> {a.development_area}</p><p><strong>Next:</strong> {a.action_plan}</p></article>)}</div>:<p>No IDP assessment recorded yet. Open the full IDP to complete one.</p>)}</div>
  </section>}
  {tab==="sessions"&&<section aria-label="Player sessions and attendance">
   <div className="staff360-section-head"><div><span className="staff360-kicker">TRAINING HISTORY</span><h4>Sessions and attendance</h4><p>Sessions are linked through the player's actual training roster, not programme similarity.</p></div></div>
   {showError("roster","sessions","attendance")}
   {!unreadable("roster","sessions","attendance")&&<>
    <div className="staff360-metrics"><div><strong>{snapshot.sessions.length}</strong><span>Linked sessions</span></div><div><strong>{marked}</strong><span>Attendance marks</span></div><div><strong>{attended}</strong><span>Present or late</span></div><div><strong>{attendanceRate===null?"—":attendanceRate+"%"}</strong><span>Recorded attendance</span></div></div>
    <p className="staff360-help">Attendance percentage counts present or late versus present, late or absent. Excused, unmarked and cancelled sessions are excluded. Records are limited to linked sessions.</p>
    {snapshot.sessions.length?<div className="staff360-records">{snapshot.sessions.slice(0,24).map(s=><article key={s.id}><div className="staff360-record-title"><div><strong>{s.title}</strong><small>{staffDate(s.starts_at)} · {s.venue||"Location pending"}</small></div><span className="staff360-status">{Date.parse(s.ends_at)>now?"Upcoming":statusLabel[snapshot.attendance.find(a=>a.session_id===s.id)?.status||""]||"Unmarked"}</span></div>{onOpenSession&&<button onClick={()=>onOpenSession(s.id)}>Open session →</button>}</article>)}</div>:<p className="staff360-empty">No sessions are linked to this player's staff roster yet.</p>}
   </>}
  </section>}
  {tab==="coaching"&&<section aria-label="Player coaching records">
   <div className="staff360-section-head"><div><span className="staff360-kicker">COACHING RECORDS</span><h4>Observations and reviews</h4><p>Internal development records. Use STAR's confidential process for medical or safeguarding matters.</p></div>{onNote&&<button onClick={()=>onNote(player.id)}>Write observation ↗</button>}</div>
   <div className="staff360-columns">
    <article className="staff360-card"><h4>Recent coaching observations</h4>{showError("observations")}{!unreadable("observations")&&(snapshot.observations.length?<div className="staff360-records">{snapshot.observations.slice(0,10).map(o=><article key={o.id}><span className="staff360-kicker">{o.stage} · {o.category} · {date(o.recorded_at)}</span><p>{o.observation}</p>{o.next_action&&<p><strong>Next:</strong> {o.next_action}</p>}</article>)}</div>:<p>No coaching notes have been recorded yet.</p>)}</article>
    <article className="staff360-card"><h4>Monthly reviews</h4>{showError("reviews")}{!unreadable("reviews")&&(snapshot.reviews.length?<div className="staff360-records">{snapshot.reviews.slice(0,8).map(r=><article key={r.id}><span className="staff360-kicker">{date(r.review_month)}</span><p><strong>Strengths:</strong> {r.strengths}</p><p><strong>Develop:</strong> {r.development_areas}</p><p><strong>Next:</strong> {r.next_steps}</p></article>)}</div>:<p>No monthly coaching review recorded yet.</p>)}</article>
   </div>
  </section>}
  {tab==="achievements"&&<section aria-label="Player achievements">
   <div className="staff360-section-head"><div><span className="staff360-kicker">RECOGNITION</span><h4>Achievements and practice</h4><p>Awarded STAR badges and routes to additional player development.</p></div>{onBadge&&<button onClick={()=>onBadge(player.id)}>Award badge ↗</button>}</div>
   {showError("achievements")}{!unreadable("achievements")&&(snapshot.achievements.length?<div className="staff360-achievements">{snapshot.achievements.slice(0,24).map(a=><article key={a.id}><span aria-hidden="true">★</span><div><strong>{a.title}</strong><small>Awarded {date(a.awarded_on)}</small><p>{a.description}</p></div></article>)}</div>:<p className="staff360-empty">No achievement badges have been awarded yet.</p>)}
   <div className="staff360-tools">{onTrainingHub&&<button onClick={()=>onTrainingHub(player.id)}>Player training ↗</button>}{onPlayerSpace&&<button onClick={()=>onPlayerSpace(player.id)}>Player Space coaching ↗</button>}</div>
  </section>}
  {canManage&&tab==="family"&&<section aria-label="Family communication and publishing">
   <div className="staff360-section-head"><div><span className="staff360-kicker">MANAGER ACCESS ONLY</span><h4>Family communication and approved sharing</h4><p>Use the established family tools to review messages and explicitly publish approved information.</p></div></div>
   <p className="staff360-help">This profile does not expose emergency contacts, medical details or safeguarding records. Internal coaching observations are not automatically shared with guardians.</p>
   <div className="staff360-columns">
    <article className="staff360-card"><h4>Parent & guardian messages</h4><p>Open the protected family inbox for this player. Conversations remain in STAR’s existing messaging system.</p>{onFamilyInbox&&<button onClick={()=>onFamilyInbox(player.id)}>Open family inbox ↗</button>}</article>
    <article className="staff360-card"><h4>Development reports shared</h4>{showError("reports")}{!unreadable("reports")&&<p>{snapshot.reports.length} published monthly reports visible to your manager account.</p>}{onShareWithFamily&&<button onClick={()=>onShareWithFamily(player.id)}>Review family publishing ↗</button>}</article>
   </div>
  </section>}
  </div>}
  <footer className="staff360-footnote">Private coaching workspace · Access is governed by STAR staff roles, player assignments and database policies.</footer>
 </section>;
}
