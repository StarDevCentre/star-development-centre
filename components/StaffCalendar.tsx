'use client';
import {useEffect,useRef,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';
import {ukInputToISO,ukDateTimeInput,ukDateTime} from '../lib/sessionOperations';
import './staff-calendar.css';
import {readStaffTouchMode} from '../lib/staffTouchMode';
type Entry={id:string;title:string;programme:string;starts_at:string;ends_at:string;venue:string;notes:string|null;organisation_id:string|null};
type BookingPerson={player_name:string|null;player_age:number|null;guardian_name:string|null;guardian_phone:string|null;booked_by:string|null;organisation:string|null;service:string|null;details:string|null};

const today=()=>ukDateTimeInput(new Date().toISOString()).slice(0,10);
const shift=(d:string,n:number)=>new Date(Date.parse(d+'T12:00Z')+n*86400000).toISOString().slice(0,10);
const label=(d:string)=>new Date(d+'T12:00Z').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
const minute=(s:string)=>{const v=ukDateTimeInput(s).slice(11).split(':').map(Number);return v[0]*60+v[1]};
const phoneHref=(phone:string)=>/^[+0-9() .-]{6,40}$/.test(phone)?'tel:'+phone.replace(/[^+0-9]/g,''):null;
const displayAge=(p:BookingPerson)=>Number.isInteger(p.player_age)&&p.player_age!==null&&p.player_age>=0&&p.player_age<=120?` · ${p.player_age} years old`:'';
export function StaffCalendar({revision=0,onEdit,onAdd,onOpenWorkspace}:{revision?:number;onEdit:(s:Entry)=>void;onAdd:(date:string)=>void;onOpenWorkspace?:(sessionId:string)=>void}){
 const scroll=useRef<HTMLDivElement>(null);
 const manualView=useRef(false);
 const [networkRevision,setNetworkRevision]=useState(0);
 const[date,setDate]=useState(today),[view,setView]=useState<'day'|'week'|'month'>('week'),[entries,setEntries]=useState<Entry[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[selected,setSelected]=useState<Entry|null>(null);
 const [contacts,setContacts]=useState<Record<string,BookingPerson[]>>({}),[contactsLoading,setContactsLoading]=useState(false),[contactsError,setContactsError]=useState('');
 useEffect(()=>{
  // A standalone phone can report a desktop-sized viewport; use physical screen
  // and display-mode detection shared with the staff app shell.
  const standalone=window.matchMedia('(display-mode: standalone)');
  const fullscreen=window.matchMedia('(display-mode: fullscreen)');
  const coarse=window.matchMedia('(pointer: coarse)');
  const update=()=>{
   if(manualView.current)return;
   setView(readStaffTouchMode().installedTouch||window.matchMedia('(max-width:700px)').matches?'day':'week');
  };
  update();
  for(const mode of [standalone,fullscreen,coarse])mode.addEventListener?.('change',update);
  window.addEventListener('orientationchange',update);
  window.addEventListener('resize',update);
  return()=>{for(const mode of [standalone,fullscreen,coarse])mode.removeEventListener?.('change',update);window.removeEventListener('orientationchange',update);window.removeEventListener('resize',update);};
 },[]);
 useEffect(()=>{
  const refresh=()=>setNetworkRevision(v=>v+1);
  window.addEventListener('star:staff-refresh',refresh);
  return()=>window.removeEventListener('star:staff-refresh',refresh);
 },[]);
 const weekday=(new Date(date+'T12:00Z').getUTCDay()+6)%7;
 const first=view==='day'?date:view==='week'?shift(date,-weekday):shift(date.slice(0,7)+'-01',-((new Date(date.slice(0,7)+'-01T12:00Z').getUTCDay()+6)%7));
 const count=view==='month'?42:view==='week'?7:1;const days=Array.from({length:count},(_,i)=>shift(first,i));
 useEffect(()=>{
  let live=true;
  setLoading(true);setError('');setContacts({});setContactsError('');setContactsLoading(true);
  if(!db){setError('Calendar connection unavailable.');setLoading(false);setContactsLoading(false);return;}
  void (async()=>{
   try{
    const {data,error}=await db.from('training_sessions')
     .select('id,title,programme,starts_at,ends_at,venue,notes,organisation_id')
     .is('cancelled_at',null)
     .lt('starts_at',ukInputToISO(shift(first,count)+'T00:00'))
     .gt('ends_at',ukInputToISO(first+'T00:00'))
     .order('starts_at').limit(1001);
    if(!live)return;
    if(error){setError(error.message);setEntries([]);return;}
    const sessions=(data||[]) as Entry[];
    setEntries(sessions);
    if(sessions.length>1000)setError('More than 1,000 sessions in this range. Choose a shorter view.');
    const summaries:Record<string,BookingPerson[]>={};
    for(let n=0;n<sessions.length;n+=100){
     const ids=sessions.slice(n,n+100).map(row=>row.id);
     const response=await db.rpc('star_staff_calendar_people',{p_session_ids:ids});
     if(!live)return;
     if(response.error)throw new Error('Player and guardian details are unavailable. Refresh or check your staff access.');
     Object.assign(summaries,(response.data||{}) as Record<string,BookingPerson[]>);
    }
    if(live)setContacts(summaries);
   }catch(e){if(live)setContactsError(e instanceof Error?e.message:'Could not load booking contacts.');}
   finally{if(live){setLoading(false);setContactsLoading(false);}}
  })();
  return()=>{live=false};
 },[first,count,revision,networkRevision]);
 useEffect(()=>{if(scroll.current)scroll.current.scrollTop=9*48},[view,first]);
 const time=(s:string)=>new Date(s).toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'});
 const events=(d:string)=>entries.filter(s=>ukDateTimeInput(s.starts_at).slice(0,10)<=d&&ukDateTimeInput(s.ends_at).slice(0,10)>=d);
 const headline=(s:Entry)=>{const names=(contacts[s.id]||[]).filter(p=>p.player_name).map(p=>p.player_name+(p.player_age!==null&&Number.isInteger(p.player_age)?' ('+p.player_age+')':''));return names.length?names.slice(0,2).join(', ')+(names.length>2?' +'+(names.length-2):''):s.title;};
 function move(n:number){if(view==='month'){const d=new Date(date.slice(0,7)+'-01T12:00Z');d.setUTCMonth(d.getUTCMonth()+n);setDate(d.toISOString().slice(0,10))}else setDate(shift(date,n*count))}
 return <section className="staff-calendar" data-view={view} aria-label="STAR coaching calendar"><header><div><span className="kicker">STAR CALENDAR · UK TIME</span><h3>{view==='month'?new Date(date+'T12:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric'}):view==='day'?label(date):label(first)+' – '+label(shift(first,6))}</h3></div><div className="calendar-controls"><button type="button" onClick={()=>move(-1)} aria-label="Previous calendar period">←</button><button type="button" onClick={()=>setDate(today())}>Today</button><button type="button" onClick={()=>move(1)} aria-label="Next calendar period">→</button><label>Go to date<input type="date" value={date} onChange={e=>e.target.value&&setDate(e.target.value)}/></label></div><div className="calendar-controls">{(['day','week','month'] as const).map(v=><button type="button" key={v} aria-pressed={view===v} onClick={()=>{manualView.current=true;setView(v)}}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div></header><p className="calendar-instructions">Select a session for details. Shaded hours show times outside standard booking hours. Existing sessions and travel time affect availability.</p><p className="calendar-touch-tip">Day agenda shown below. Switch to Week or Month to explore the full calendar.</p>{error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading calendar…</p>}
 {view==='month'?<div className="calendar-month">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><strong key={d}>{d}</strong>)}{days.map(d=><div key={d} data-today={d===today()}><button className="calendar-date" type="button" onClick={()=>{manualView.current=true;setDate(d);setView('day')}} aria-label={label(d)}>{Number(d.slice(-2))}</button>{events(d).map(s=><button type="button" className="calendar-month-event" key={s.id} onClick={()=>setSelected(s)}>{time(s.starts_at)} {headline(s)}</button>)}</div>)}</div>:<div className="calendar-scroll" ref={scroll}><div className="calendar-timeline" style={{gridTemplateColumns:`52px repeat(${count},minmax(${count===1?'220':'125'}px,1fr))`}}><div className="calendar-time-heading">UK</div>{days.map(d=><button type="button" className="calendar-day-heading" aria-pressed={d===date} data-today={d===today()} key={d} onClick={()=>setDate(d)} title={"Show bookings for "+label(d)}>{label(d)}</button>)}<div className="calendar-hours">{Array.from({length:25},(_,i)=><span key={i} style={{top:i*48}}>{String(i).padStart(2,'0')}:00</span>)}</div>{days.map(d=>{const dow=new Date(d+'T12:00Z').getUTCDay(),close=dow===3?17:dow===6?16:20;const list=events(d);const positions=placeEvents(list);return <div className="calendar-day" key={d} data-today={d===today()}><div className="calendar-closed" style={{top:0,height:dow===0?1152:480}}/>{dow!==0&&<div className="calendar-closed" style={{top:close*48,bottom:0}}/>}{list.map((s,i)=>{const start=ukDateTimeInput(s.starts_at).slice(0,10)<d?0:minute(s.starts_at),end=ukDateTimeInput(s.ends_at).slice(0,10)>d?1440:minute(s.ends_at);const {lane,columns}=positions.get(s.id)!;return <button type="button" className="calendar-event" key={s.id} style={{top:start*.8,height:Math.max(27,(end-start)*.8),left:`calc(${lane*100/columns}% + 3px)`,width:`calc(${100/columns}% - 6px)`}} onClick={()=>setSelected(s)} title={headline(s)+' · '+s.title+' · '+s.venue}><b>{time(s.starts_at)}–{time(s.ends_at)}</b><span>{headline(s)}</span><small>{s.title}</small></button>})}</div>})}</div></div>}
 <section className="calendar-agenda" aria-label={"Booking contacts for "+label(date)}>
  <h4>Booking details · {label(date)}</h4>
  {contactsError&&<p role="alert">{contactsError}</p>}
  {contactsLoading&&<p role="status">Loading player and guardian details…</p>}
  {events(date).length?events(date).map(s=><article className="calendar-agenda-entry" key={s.id}>
   <button type="button" className="calendar-agenda-title" onClick={()=>setSelected(s)}><strong>{time(s.starts_at)} · {s.title}</strong><span>View session ↗</span></button>
   {contacts[s.id]?.length?<CalendarPeople people={contacts[s.id]}/>:!contactsLoading&&!contactsError&&<p className="calendar-no-contacts">No linked player or guardian contact is recorded for this session.</p>}
  </article>):!loading&&<p>No sessions scheduled for this date.</p>}
 </section>
 <button type="button" onClick={()=>onAdd(date)}>Schedule a session on {label(date)}</button>
 {selected&&<CalendarDetails entry={selected} people={contacts[selected.id]||[]} contactsLoading={contactsLoading} contactsError={contactsError} onClose={()=>setSelected(null)} onEdit={()=>{onEdit(selected);setSelected(null)}} onOpenWorkspace={onOpenWorkspace?()=>{onOpenWorkspace(selected.id);setSelected(null)}:undefined}/>}</section>
}
function placeEvents(items:Entry[]){const result=new Map<string,{lane:number;columns:number}>();let group:Entry[]=[],until='';const flush=()=>{const ends:string[]=[];for(const s of group){let lane=ends.findIndex(e=>e<=s.starts_at);if(lane<0)lane=ends.length;ends[lane]=s.ends_at;result.set(s.id,{lane,columns:0})}for(const s of group)result.get(s.id)!.columns=ends.length;group=[];};for(const s of [...items].sort((a,b)=>a.starts_at.localeCompare(b.starts_at))){if(group.length&&s.starts_at>=until)flush();group.push(s);until=group.length===1?s.ends_at:until>s.ends_at?until:s.ends_at;}flush();return result;}

function CalendarPeople({people}:{people:BookingPerson[]}){
 return <div className="calendar-people">{people.map((p,i)=><div className="calendar-person" key={i}>
  <p><strong>Player:</strong> {p.player_name||'Group booking'}{displayAge(p)}</p>
  <p><strong>Parent / guardian:</strong> {p.guardian_name||'Not recorded'}</p>
  <p><strong>Contact:</strong> {p.guardian_phone?(phoneHref(p.guardian_phone)?<a href={phoneHref(p.guardian_phone)!}>{p.guardian_phone}</a>:p.guardian_phone):'Not recorded'}</p>
  {p.organisation&&<p><strong>Organisation:</strong> {p.organisation}</p>}
  {p.service&&<p><strong>Session:</strong> {p.service}</p>}
  {p.details&&<p><strong>Booking focus:</strong> {p.details}</p>}
 </div>)}</div>;
}
function CalendarDetails({entry:s,onClose,onEdit,onOpenWorkspace,people,contactsLoading,contactsError}:{entry:Entry;onClose:()=>void;onEdit:()=>void;onOpenWorkspace?:()=>void;people:BookingPerson[];contactsLoading:boolean;contactsError:string}){
 const isAssessment=s.title==='FREE assessment';
 const ref=useRef<HTMLDialogElement>(null);
 const previousFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  previousFocus.current=document.activeElement as HTMLElement|null;
  const modal=ref.current;
  modal?.showModal();
  return()=>{if(modal?.open)modal.close();previousFocus.current?.focus({preventScroll:true});};
 },[]);
 return <dialog ref={ref} className="calendar-dialog" aria-label="Session details" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <button type="button" autoFocus onClick={onClose}>Close ×</button>
  <h3>{s.title}</h3><p>{s.programme}</p>
  <p>{ukDateTime(s.starts_at)} – {new Date(s.ends_at).toLocaleTimeString('en-GB',{timeZone:'Europe/London',timeStyle:'short'})}</p>
  <p>{s.venue}</p>{s.notes&&<p>{s.notes}</p>}
  <div className="calendar-bookings"><h4>Player & family contacts</h4>
   {contactsLoading?<p role="status">Checking player and guardian details…</p>:contactsError?<p role="alert">{contactsError}</p>:people.length?<CalendarPeople people={people}/>:<p>No linked player or guardian contact is recorded for this session.</p>}
  </div>
  {onOpenWorkspace&&<button type="button" className="calendar-open-workspace" onClick={onOpenWorkspace}>Open coaching workspace →</button>}
  {isAssessment?<p>To change this assessment, open <strong>Onboarding & free assessments</strong> in the staff portal. Its time and venue are kept in sync with this calendar.</p>:<><p>Released direct bookings are managed under Booking management. Organisation sessions are managed under Schools & clubs.</p><button type="button" onClick={onEdit}>Edit session details</button></>}
 </dialog>;
}
