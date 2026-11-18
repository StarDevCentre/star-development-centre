'use client';
import {useEffect,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';
import {staffDate,type StaffSection} from '../lib/staffApp';
import type {loadStaffActions,StaffAction} from '../lib/staffActions';
function keyBatches(keys:string[]){return Array.from({length:Math.ceil(keys.length/50)},(_,index)=>keys.slice(index*50,index*50+50));}
export type StaffActionData=Awaited<ReturnType<typeof loadStaffActions>>;
type Priority="high"|"follow_up"|"waiting";
function priorityOf(action:StaffAction):Priority{
 if(action.category==="onboarding"||/Parent completion or review|Awaiting family|Awaiting parent/i.test(action.task))return "waiting";
 if(action.category==="sessions"||action.category==="assessments"&&/overdue|Review assessment outcome/i.test(action.task))return "high";
 return "follow_up";
}
const priorityOrder:Record<Priority,number>={high:0,follow_up:1,waiting:2};
const priorityNames:Record<Priority,string>={high:"High priority",follow_up:"Follow up",waiting:"Waiting on family"};

export function StaffActionList({data,error,loading,onNavigate}:{data:StaffActionData|null;error:boolean;loading:boolean;onNavigate:(area:StaffSection,targetId?:string)=>void}){
 const [filter,setFilter]=useState('all'),[limit,setLimit]=useState(8);
 const categories=[{id:'assessments',label:'Assessment follow-ups'},{id:'onboarding',label:'Awaiting family onboarding'},{id:'sessions',label:'Session changes'}] as const;
 const [owners,setOwners]=useState<Record<string,string>>({});
 const [staff,setStaff]=useState<{id:string;name:string}[]>([]);
 const [assignmentError,setAssignmentError]=useState("");
 const [busyOwner,setBusyOwner]=useState("");
 const all=data?.items||[];
 const keys=data?.items.map(item=>item.id).join(",")||"";
 useEffect(()=>{
  if(!db||!keys)return;
  let alive=true;
  void Promise.all([
   db.rpc("star_follow_up_staff"),
   ...keyBatches(keys.split(",")).map(batch=>db!.from("staff_follow_up_owners").select("action_key,owner_id").in("action_key",batch)),
  ]).then(([people,...assigned])=>{
   if(!alive)return;
   if(people.error||assigned.some(result=>result.error))setAssignmentError("Action ownership could not be loaded.");
   else {
    setStaff(people.data||[]);
    setOwners(Object.fromEntries(assigned.flatMap(result=>result.data||[]).map(row=>[row.action_key,row.owner_id])));
   }
  });
  return()=>{alive=false};
 },[keys,loading]);
 async function assign(item:StaffAction,owner:string){
  if(!db||busyOwner)return;
  setBusyOwner(item.id);setAssignmentError("");
  const {error}=await db.rpc("star_set_follow_up_owner",{p_kind:item.area==="onboarding"?"intake":"request",p_id:item.targetId,p_owner:owner||null});
  if(error)setAssignmentError(error.message);
  else setOwners(current=>({...current,[item.id]:owner}));
  setBusyOwner("");
 }
 const items=all.filter(i=>filter==='all'||i.category===filter)
  .slice().sort((a,b)=>priorityOrder[priorityOf(a)]-priorityOrder[priorityOf(b)]||(Date.parse(a.since)||0)-(Date.parse(b.since)||0));
 const counts={high:all.filter(i=>priorityOf(i)==='high').length,follow_up:all.filter(i=>priorityOf(i)==='follow_up').length,waiting:all.filter(i=>priorityOf(i)==='waiting').length};
 return <section id="staff-action-centre" className="staff-action-list" aria-label="Staff action list" aria-busy={loading}>
  <div className="staff-card-heading"><h3>Action centre</h3><span>High priority first · oldest within each level</span></div>
  {assignmentError&&<p role="alert">{assignmentError}</p>}
  {error?<p role="alert">Couldn’t refresh the action list. Use Refresh above to try again.</p>:!data?<p role="status">{loading?'Loading actions…':'Use Refresh above to load actions.'}</p>:<>
   <div className="staff-action-priority-summary" aria-label="Work by priority">
    <div><strong>{counts.high}</strong><span>High priority</span></div>
    <div><strong>{counts.follow_up}</strong><span>Follow up</span></div>
    <div><strong>{counts.waiting}</strong><span>Waiting on family</span></div>
   </div>
   <div className="staff-action-filters" aria-label="Filter actions"><button type="button" aria-pressed={filter==='all'} onClick={()=>{setFilter('all');setLimit(8)}}>All <b>{data.items.length}</b></button>{categories.map(c=><button type="button" key={c.id} aria-pressed={filter===c.id} onClick={()=>{setFilter(c.id);setLimit(8)}}>{c.label} <b>{data.counts[c.id]}</b></button>)}</div>
   {items.length?<ul>{items.slice(0,limit).map(item=><li key={item.id}><button type="button" onClick={()=>onNavigate(item.area,item.targetId)}><span><small><span className={"staff-priority-indicator "+priorityOf(item)}>{priorityNames[priorityOf(item)]}</span> · {categories.find(c=>c.id===item.category)?.label}</small><strong>{item.name}</strong><span>{item.task}</span><small>Since {staffDate(item.since,{day:'numeric',month:'short',year:'numeric'})}</small></span><span aria-hidden="true">→</span></button>
    {staff.length>0&&<label className="staff-follow-up-owner">Owner for {item.name}<select disabled={Boolean(busyOwner)} value={owners[item.id]||""} onChange={event=>void assign(item,event.target.value)}>
      <option value="">Unassigned</option>{staff.map(person=><option value={person.id} key={person.id}>{person.name}</option>)}
    </select></label>}
   </li>)}</ul>:<p className="staff-action-clear">No outstanding actions in this view.</p>}
   {items.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+8)}>Show more actions ({items.length-limit} remaining)</button>}
   {categories.some(c=>data.counts[c.id]>100)&&<p>Showing the oldest 100 items per category. Open the relevant section for further records.</p>}
  </>}
  <p className="staff-action-note">Onboarding entries may be waiting for the family. Opening an item does not contact them or change a session.</p>
 </section>;
}
