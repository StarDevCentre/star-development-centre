"use client";
import {useEffect,useMemo,useState} from "react";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";
import {ukDate} from "../lib/sessionOperations";
import {emptyAnalytics,staffAnalyticsSnapshot,assessmentCategories,percentage,type AnalyticsData,type AnalyticsPlayer,type AnalyticsSession,type AnalyticsRoster,type AnalyticsAttendance,type AnalyticsAssessment,type AnalyticsObservation,type AnalyticsGoal} from "../lib/staffAnalytics";
import "./staff-analytics-polish.css";
const RANGE=[30,90,180,365] as const;
export function SessionAnalytics({active=true}:{active?:boolean}){
 const [data,setData]=useState<AnalyticsData>(emptyAnalytics);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[programme,setProgramme]=useState("all"),[days,setDays]=useState(90),[revision,setRevision]=useState(0),[loadedAt,setLoadedAt]=useState<number|null>(null),[truncated,setTruncated]=useState(false);
 useEffect(()=>{
  if(!active)return;
  let live=true;
  const load=async()=>{
   setLoading(true);setError("");setTruncated(false);setLoadedAt(null);setData(emptyAnalytics());
   if(!db){setError("Staff analytics are unavailable. Sign in again and retry.");setLoading(false);return;}
   try{
    const now=new Date(),since=new Date(now.getTime()-days*86400000);
    const lower=since.toISOString(),upper=now.toISOString();
    const source=await Promise.all([
     db.from("coaching_players").select("id,programme").order("id").limit(1001),
     db.from("training_sessions").select("id,title,programme,starts_at")
      .is("cancelled_at",null).gte("starts_at",lower).lte("starts_at",upper)
      .order("starts_at",{ascending:false}).limit(1001),
     db.from("coaching_idp_assessments").select("player_id,assessed_on,category")
      .gte("assessed_on",lower.slice(0,10)).lte("assessed_on",upper.slice(0,10)).limit(1001),
     db.from("coaching_observations").select("player_id,recorded_at,recorded_by")
      .gte("recorded_at",lower).lte("recorded_at",upper).limit(1001),
     db.from("coaching_development_goals").select("player_id,status").limit(1001)
    ]);
    if(!live)return;
    if(source.some(r=>r.error))throw Error("One or more reporting datasets could not be read with your staff access.");
    const sessions=(source[1].data||[]) as AnalyticsSession[];
    const ids=sessions.map(s=>s.id);
    const chunks:string[][]=[];
    for(let i=0;i<ids.length;i+=100)chunks.push(ids.slice(i,i+100));
    const rosterResults=await Promise.all(chunks.map(ids=>db!.from("training_session_participants")
     .select("session_id,player_id").in("session_id",ids).limit(1001)));
    if(!live)return;
    if(rosterResults.some(r=>r.error))throw Error("Session rosters could not be read.");
    const attendanceResults=await Promise.all(chunks.map(ids=>db!.from("training_attendance")
     .select("session_id,player_id,status").in("session_id",ids).limit(1001)));
    if(!live)return;
    if(attendanceResults.some(r=>r.error))throw Error("Attendance could not be read.");
    const cap=source.some((r,i)=>(r.data||[]).length >= 1000)||
     [...rosterResults,...attendanceResults].some(r=>(r.data||[]).length>=1000);
    setTruncated(cap);
    setData({
     players:(source[0].data||[]) as AnalyticsPlayer[],
     sessions,
     assessments:(source[2].data||[]) as AnalyticsAssessment[],
     observations:(source[3].data||[]) as AnalyticsObservation[],
     goals:(source[4].data||[]) as AnalyticsGoal[],
     participants:rosterResults.flatMap(r=>(r.data||[]) as AnalyticsRoster[]),
     attendance:attendanceResults.flatMap(r=>(r.data||[]) as AnalyticsAttendance[])
    });
    setLoadedAt(Date.now());
   }catch(e){
    if(live){setData(emptyAnalytics());setLoadedAt(null);setError(e instanceof Error?e.message:"Unable to load analytics. Check your connection and try again.");}
   }finally{if(live)setLoading(false);}
  };
  void load();
  return()=>{live=false;};
 },[active,days,revision]);
 const now=loadedAt||Date.now();
 const summary=useMemo(()=>staffAnalyticsSnapshot(data,{programme,days,now}),[data,programme,days,now]);
 const programmes=[...new Set(data.players.map(p=>p.programme).filter(Boolean))].sort();
 const reportCount=summary.scopedPlayers.length;
 return <section className="star-analytics staff-analytics-v2" aria-label="STAR coaching and attendance analytics" aria-busy={loading}>
  <header className="staff-analytics-header"><div><span className="kicker">STAR · OPERATIONS REPORTING</span><h3>Session & coaching analytics</h3><p>Track booked places, recorded attendance and the coverage of coaching development work. This is operational evidence, not a judgement of individual coaches.</p></div>
   <button type="button" onClick={()=>setRevision(n=>n+1)} disabled={loading}>{loading?"Refreshing…":"Refresh report ↻"}</button>
  </header>
  <div className="star-analytics-filters">
   <label htmlFor="staff-analytics-programme">Programme
    <select id="staff-analytics-programme" value={programme} onChange={e=>setProgramme(e.target.value)} disabled={loading}>
     <option value="all">All programmes</option>{programmes.map(p=><option key={p} value={p}>{p}</option>)}
    </select>
   </label>
   <label htmlFor="staff-analytics-period">Reporting period
    <select id="staff-analytics-period" value={days} onChange={e=>setDays(Number(e.target.value))} disabled={loading}>
     {RANGE.map(n=><option key={n} value={n}>{n===365?"Last 12 months":"Last "+n+" days"}</option>)}
    </select>
   </label>
  </div>
  {loading?<p role="status" className="staff-analytics-feedback">Loading records for the selected period…</p>:error?<p role="alert" className="staff-analytics-error">{error} <button type="button" onClick={()=>setRevision(n=>n+1)}>Try again</button></p>:<>
   <p className="staff-analytics-caption" role="status">Showing the last {days===365?"12 months":days+" days"} · {reportCount} visible player{reportCount===1?"":"s"} · Last refreshed {loadedAt?new Date(loadedAt).toLocaleTimeString("en-GB",{timeZone:"Europe/London",hour:"2-digit",minute:"2-digit"}):"—"} UK</p>
   {truncated&&<p role="alert" className="staff-analytics-error">Reporting data reached a query limit. Counts may be incomplete; narrow the reporting period or use a server-side aggregate report.</p>}
   <div className="star-analytics-metrics" aria-label="Report key metrics">
    <div><strong>{summary.sessions.length}</strong><span>Completed-period sessions scheduled (cancelled excluded)</span></div>
    <div><strong>{summary.attendedPercentage}</strong><span>Attendance: present or late, excluding excused and unmarked</span></div>
    <div><strong>{summary.registerCoverage}</strong><span>Register completion: marked booked places / all roster places</span></div>
    <div><strong>{percentage(summary.assessedPlayers,reportCount)}</strong><span>Visible players with an IDP assessment in period</span></div>
   </div>
   <div className="staff-analytics-register-status">
    <strong>{summary.unmarked?summary.unmarked+" booked place"+(summary.unmarked===1?"":"s")+" still unmarked":"Attendance registers checked for the selected period"}</strong>
    <p>{summary.rosterPlaces} linked roster place{summary.rosterPlaces===1?"":"s"} · {summary.recorded} marked · {summary.summary.present} present · {summary.summary.late} late · {summary.summary.absent} absent · {summary.summary.excused} excused.</p>
    {summary.unmarked>0&&<p>Open a session in the calendar to finish its attendance register. Missing marks are not treated as absences.</p>}
   </div>
   <div className="star-analytics-grid">
    <section className="star-hub-panel" aria-label="Recent session attendance"><h4>Recent session attendance</h4>
     {summary.bySession.length?summary.bySession.map(s=><div key={s.id} className="star-analytics-item"><div><strong>{s.title}</strong><small>{ukDate(s.date)}</small></div><span><strong>{percentage(s.attended,s.eligible)}</strong> <small>{s.attended}/{s.eligible} eligible · {s.unmarked} unmarked of {s.expected} booked</small></span></div>):<p>No completed-period sessions in this selection.</p>}
     <p className="star-hub-hint">Only players on each session's actual roster are counted. Late counts as attended; excused and unmarked do not lower the attendance rate.</p>
    </section>
    <section className="star-hub-panel" aria-label="Development assessment coverage"><h4>Development assessment coverage</h4>
     {summary.byCategory.map(x=><div key={x.category} className="star-analytics-coverage"><div><strong>{x.category}</strong><span>{x.count} / {reportCount} players</span></div>
      <div className="star-family-progress-track" role="progressbar" aria-label={x.category+" assessment coverage"} aria-valuemin={0} aria-valuemax={reportCount||1} aria-valuenow={x.count} aria-valuetext={x.count+" of "+reportCount+" players assessed"}>
       <div style={{width:reportCount?x.count/reportCount*100+"%":"0%"}}/>
      </div>
     </div>)}
     <p className="star-hub-hint">Assessment coverage counts distinct players per category, not assessment scores.</p>
    </section>
    <section className="star-hub-panel"><h4>Development goals</h4>
     <p><strong>{summary.goals.filter(g=>g.status==="achieved").length}</strong> achieved · <strong>{summary.goals.filter(g=>g.status!=="achieved").length}</strong> still in progress</p>
     <p className="star-hub-hint">Goal statuses are current totals for the selected players; achievements are not limited to the reporting period.</p>
    </section>
    <section className="star-hub-panel"><h4>Coaching documentation</h4>
     <p><strong>{summary.observationsCount}</strong> observations logged for <strong>{summary.observedPlayers}</strong> visible players in this period.</p>
     <p><strong>{summary.coachContributors}</strong> staff contributors recorded observations.</p>
     <p>Player coverage: <strong>{percentage(summary.observedPlayers,reportCount)}</strong></p>
     <p className="star-hub-hint">These counts describe documented coaching activity, not individual staff quality or player progress.</p>
    </section>
   </div>
   <p className="staff-analytics-methodology">Method: cancelled sessions and future appointments are excluded. Attendance is counted only for roster-linked players with a recognised status; duplicate marks are counted once. Programme filters use current player and session programme. This report reflects only records permitted by your staff access. Large datasets may be limited and will show a warning.</p>
  </>}
 </section>;
}
