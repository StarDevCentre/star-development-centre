'use client';
import {useEffect,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {SessionFlowCounts} from '../lib/staffSessionFlow';
import './staff-session-flow.css';

export type SessionFlowPlayer={id:string;first_name:string;last_name:string;programme:string};
export type SessionFlowSession={id:string;title:string;starts_at:string;ends_at:string;venue:string;programme:string};
type Base={client:SupabaseClient|null;session:SessionFlowSession;roster:SessionFlowPlayer[]};
type Goal={id:string;player_id:string;goal:string};
type Plan={id:string;title:string};
type Note={id:string;player_id:string;stage:string;category:string;observation:string;next_action:string|null;recorded_at:string};
const time=(v:string)=>new Date(v).toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'});
const day=(v:string)=>new Date(v).toLocaleDateString('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long'});
const fullName=(p:SessionFlowPlayer)=>[p.first_name,p.last_name].filter(Boolean).join(' ');
const stages=['Observe','Assess','Understand','Plan','Coach','Challenge','Apply','Review','Adapt','Continue'] as const;
const categories=['Technical','Tactical','Physical','Psychological','Social'] as const;

export function SessionPreparation({client,session,roster,userId,counts,onGoToAttendance,onGoToCoaching,onOpenPlan,onPlayerDevelopment}:Base&{
 userId:string;counts:SessionFlowCounts;onGoToAttendance:()=>void;onGoToCoaching:()=>void;onOpenPlan?:(id?:string)=>void;onPlayerDevelopment?:(id:string)=>void;
}){
 const key=roster.map(p=>p.id).sort().join(',');
 const [goals,setGoals]=useState<Goal[]>([]),[plan,setPlan]=useState<Plan|null>(null);
 const [loading,setLoading]=useState(true),[goalError,setGoalError]=useState(''),[planError,setPlanError]=useState('');
 useEffect(()=>{
  let alive=true;setLoading(true);setGoals([]);setPlan(null);setGoalError('');setPlanError('');
  if(!client){setGoalError('Coaching data unavailable.');setLoading(false);return;}
  void (async()=>{
   try{
    const ids=key?key.split(','):[];
    const [g,l]=await Promise.all([
     ids.length?client.from('coaching_development_goals').select('id,player_id,goal').in('player_id',ids).eq('status','working_on').order('created_at',{ascending:false}).limit(100):Promise.resolve({data:[] as Goal[],error:null}),
     client.from('staff_session_plan_links').select('plan_id').eq('created_by',userId).eq('training_session_id',session.id).maybeSingle()
    ]);
    if(!alive)return;
    if(g.error)setGoalError('Player priorities unavailable. Review individual development plans.');
    else setGoals((g.data||[]) as Goal[]);
    if(l.error){setPlanError('Plan link could not be checked.');return;}
    if(l.data?.plan_id){
     const result=await client.from('staff_session_plans').select('id,title').eq('created_by',userId).eq('id',l.data.plan_id).maybeSingle();
     if(!alive)return;
     if(result.error||!result.data)setPlanError('Your linked plan is unavailable.');
     else setPlan(result.data as Plan);
    }
   }catch{if(alive){setGoalError('Player priorities could not be loaded.');setPlanError('Plan could not be checked.');}}
   finally{if(alive)setLoading(false);}
  })();
  return()=>{alive=false;};
 },[client,session.id,key,userId]);
 return <section className="star-workflow-overview star-flow-prepare" aria-label="Prepare for coaching">
  <header className="star-workflow-overview-head"><div><span className="kicker">01 · PREPARE</span><h4>Get ready for kick-off</h4><p>Check the actual booked-player roster and coaching priorities before starting.</p></div><span className="star-workflow-overview-time">{time(session.starts_at)} – {time(session.ends_at)}</span></header>
  <div className="star-workflow-overview-metrics">
   <div><strong>{roster.length}</strong><span>Booked players</span></div><div><strong>{counts.marked}</strong><span>Register marked</span></div><div><strong>{counts.unmarked}</strong><span>To check</span></div><div><strong>{roster.length?Math.round(counts.marked/roster.length*100):0}%</strong><span>Attendance checked</span></div>
  </div>
  <div className="star-flow-prep-grid">
   <div className="star-flow-card"><span className="kicker">SESSION DETAILS</span><h5>{session.title}</h5><p>{day(session.starts_at)} · {session.programme}</p><p><strong>Location:</strong> {session.venue||'Venue not confirmed'}</p><p><strong>Duration:</strong> {Math.max(0,Math.round((Date.parse(session.ends_at)-Date.parse(session.starts_at))/60000))} minutes</p></div>
   <div className="star-flow-card"><span className="kicker">YOUR COACHING PLAN</span><h5>{plan?.title||'Session plan'}</h5>{loading?<p role="status">Checking plan…</p>:planError?<p role="alert">{planError}</p>:<p>{plan?'Your linked session plan is available.':'No personal plan is linked to this session.'}</p>}
    {onOpenPlan&&<button className="star-flow-secondary" type="button" onClick={()=>onOpenPlan(plan?.id)}>{plan?'Open linked plan ↗':'Open Coaching Studio ↗'}</button>}
   </div>
  </div>
  <div className="star-flow-card star-flow-priorities"><div className="star-flow-card-heading"><div><span className="kicker">PLAYER FOCUS</span><h5>Current development goals</h5></div><span className="star-flow-muted">{roster.length} on roster</span></div>
  {!roster.length?<p role="status">No players are linked to this session. Check booked players in Attendance. Programme membership does not create a booking.</p>:loading?<p role="status">Loading player priorities…</p>:<>{goalError&&<p role="alert">{goalError}</p>}
   <div className="star-flow-priority-list">{roster.map(p=>{const active=goals.filter(g=>g.player_id===p.id).slice(0,2);return <div key={p.id} className="star-flow-priority"><div><strong>{fullName(p)}</strong><small>{p.programme}</small></div><div>{goalError?<span className="star-flow-muted">Goals unavailable</span>:active.length?<ul>{active.map(g=><li key={g.id}>{g.goal}</li>)}</ul>:<span className="star-flow-muted">No active goals recorded</span>}{onPlayerDevelopment&&<button className="star-flow-text-button" type="button" onClick={()=>onPlayerDevelopment(p.id)}>Development plan ↗</button>}</div></div>})}</div>
  </>}</div>
  <div className="star-flow-footer-actions"><button type="button" onClick={onGoToAttendance}>Continue to attendance →</button><button type="button" className="star-flow-secondary" onClick={onGoToCoaching}>Coaching notes</button></div>
 </section>;
}

