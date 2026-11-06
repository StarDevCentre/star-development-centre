"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {createRequestSequence} from "../lib/staffRequestSequence";
import {sessionFlowCounts} from "../lib/staffSessionFlow";
import {SessionPreparation,SessionCoachingNotes,SessionWrapUp} from "./StaffSessionFlow";
import type {SupabaseClient} from "@supabase/supabase-js";
import {supabaseBrowser} from "../lib/supabaseBrowser";
type Player={id:string;first_name:string;last_name:string;programme:string};
type Session={id:string;title:string;starts_at:string;ends_at:string;venue:string;programme:string};
type Attendance={session_id:string;player_id:string;status:string};
const statuses=["present","absent","late","excused"] as const;
type Status=typeof statuses[number];
const labels:Record<Status,string>={present:"Present",absent:"Absent",late:"Late",excused:"Excused"};
export function SessionAttendance({userId,onCoachPlayer,onPlayerDevelopment,onSessionChange,onReturnToCalendar,onOpenPlan,initialSessionId="",client=supabaseBrowser}:{client?:SupabaseClient|null;userId:string;onCoachPlayer?:(playerId:string,sessionId:string)=>void;onPlayerDevelopment?:(playerId:string)=>void;onSessionChange?:(sessionId:string)=>void;onReturnToCalendar?:()=>void;onOpenPlan?:(planId?:string)=>void;initialSessionId?:string}){
 const db=client;
 const loadSequence=useRef(createRequestSequence());
 const selectedSessionRef=useRef(initialSessionId);
 const [sessions,setSessions]=useState<Session[]>([]),[players,setPlayers]=useState<Player[]>([]),[records,setRecords]=useState<Attendance[]>([]),[sessionId,setSessionId]=useState(initialSessionId),[message,setMessage]=useState(""),[busyId,setBusyId]=useState(""),[loading,setLoading]=useState(true),[search,setSearch]=useState("");
 const [workspaceTab,setWorkspaceTab]=useState<"overview"|"attendance"|"coaching"|"wrapup">("overview");
 const [onlyUnmarked,setOnlyUnmarked]=useState(false);const [participants,setParticipants]=useState<{session_id:string;player_id:string}[]>([]),[adding,setAdding]=useState(""),[history,setHistory]=useState(false),[page,setPage]=useState(0),[hasMore,setHasMore]=useState(false);
 const refresh=useCallback(async()=>{
  const request=loadSequence.current.next();
  if(!db){
   if(loadSequence.current.isCurrent(request)){
    setMessage("Session connection unavailable. Refresh or sign in again.");
    setLoading(false);
   }
   return;
  }
  setLoading(true);
  try{
   const now=new Date().toISOString();
   let sessionQuery=db.from("training_sessions")
    .select("id,title,starts_at,ends_at,venue,programme").is("cancelled_at",null);
   sessionQuery=history?sessionQuery.lt("ends_at",now):sessionQuery.gte("ends_at",now);
   const [a,b,c,d]=await Promise.all([
    sessionQuery.order("starts_at",{ascending:!history}).order("id").range(page*30,page*30+30),
    db.from("coaching_players").select("id,first_name,last_name,programme").order("first_name"),
    sessionId?db.from("training_attendance").select("session_id,player_id,status").eq("session_id",sessionId):Promise.resolve({data:[],error:null}),
    sessionId?db.from("training_session_participants").select("session_id,player_id").eq("session_id",sessionId):Promise.resolve({data:[],error:null})
   ]);
   if(!loadSequence.current.isCurrent(request))return;
   if(a.error||b.error||c.error||d.error){
    setMessage("Unable to load attendance records. Check staff access or try again.");
    setSessions([]);setPlayers([]);setRecords([]);setParticipants([]);
    return;
   }
   setHasMore((a.data?.length||0)>30);
   let list=(a.data?.slice(0,30)||[]) as Session[];
   if(sessionId&&!list.some(s=>s.id===sessionId)){
    const target=await db.from("training_sessions")
     .select("id,title,starts_at,ends_at,venue,programme")
     .is("cancelled_at",null).eq("id",sessionId).maybeSingle();
    if(!loadSequence.current.isCurrent(request))return;
    if(target.error)throw target.error;
    if(target.data)list=[target.data,...list];
   }
   if(!loadSequence.current.isCurrent(request))return;
   setSessions(list);
   setPlayers((b.data||[]) as Player[]);
   setRecords((c.data||[]) as Attendance[]);
   setParticipants(d.data||[]);
  }catch{
   if(loadSequence.current.isCurrent(request)){
    setMessage("Unable to refresh this session. Check your connection and try again.");
    setSessions([]);setPlayers([]);setRecords([]);setParticipants([]);
   }
  }finally{
   if(loadSequence.current.isCurrent(request))setLoading(false);
  }
 },[db,sessionId,history,page]);
 useEffect(()=>{void refresh();return()=>{loadSequence.current.invalidate();}},[refresh]);
 useEffect(()=>{if(initialSessionId){selectedSessionRef.current=initialSessionId;setSessionId(initialSessionId)}},[initialSessionId]);
 async function record(playerId:string,status:Status){
  if(!db||!sessionId||busyId)return;
  const selectedAtStart=sessionId;
  setBusyId(playerId);setMessage("");
  const previous=records.find(r=>r.session_id===selectedAtStart&&r.player_id===playerId);
  setRecords(old=>[...old.filter(r=>!(r.session_id===selectedAtStart&&r.player_id===playerId)),{session_id:selectedAtStart,player_id:playerId,status}]);
  try{
   const {data:saved,error}=await db.from("training_attendance")
    .upsert({session_id:selectedAtStart,player_id:playerId,status,recorded_by:userId,recorded_at:new Date().toISOString()},{onConflict:"session_id,player_id"}).select("session_id");
   if(selectedSessionRef.current!==selectedAtStart)return;
   if(error||!saved?.length){
    setRecords(old=>[...old.filter(r=>!(r.session_id===selectedAtStart&&r.player_id===playerId)),...(previous?[previous]:[])]);
    setMessage("Attendance not saved: "+(error?.message||"No record was changed. Refresh and retry."));
   }else setMessage("Attendance saved.");
  }catch{
   if(selectedSessionRef.current===selectedAtStart){
    setRecords(old=>[...old.filter(r=>!(r.session_id===selectedAtStart&&r.player_id===playerId)),...(previous?[previous]:[])]);
    setMessage("Attendance not saved. Check your connection and retry.");
   }
  }finally{setBusyId("");}
 }
 async function changeRoster(playerId:string,remove=false){
  if(!db||!sessionId||busyId)return;
  if(remove&&!window.confirm("Remove this player from the session roster? Shared bookings must be removed first; attendance history is retained."))return;
  const selectedAtStart=sessionId;
  setBusyId(playerId);
  try{
   const result=remove?await db.from("training_session_participants").delete().eq("session_id",selectedAtStart).eq("player_id",playerId).select("player_id"):
    await db.from("training_session_participants").insert({session_id:selectedAtStart,player_id:playerId,added_by:userId}).select("player_id");
   if(selectedSessionRef.current!==selectedAtStart)return;
   if(result.error||!result.data?.length)setMessage(result.error?.message||"Roster was not changed. Refresh and try again.");
   else{
    setMessage(remove?"Player removed from roster.":"Player added to this session. Share the booking separately when ready.");
    setAdding("");
    await refresh();
   }
  }catch{if(selectedSessionRef.current===selectedAtStart)setMessage("Roster was not changed. Check your connection and try again.");}
  finally{setBusyId("");}
 }
 const selected=sessions.find(s=>s.id===sessionId);
 const roster=players.filter(p=>participants.some(r=>r.session_id===sessionId&&r.player_id===p.id));
 const sessionRecords=records.filter(r=>r.session_id===sessionId);
 const counts=sessionFlowCounts(roster.map(p=>p.id),sessionRecords);
 const visible=roster.filter(p=>(p.first_name+" "+p.last_name).toLowerCase().includes(search.toLowerCase())&&(!onlyUnmarked||!sessionRecords.some(r=>r.player_id===p.id&&statuses.includes(r.status as Status))));

 return <section className="star-training star-attendance-workflow"><span className="kicker">SESSION WORKSPACE</span><h3>Coach the full session</h3><p>Prepare, record attendance, capture coaching observations and review the session in one workspace. Records are saved using STAR’s existing staff permissions.</p>{message&&<p role="alert">{message}</p>}
 <div className="star-session-actions"><button aria-pressed={!history} onClick={()=>{setHistory(false);setPage(0)}}>Upcoming</button><button aria-pressed={history} onClick={()=>{setHistory(true);setPage(0)}}>History</button><button disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Previous dates</button><button disabled={!hasMore||loading} onClick={()=>setPage(p=>p+1)}>More dates</button></div><label className="star-attendance-select">Training session<select value={sessionId} onChange={e=>{selectedSessionRef.current=e.target.value;setSessionId(e.target.value);setWorkspaceTab("overview");onSessionChange?.(e.target.value);setSearch("");setOnlyUnmarked(false);setMessage("")}}><option value="">Select a session…</option>{sessions.map(s=><option key={s.id} value={s.id}>{new Date(s.starts_at).toLocaleDateString("en-GB",{timeZone:"Europe/London"})} · {s.title}</option>)}</select></label>
 {loading?<p>Loading attendance…</p>:selected?<><div className="star-workflow-session"><div><span className="kicker">{selected.programme}</span><h4>{selected.title}</h4><p>{new Date(selected.starts_at).toLocaleString("en-GB",{dateStyle:"full",timeStyle:"short",timeZone:"Europe/London"})}</p></div><div className="star-workflow-total"><strong>{roster.length-counts.unmarked}/{roster.length}</strong><span>Marked</span></div></div>

 <div className="star-flow-session-progress"><span>Session progress · <strong>{counts.marked}/{counts.total}</strong> attendance marks saved</span><span>{!counts.total?'Check roster':counts.ready?'Register checked':counts.unmarked+' to mark'}</span></div>
 <nav className="star-flow-steps" aria-label="Session workflow">
  {([{id:"overview",label:"Prepare"},{id:"attendance",label:"Attendance"},{id:"coaching",label:"Coaching"},{id:"wrapup",label:"Review"}] as const).map((step,i)=><button key={step.id} type="button" aria-current={workspaceTab===step.id?"step":undefined} disabled={!!busyId||loading} onClick={()=>setWorkspaceTab(step.id)}><span className="star-flow-step-number">{i+1}</span><span>{step.label}</span></button>)}
 </nav>

 {workspaceTab==="overview"&&<SessionPreparation client={db} session={selected} roster={roster} counts={counts} userId={userId} onGoToAttendance={()=>setWorkspaceTab("attendance")} onGoToCoaching={()=>setWorkspaceTab("coaching")} onOpenPlan={onOpenPlan} onPlayerDevelopment={onPlayerDevelopment}/>}
 {workspaceTab==="attendance"&&<div className="star-workflow-attendance-tab" role="tabpanel" aria-label="Session attendance">
 <div className="star-workflow-progress" role="progressbar" aria-label="Attendance completion" aria-valuemin={0} aria-valuemax={roster.length||1} aria-valuenow={roster.length-counts.unmarked}><span style={{width:`${roster.length?(roster.length-counts.unmarked)/roster.length*100:0}%`}}/></div><div className="star-workflow-stats">{(["present","absent","late","excused","unmarked"] as const).map(s=><div key={s} className={"star-workflow-stat "+s}><strong>{counts[s]}</strong><span>{s==="unmarked"?"Not marked":labels[s]}</span></div>)}</div>
 <div className="star-workflow-quickbar"><strong>{counts.ready?"Attendance complete":`${counts.unmarked} still to mark`}</strong><button type="button" aria-pressed={onlyUnmarked} onClick={()=>setOnlyUnmarked(v=>!v)}>{onlyUnmarked?"Show all players":"Show unmarked only"}</button></div><label className="star-workflow-search">Find player<input type="search" placeholder="Search this session's players…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <details className="star-hub-panel"><summary>Manage booked players ({roster.length})</summary><p>Only the players added here appear in attendance. This does not publish a family booking.</p><label>Add player<select value={adding} onChange={e=>setAdding(e.target.value)}><option value="">Choose an authorised player…</option>{players.filter(p=>!roster.some(r=>r.id===p.id)).sort((a,b)=>Number(b.programme===selected.programme)-Number(a.programme===selected.programme)).map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name} · {p.programme}{p.programme===selected.programme?" · suggested":""}</option>)}</select></label><button disabled={!!busyId||!adding} onClick={()=>void changeRoster(adding)}>Add to session</button>{roster.map(p=><p key={p.id}>{p.first_name} {p.last_name} <button disabled={!!busyId} onClick={()=>void changeRoster(p.id,true)}>Remove from roster</button></p>)}</details><div className="star-workflow-roster">{roster.length===0?<p>No players booked into this session yet. Add participants below; programme membership only suggests players.</p>:visible.length===0?<p>{onlyUnmarked?"No unmarked players match. Show all players to review attendance.":"No matching players."}</p>:visible.map(p=>{const current=sessionRecords.find(r=>r.player_id===p.id);return <article key={p.id} className="star-workflow-player"><div className="star-workflow-player-head"><div><h5>{p.first_name} {p.last_name}</h5><span className={"star-workflow-status "+(current?.status||"unmarked")}>{current?.status&&statuses.includes(current.status as Status)?labels[current.status as Status]:"Not marked"}</span></div><div>{onCoachPlayer&&<button type="button" className="star-workflow-coach" onClick={()=>onCoachPlayer(p.id,sessionId)}>Add coaching note →</button>}{onPlayerDevelopment&&<button type="button" className="star-workflow-coach" onClick={()=>onPlayerDevelopment(p.id)}>Development plan →</button>}</div></div><div className="star-workflow-options" role="group" aria-label={"Attendance for "+p.first_name+" "+p.last_name}>{statuses.map(st=><button key={st} type="button" disabled={!!busyId} aria-pressed={current?.status===st} className={current?.status===st?"selected "+st:""} onClick={()=>void record(p.id,st)}>{labels[st]}</button>)}</div></article>})}</div>
 <div className="star-flow-footer-actions"><button type="button" className="star-flow-secondary" disabled={!!busyId||!counts.ready} onClick={()=>setWorkspaceTab("coaching")}>{!counts.total?"Add players to continue":counts.unmarked?"Mark remaining players to continue":"Continue to coaching notes →"}</button><button type="button" className="star-flow-secondary" disabled={!!busyId} onClick={()=>setWorkspaceTab("wrapup")}>Review register →</button></div>
 </div>}
 {workspaceTab==="coaching"&&<SessionCoachingNotes client={db} session={selected} roster={roster} userId={userId} onGoToWrapUp={()=>setWorkspaceTab("wrapup")} onCoachPlayer={onCoachPlayer} onPlayerDevelopment={onPlayerDevelopment}/>}
 {workspaceTab==="wrapup"&&<SessionWrapUp client={db} session={selected} roster={roster} counts={counts} busy={!!busyId} onGoToAttendance={()=>setWorkspaceTab("attendance")} onGoToCoaching={()=>setWorkspaceTab("coaching")} onReturnToCalendar={onReturnToCalendar}/>}

 </>:<div className="star-workflow-empty"><h4>Ready for your next session?</h4><p>Select a training session above to start marking attendance and recording coaching progress.</p></div>}</section>
}
