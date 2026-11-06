'use client';
import {useState} from 'react';
import {staffDate,type StaffSection} from '../lib/staffApp';
import type {loadStaffActions} from '../lib/staffActions';
export type StaffActionData=Awaited<ReturnType<typeof loadStaffActions>>;
export function StaffActionList({data,error,loading,onNavigate}:{data:StaffActionData|null;error:boolean;loading:boolean;onNavigate:(area:StaffSection,targetId?:string)=>void}){
 const [filter,setFilter]=useState('all'),[limit,setLimit]=useState(8);
 const categories=[{id:'assessments',label:'Assessment follow-ups'},{id:'onboarding',label:'Awaiting family onboarding'},{id:'sessions',label:'Session changes'}] as const;
 const items=data?.items.filter(i=>filter==='all'||i.category===filter)||[];
 return <section id="staff-action-centre" className="staff-action-list" aria-label="Staff action list" aria-busy={loading}>
  <div className="staff-card-heading"><h3>Action centre</h3><span>Oldest outstanding first</span></div>
  <p>One place for assessment follow-ups, family onboarding and session changes. Select an action to open its existing workspace.</p>
  {error?<p role="alert">Couldn’t refresh the action list. Use Refresh above to try again.</p>:!data?<p role="status">{loading?'Loading actions…':'Use Refresh above to load actions.'}</p>:<>
   <div className="staff-action-filters" aria-label="Filter actions"><button type="button" aria-pressed={filter==='all'} onClick={()=>{setFilter('all');setLimit(8)}}>All <b>{data.items.length}</b></button>{categories.map(c=><button type="button" key={c.id} aria-pressed={filter===c.id} onClick={()=>{setFilter(c.id);setLimit(8)}}>{c.label} <b>{data.counts[c.id]}</b></button>)}</div>
   {items.length?<ul>{items.slice(0,limit).map(item=><li key={item.id}><button type="button" onClick={()=>onNavigate(item.area,item.targetId)}><span><small>{categories.find(c=>c.id===item.category)?.label}</small><strong>{item.name}</strong><span>{item.task}</span><small>Since {staffDate(item.since,{day:'numeric',month:'short',year:'numeric'})}</small></span><span aria-hidden="true">→</span></button></li>)}</ul>:<p className="staff-action-clear">No outstanding items in this view.</p>}
   {items.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+8)}>Show more actions ({items.length-limit} remaining)</button>}
   {categories.some(c=>data.counts[c.id]>100)&&<p>Showing the oldest 100 items per category. Open the relevant section for further records.</p>}
  </>}
  <p className="staff-action-note">Onboarding entries may be waiting for the family. Opening an item does not contact them or change a session.</p>
 </section>;
}