export function SessionCoachingNotes({client,session,roster,userId,onGoToWrapUp,onCoachPlayer,onPlayerDevelopment}:Base&{
 userId:string;onGoToWrapUp:()=>void;onCoachPlayer?:(playerId:string,sessionId:string)=>void;onPlayerDevelopment?:(playerId:string)=>void;
}){
 const key=roster.map(p=>p.id).sort().join(',');
 const [playerId,setPlayerId]=useState(roster[0]?.id||'');
 const [stage,setStage]=useState<typeof stages[number]>('Observe'),[category,setCategory]=useState<typeof categories[number]>('Technical');
 const [observation,setObservation]=useState(''),[nextAction,setNextAction]=useState('');
 const [notes,setNotes]=useState<Note[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>setPlayerId(previous=>roster.some(p=>p.id===previous)?previous:roster[0]?.id||''),[session.id,key]);
 useEffect(()=>{
  let alive=true;setLoading(true);setError('');
  if(!client){setError('Coaching records unavailable.');setLoading(false);return;}
  if(!key){setNotes([]);setLoading(false);return;}
  void (async()=>{
   try{
    const result=await client.from('coaching_observations').select('id,player_id,stage,category,observation,next_action,recorded_at').eq('session_id',session.id).in('player_id',key.split(',')).order('recorded_at',{ascending:false}).limit(100);
    if(!alive)return;
    if(result.error){setError('Session notes could not be loaded. Check staff access.');setNotes([]);}
    else setNotes((result.data||[]) as Note[]);
   }catch{if(alive){setError('Session notes could not be loaded. Check your connection.');setNotes([]);}}
   finally{if(alive)setLoading(false);}
  })();
  return()=>{alive=false;};
 },[client,session.id,key,revision]);
 async function save(e:React.FormEvent){
  e.preventDefault();
  if(!client||saving||!playerId||!roster.some(p=>p.id===playerId)||observation.trim().length<5)return;
  setSaving(true);setMessage('');setError('');
  try{
   const result=await client.from('coaching_observations').insert({player_id:playerId,session_id:session.id,recorded_by:userId,stage,category,observation:observation.trim(),next_action:nextAction.trim()||null});
   if(result.error)throw result.error;
   setObservation('');setNextAction('');setMessage('Coaching observation saved to the player record.');setRevision(n=>n+1);
  }catch(e){setError('Observation not saved: '+(e instanceof Error?e.message:'Check your connection and retry. Your draft is still here.'));}
  finally{setSaving(false);}
 }
 return <section className="star-workflow-coaching-tab star-flow-notes" aria-label="Session coaching notes">
  <header className="star-workflow-overview-head"><div><span className="kicker">03 · COACHING NOTES</span><h4>Capture the coaching</h4><p>Record internal coaching observations directly against this session and player.</p></div></header>
  <p className="star-flow-safety">Record football coaching only. Do not enter medical information, safeguarding disclosures or other sensitive personal details here.</p>
  {message&&<p role="status" className="star-flow-success">{message}</p>}{error&&<p role="alert" className="star-flow-error">{error}</p>}
  {!roster.length?<p role="status">No players are linked to this session. Add the correct players in Attendance before writing notes.</p>:<div className="star-flow-notes-grid">
   <form className="star-flow-note-form" onSubmit={e=>void save(e)}><h5>New observation</h5>
    <label>Player<select value={playerId} disabled={saving} onChange={e=>setPlayerId(e.target.value)}>{roster.map(p=><option key={p.id} value={p.id}>{fullName(p)}</option>)}</select></label>
    <div className="star-flow-form-row"><label>Development stage<select value={stage} disabled={saving} onChange={e=>setStage(e.target.value as typeof stages[number])}>{stages.map(s=><option key={s}>{s}</option>)}</select></label><label>Category<select value={category} disabled={saving} onChange={e=>setCategory(e.target.value as typeof categories[number])}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div>
    <label>What did you observe?<textarea required minLength={5} maxLength={1500} rows={4} value={observation} disabled={saving} onChange={e=>setObservation(e.target.value)} placeholder="Specific football actions and evidence"/></label>
    <label>Next coaching action (optional)<textarea maxLength={500} rows={2} value={nextAction} disabled={saving} onChange={e=>setNextAction(e.target.value)} placeholder="What will she practise next?"/></label>
    <button type="submit" disabled={saving||loading||!playerId||observation.trim().length<5}>{saving?'Saving observation…':'Save observation'}</button><small>Saved to STAR's existing internal coaching record; not published to families.</small>
   </form>
   <div className="star-flow-card"><div className="star-flow-card-heading"><div><span className="kicker">THIS SESSION</span><h5>Recent observations</h5></div><span className="star-flow-muted">{loading?'…':notes.length} shown</span></div>
    {loading?<p role="status">Loading coaching notes…</p>:notes.length?<ul className="star-flow-note-list">{notes.slice(0,12).map(note=><li key={note.id}><strong>{roster.find(p=>p.id===note.player_id)?fullName(roster.find(p=>p.id===note.player_id)!):'Player'}</strong><small>{note.stage} · {note.category} · {new Date(note.recorded_at).toLocaleDateString('en-GB',{timeZone:'Europe/London'})}</small><p>{note.observation}</p>{note.next_action&&<p><b>Next:</b> {note.next_action}</p>}</li>)}</ul>:!error&&<p>No session observations saved yet.</p>}
    <div className="star-flow-note-tools">{onCoachPlayer&&playerId&&<button className="star-flow-secondary" type="button" onClick={()=>onCoachPlayer(playerId,session.id)}>Full coaching records ↗</button>}{onPlayerDevelopment&&playerId&&<button className="star-flow-secondary" type="button" onClick={()=>onPlayerDevelopment(playerId)}>Development plan ↗</button>}</div>
   </div>
  </div>}
  <div className="star-flow-footer-actions"><button type="button" className="star-flow-secondary" disabled={saving} onClick={onGoToWrapUp}>Review session wrap-up →</button></div>
 </section>;
}

