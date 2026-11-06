'use client';

import {useEffect,useMemo,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';
import {ukDateTime} from '../lib/sessionOperations';
import type {StaffSection} from '../lib/staffApp';

type Session={
 id:string;
 title:string;
 programme:string;
 starts_at:string;
 ends_at:string;
 venue:string;
 organisation_id:string|null;
};
type SessionPerson={player_name:string|null;player_age:number|null;organisation:string|null};
const HORIZON_MS=48*60*60*1000;
const dayKey=(date:string)=>new Date(date).toLocaleDateString('sv-SE',{timeZone:'Europe/London'});
const dayLabel=(date:string)=>new Date(date).toLocaleDateString('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long'});
const timeLabel=(date:string)=>new Date(date).toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'});
const category=(s:Session)=>{
 if(s.organisation_id)return 'Organisation coaching';
 if(s.title==='FREE assessment')return 'Free assessment';
 if(['Sparks','Development'].includes(s.programme))return 'Group coaching';
 if(['1-to-1','Flyers','Prestige'].includes(s.programme))return 'Individual coaching';
 return s.programme==='Other'?'Coaching session':s.programme;
};

export function StaffNext48Hours({active=true,onNavigate}:{active?:boolean;onNavigate:(area:StaffSection,playerId?:string,sessionId?:string)=>void}){
 const [sessions,setSessions]=useState<Session[]>([]);
 const [people,setPeople]=useState<Record<string,SessionPerson[]>>({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [contactsError,setContactsError]=useState(false);
 const [now,setNow]=useState(()=>Date.now());
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!active)return;
  const refresh=()=>{if(document.visibilityState==='visible'){setNow(Date.now());setRevision(n=>n+1);}};
  const timer=window.setInterval(refresh,60000);
  window.addEventListener('focus',refresh);
  window.addEventListener('star:organisation-schedule-updated',refresh);
  return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('star:organisation-schedule-updated',refresh);};
 },[active]);
 useEffect(()=>{
  if(!active)return;
  let alive=true;
  const load=async()=>{
   setLoading(true);setError('');setContactsError(false);
   if(!db){setError('Calendar connection unavailable.');setLoading(false);return;}
   const start=new Date().toISOString();
   const end=new Date(Date.now()+HORIZON_MS).toISOString();
   try{
    const {data,error:sessionError}=await db.from('training_sessions')
     .select('id,title,programme,starts_at,ends_at,venue,organisation_id')
     .is('cancelled_at',null).gt('ends_at',start).lt('starts_at',end)
     .order('starts_at').limit(1001);
    if(sessionError)throw sessionError;
    if(!alive)return;
    const next=(data||[]) as Session[];
    setSessions(next);
    if(next.length>1000)setError('More than 1,000 sessions are scheduled in this window. Open the training calendar for the full list.');
    const cardPeople:Record<string,SessionPerson[]>={};
    for(let index=0;index<next.length;index+=100){
      const {data:matches,error:lookupError}=await db.rpc('star_staff_calendar_people',{p_session_ids:next.slice(index,index+100).map(s=>s.id)});
      if(!alive)return;
      if(lookupError){setContactsError(true);break;}
      Object.assign(cardPeople,(matches||{}) as Record<string,SessionPerson[]>);
    }
    if(alive)setPeople(cardPeople);
   }catch{
    if(alive){setError('Could not load the next 48 hours. Try refreshing the schedule.');setSessions([]);setPeople({});}
   }finally{if(alive)setLoading(false);}
  };
  void load();
  return()=>{alive=false;};
 },[active,revision]);
 const upcoming=useMemo(()=>sessions.filter(s=>Date.parse(s.ends_at)>now&&Date.parse(s.starts_at)<now+HORIZON_MS),[sessions,now]);
 const groups=useMemo(()=>{
  const map=new Map<string,Session[]>();
  for(const s of upcoming){const key=dayKey(s.starts_at);map.set(key,[...(map.get(key)||[]),s]);}
  return [...map.entries()];
 },[upcoming]);
 const count=upcoming.length;
 return <section className="staff-48h" aria-label="All coaching sessions in the next 48 hours">
   <div className="staff-48h-heading"><div><p className="staff-48h-eyebrow">YOUR COACHING SCHEDULE</p><h3>Next 48 hours</h3><p>Organisation, individual, group and assessment sessions in one place. All times are UK time.</p></div>
    <div className="staff-48h-total"><strong>{loading?'…':count}</strong><span>session{count===1?'':'s'}</span></div>
   </div>
   <div className="staff-48h-actions"><button type="button" disabled={loading} onClick={()=>setRevision(v=>v+1)}>Refresh schedule ↻</button><button type="button" onClick={()=>onNavigate('sessions')}>Open training calendar →</button></div>
   {error&&<p role="alert" className="staff-inline-error">{error}</p>}
   {contactsError&&<p role="status" className="staff-48h-subtle">Some player booking names could not be loaded. Session times and locations are still shown.</p>}
   {loading&&!sessions.length?<p role="status" className="staff-48h-empty">Checking your bookings…</p>:!upcoming.length&&!error?<p className="staff-48h-empty">No coaching sessions booked for the next 48 hours.</p>:groups.map(([day,items])=><div className="staff-48h-day" key={day}>
     <h4>{dayLabel(items[0].starts_at)}</h4>
     {items.map(s=>{
       const linked=people[s.id]||[];
       const players=linked.filter(p=>p.player_name).map(p=>p.player_name+(p.player_age===null?'':` (${p.player_age})`));
       const organisation=linked.find(p=>p.organisation)?.organisation;
       const kind=category(s);
       const descriptor=[kind,...(players.length&&kind.toLowerCase()!==s.title.toLowerCase()?[s.title]:[]),...(organisation?[organisation]:[])].join(' · ');
       const running=Date.parse(s.starts_at)<=now&&Date.parse(s.ends_at)>now;
       return <button key={s.id} type="button" className="staff-48h-session" onClick={()=>onNavigate('workspace',undefined,s.id)}>
        <span className="staff-48h-time">{timeLabel(s.starts_at)}<small>to {timeLabel(s.ends_at)}</small></span>
        <span className="staff-48h-info"><strong>{players.length?players.join(', '):s.title}</strong><small>{descriptor}</small><span className="staff-48h-venue">{s.venue||'Venue to confirm'}</span></span>
        <span className="staff-48h-go">{running?'In progress':'View ↗'}</span>
       </button>;
     })}
    </div>)}
   <p className="staff-48h-footnote">Includes sessions already in progress and those starting within the next 48 hours. Cancelled sessions are excluded.</p>
 </section>;
}
