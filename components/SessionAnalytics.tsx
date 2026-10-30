"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import {attendanceSummary,ukDate} from "../lib/sessionOperations";
type Player={id:string;programme:string};
type Session={id:string;title:string;programme:string;starts_at:string};
type Attendance={session_id:string;player_id:string;status:string};
type Assessment={player_id:string;assessed_on:string;category:string};
type Observation={player_id:string;recorded_at:string;recorded_by:string};
type Goal={player_id:string;status:string};
const categories=["Technical","Tactical","Physical","Psychological","Social"];
const pct=(a:number,b:number)=>b?Math.round(100*a/b)+"%":"—";
export function SessionAnalytics(){
 const db=useMemo(()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k):null},[]);
 const [players,setPlayers]=useState<Player[]>([]),[sessions,setSessions]=useState<Session[]>([]),[attendance,setAttendance]=useState<Attendance[]>([]),[assessments,setAssessments]=useState<Assessment[]>([]),[observations,setObservations]=useState<Observation[]>([]),[goals,setGoals]=useState<Goal[]>([]);
 const [participants,setParticipants]=useState<{session_id:string;player_id:string}[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[programme,setProgramme]=useState("all"),[days,setDays]=useState("90");
 useEffect(()=>{if(!db){setError("Analytics unavailable.");setLoading(false);return}let active=true;(async()=>{const results=await Promise.all([db.from("coaching_players").select("id,programme").limit(1000),db.from("training_sessions").select("id,title,programme,starts_at").order("starts_at",{ascending:false}).limit(1000),db.from("training_attendance").select("session_id,player_id,status").limit(5000),db.from("coaching_idp_assessments").select("player_id,assessed_on,category").limit(5000),db.from("coaching_observations").select("player_id,recorded_at,recorded_by").limit(5000),db.from("coaching_development_goals").select("player_id,status").limit(5000),db.from("training_session_participants").select("session_id,player_id").limit(5000)]);if(!active)return;if(results.some(r=>r.error)){setError("Unable to load analytics. Check your staff access and try again.")}else{setPlayers(results[0].data||[]);setSessions(results[1].data||[]);setAttendance(results[2].data||[]);setAssessments(results[3].data||[]);setObservations(results[4].data||[]);setGoals(results[5].data||[]);setParticipants(results[6].data||[])}setLoading(false)})();return()=>{active=false}},[db]);
 const programmes=[...new Set(players.map(p=>p.programme).filter(Boolean))].sort();
 const cutoff=Date.now()-Number(days)*86400000;
 const scopedPlayers=players.filter(p=>programme==="all"||p.programme===programme);
 const ids=new Set(scopedPlayers.map(p=>p.id));
 const scopedSessions=sessions.filter(s=>Date.parse(s.starts_at)>=cutoff&&Date.parse(s.starts_at)<=Date.now()&&(programme==="all"||s.programme===programme));
 const sessionIds=new Set(scopedSessions.map(s=>s.id));
 const marks=attendance.filter(a=>sessionIds.has(a.session_id)&&ids.has(a.player_id));
 const summary=attendanceSummary(marks,participants.filter(p=>sessionIds.has(p.session_id)&&ids.has(p.player_id)).length);const present=summary.attended,absent=summary.absent;
 const scopedAssessments=assessments.filter(a=>ids.has(a.player_id)&&Date.parse(a.assessed_on+"T12:00:00")>=cutoff);
 const scopedObservations=observations.filter(o=>ids.has(o.player_id)&&Date.parse(o.recorded_at)>=cutoff);
 const scopedGoals=goals.filter(g=>ids.has(g.player_id));
 const assessedPlayers=new Set(scopedAssessments.map(a=>a.player_id)).size;
 const observedPlayers=new Set(scopedObservations.map(o=>o.player_id)).size;
 const byCategory=categories.map(cat=>({cat,count:new Set(scopedAssessments.filter(a=>a.category===cat).map(a=>a.player_id)).size}));
 const bySession=scopedSessions.slice(0,12).map(s=>{const m=marks.filter(a=>a.session_id===s.id);return {id:s.id,title:s.title,date:s.starts_at,present:attendanceSummary(m).attended,marked:attendanceSummary(m).eligible,unmarked:attendanceSummary(m,participants.filter(p=>p.session_id===s.id&&ids.has(p.player_id)).length).unmarked}});
 const coachCounts=Object.entries(scopedObservations.reduce<Record<string,number>>((acc,o)=>{acc[o.recorded_by]=(acc[o.recorded_by]||0)+1;return acc},{})).map(([id,count])=>({id,count})).sort((a,b)=>b.count-a.count);
 return <section className="star-analytics" aria-label="STAR session and coaching analytics"><h3>Session & coaching analytics</h3><p>Understand attendance, recording activity and assessment coverage across STAR. Counts reflect records currently available to your staff account, not independent measures of coaching quality.</p>
 <div className="star-analytics-filters"><label>Programme<select value={programme} onChange={e=>setProgramme(e.target.value)}><option value="all">All programmes</option>{programmes.map(p=><option key={p} value={p}>{p}</option>)}</select></label><label>Reporting period<select value={days} onChange={e=>setDays(e.target.value)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="180">Last 180 days</option><option value="365">Last 12 months</option></select></label></div>
 {loading?<p role="status">Loading analytics…</p>:error?<p role="alert">{error}</p>:<><div className="star-analytics-metrics"><div><strong>{scopedSessions.length}</strong><span>Sessions scheduled</span></div><div><strong>{pct(present,present+absent)}</strong><span>Attendance (present + late / present + late + absent)</span></div><div><strong>{pct(assessedPlayers,scopedPlayers.length)}</strong><span>Players assessed in period</span></div><div><strong>{pct(observedPlayers,scopedPlayers.length)}</strong><span>Players with coaching notes</span></div></div>
 <p>Present: {summary.present} · Late: {summary.late} · Absent: {summary.absent} · Excused: {summary.excused} · Unmarked: {summary.unmarked}.</p><div className="star-analytics-grid"><section className="star-hub-panel"><h4>Recent session attendance</h4>{bySession.length?bySession.map(s=><div key={s.id} className="star-analytics-item"><div><strong>{s.title}</strong><small>{ukDate(s.date)}</small></div><span>{s.marked?pct(s.present,s.marked):"No marks"} <small>({s.present}/{s.marked}; {s.unmarked} unmarked)</small></span></div>):<p>No sessions recorded for this period.</p>}<p className="star-hub-hint">Late arrivals count as attended, consistently with ball rewards. Excused and unmarked players are excluded from the percentage.</p></section>
 <section className="star-hub-panel"><h4>Development assessment coverage</h4>{byCategory.map(x=><div key={x.cat} className="star-analytics-coverage"><div><strong>{x.cat}</strong><span>{x.count}/{scopedPlayers.length} players</span></div><div className="star-family-progress-track"><div style={{width:scopedPlayers.length?x.count/scopedPlayers.length*100+"%":"0%"}}/></div></div>)}<p className="star-hub-hint">Coverage counts players with at least one assessment in the selected period, not assessment scores.</p></section>
 <section className="star-hub-panel"><h4>Development goals</h4><p><strong>{scopedGoals.filter(g=>g.status==="achieved").length}</strong> achieved · <strong>{scopedGoals.filter(g=>g.status!=="achieved").length}</strong> still in progress</p><p className="star-hub-hint">Goal statuses are current totals for selected players, not goals completed during the reporting period.</p></section>
 <section className="star-hub-panel"><h4>Coaching activity</h4><p><strong>{scopedObservations.length}</strong> observations recorded across <strong>{observedPlayers}</strong> players in this period.</p><p><strong>{coachCounts.length}</strong> staff contributors recorded observations.</p><p className="star-hub-hint">Observation counts show documentation activity, not individual coach performance. Records can be incomplete.</p></section></div>
 <p className="star-hub-hint">Programme filters use the player's current programme and session programme. Attendance figures may be incomplete if records are missing. Data loads are capped at 1,000 players/sessions and 5,000 records per dataset; large datasets need server-side aggregation.</p></>}
 </section>
}