export function SessionWrapUp({client,session,roster,counts,onGoToAttendance,onGoToCoaching,onReturnToCalendar,busy}:Base&{
 counts:SessionFlowCounts;onGoToAttendance:()=>void;onGoToCoaching:()=>void;onReturnToCalendar?:()=>void;busy:boolean;
}){
 const key=roster.map(p=>p.id).sort().join(',');
 const [notesCount,setNotesCount]=useState<number|null>(null),[notesError,setNotesError]=useState(false),[notesLoading,setNotesLoading]=useState(true);
 useEffect(()=>{
  let alive=true;setNotesCount(null);setNotesError(false);setNotesLoading(true);
  if(!client){setNotesError(true);setNotesLoading(false);return;}
  if(!key){setNotesCount(0);setNotesLoading(false);return;}
  void (async()=>{
   try{
    const result=await client.from('coaching_observations').select('id',{count:'exact',head:true}).eq('session_id',session.id).in('player_id',key.split(','));
    if(!alive)return;
    if(result.error)setNotesError(true);else setNotesCount(result.count??0);
   }catch{if(alive)setNotesError(true);}
   finally{if(alive)setNotesLoading(false);}
  })();
  return()=>{alive=false;};
 },[client,session.id,key]);
 return <section className="star-workflow-overview star-flow-wrapup" aria-label="Session wrap-up">
  <header className="star-workflow-overview-head"><div><span className="kicker">04 · WRAP-UP</span><h4>Review before leaving</h4><p>Check the saved register and internal observations, then return to the calendar.</p></div></header>
  <div className="star-flow-wrapup-status" data-ready={counts.ready}><strong>{counts.ready?'Attendance checked':'Attention needed'}</strong><p>{!counts.total?'No players on the roster. Check bookings before leaving.':counts.unmarked?counts.unmarked+' of '+counts.total+' players still need an attendance mark.':'All '+counts.total+' players have an attendance status.'}</p></div>
  <div className="star-workflow-overview-metrics"><div><strong>{counts.present}</strong><span>Present</span></div><div><strong>{counts.late}</strong><span>Late</span></div><div><strong>{counts.absent+counts.excused}</strong><span>Absent / excused</span></div><div><strong>{counts.unmarked}</strong><span>Unmarked</span></div></div>
  <div className="star-flow-checks">
   <div><span aria-hidden="true">{roster.length?'✓':'!'}</span><div><strong>Booked-player roster</strong><p>{roster.length?roster.length+' players linked to this session':'No linked players recorded'}</p></div></div>
   <div><span aria-hidden="true">{counts.ready?'✓':'!'}</span><div><strong>Attendance</strong><p>{counts.ready?'All players marked':'Open Attendance to save missing marks'}</p></div></div>
   <div><span aria-hidden="true">○</span><div><strong>Coaching observations (optional)</strong><p>{notesLoading?'Checking saved notes…':notesError?'Saved notes could not be checked.':(notesCount??0)+' internal notes for this session'}</p></div></div>
  </div>
  <p className="star-flow-disclaimer">This screen reviews existing records. It does not mark organisation coaching delivered, publish family information, or change booking status.</p>
  <div className="star-flow-footer-actions">{!counts.ready&&<button type="button" disabled={busy} onClick={onGoToAttendance}>Finish attendance →</button>}<button type="button" className="star-flow-secondary" disabled={busy} onClick={onGoToCoaching}>Review coaching notes</button>{onReturnToCalendar&&<button type="button" disabled={busy} className={counts.ready?'':'star-flow-secondary'} onClick={onReturnToCalendar}>{counts.ready?'Return to calendar ✓':'Return to calendar'}</button>}</div>
 </section>;
}
