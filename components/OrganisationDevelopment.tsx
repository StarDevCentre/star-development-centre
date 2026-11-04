'use client';
import {useEffect,useId,useRef,useState,type ReactNode,type FormEvent} from 'react';
import {supabaseBrowser} from '../lib/supabaseBrowser';
import {orgDate,statusLabel} from '../lib/organisationPortal';
type Goal={id:string;link_id:string;goal:string;status:string;response:string;revision:number};
type Player={id:string;name:string;goals:{id:string;goal:string;status:string}[]};
type Group={id:string;name:string;kind:string};
type Progress={id:string;link_id:string;goal_id:string|null;idp_goal_id:string|null;note:string;created_at:string};
type RegisterEntry={id:string;name:string};
type RosterName=RegisterEntry&{kind:'register'|'linked'};
type RosterSelection={id:string;kind:'register'|'linked';groupId?:string};
type RegisterData={register_entries:RegisterEntry[];register_memberships:{group_id:string;entry_id:string}[]};
type Workspace=RegisterData&{groups:Group[];memberships:{group_id:string;link_id:string}[];players:Player[];suggestions:Goal[];progress:Progress[]};
const registerActions=new Set(['add_name','rename_name','delete_name','name_membership']);
async function registerCall(action:string,data:Record<string,unknown>){if(!supabaseBrowser)throw Error('Portal unavailable.');const r=await supabaseBrowser.rpc('star_organisation_register',{p_action:action,p_data:data});if(r.error)throw Error(r.error.message);return r.data as RegisterData}
async function call(action:string,data:Record<string,unknown>){if(registerActions.has(action))return registerCall(action,data);if(!supabaseBrowser)throw Error('Portal unavailable.');const r=await supabaseBrowser.rpc('star_organisation_development',{p_action:action,p_data:data});if(r.error)throw Error(r.error.message);return r.data as Omit<Workspace,keyof RegisterData>}
function DevelopmentForm({action,data,children,label,onSaved}:{action:string;data:Record<string,unknown>;children?:ReactNode;label:string;onSaved:()=>void}){
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;const form=e.currentTarget;setBusy(true);setError('');setNotice('');try{await call(action,{...Object.fromEntries(new FormData(form)),...data});form.reset();setNotice('Saved successfully.');onSaved()}catch(e){setError(e instanceof Error?e.message:'Please try again.')}finally{setBusy(false)}}
 return <form className="org-form" onSubmit={submit}><fieldset disabled={busy}>{children}<button className="org-primary" type="submit">{busy?'Saving…':label}</button></fieldset>{error&&<p role="alert" className="org-error">{error}</p>}{notice&&<p role="status">{notice}</p>}</form>;
}
export function OrganisationDevelopment({organisationId,manager=false,onRefer}:{organisationId:string;manager?:boolean;onRefer?:(entry:RegisterEntry)=>void}){
 const[data,setData]=useState<Workspace|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0),[group,setGroup]=useState('all');const refresh=()=>setRevision(v=>v+1);
 useEffect(()=>{let alive=true;setLoading(true);setError('');Promise.all([call('workspace',{organisation_id:organisationId}),registerCall('workspace',{organisation_id:organisationId})]).then(([development,register])=>{if(alive)setData({...development,...register} as Workspace)}).catch(e=>{if(alive){setData(null);setError(e.message)}}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[organisationId,revision]);
 // Refresh live consent when returning to this tab, and periodically while open.
 useEffect(()=>{const update=()=>{if(document.visibilityState==='visible')setRevision(v=>v+1)};window.addEventListener('focus',update);const timer=window.setInterval(update,60000);return()=>{window.removeEventListener('focus',update);clearInterval(timer)}},[]);
 const[selected,setSelected]=useState<RosterSelection|null>(null);
 const selectedEntry=selected?(selected.kind==='register'?data?.register_entries:data?.players)?.find(e=>e.id===selected.id):undefined;
 const selectedGroup=data?.groups.find(g=>g.id===selected?.groupId);
 const base={organisation_id:organisationId};
 return <div className="org-stack" style={{overflowWrap:'anywhere'}}><section className="org-card"><h3>Teams, year groups & progress</h3><p className="org-hint">Select a player’s name to view their options.</p><button className="org-secondary" disabled={loading} onClick={refresh}>Refresh groups & progress</button>{loading&&<p role="status">Updating register…</p>}{error&&<p role="alert" className="org-error">{error}</p>}</section>{data&&<>
 <section className="org-card"><h3>Your teams and year groups</h3><details><summary>Create a team or year group</summary><DevelopmentForm action="create_group" data={base} label="Create group" onSaved={refresh}><label>Group name<input name="name" required minLength={2} maxLength={100}/></label><label>Type<select name="kind"><option value="team">Team</option><option value="year_group">Year group</option></select></label></DevelopmentForm></details>
 {!data.groups.length&&<p>No groups yet.</p>}
 {data.groups.map(g=>{
  const names:RosterName[]=[
   ...data.register_entries.filter(e=>data.register_memberships.some(m=>m.group_id===g.id&&m.entry_id===e.id)).map(e=>({...e,kind:'register' as const})),
   ...data.players.filter(p=>data.memberships.some(m=>m.group_id===g.id&&m.link_id===p.id)).map(p=>({...p,kind:'linked' as const}))
  ];
  const availableNames=data.register_entries.filter(e=>!data.register_memberships.some(m=>m.group_id===g.id&&m.entry_id===e.id));
  const availablePlayers=data.players.filter(p=>!data.memberships.some(m=>m.group_id===g.id&&m.link_id===p.id));
  return <details key={g.id} className="org-register-group">
   <summary>{g.name} · {statusLabel(g.kind)} · {names.length} players</summary>
   <NameList items={names} onSelect={e=>setSelected({id:e.id,kind:e.kind,groupId:g.id})}/>
   {!names.length&&<p className="org-hint">No players added yet.</p>}
   <details className="org-register-add"><summary>Add players</summary>
    <DevelopmentForm action="add_name" data={{...base,group_id:g.id}} label="Add new name" onSaved={refresh}><label>Player’s name<input name="name" required minLength={2} maxLength={150}/></label></DevelopmentForm>
    {!!availableNames.length&&<DevelopmentForm action="name_membership" data={{...base,group_id:g.id,assigned:true}} label="Add to group" onSaved={refresh}><label>Choose an existing register name<select name="entry_id" required defaultValue=""><option value="">Choose name</option>{availableNames.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label></DevelopmentForm>}
    {!!availablePlayers.length&&<DevelopmentForm action="membership" data={{...base,group_id:g.id,assigned:true}} label="Add STAR player" onSaved={refresh}><label>Parent-approved STAR player<select name="link_id" required defaultValue=""><option value="">Choose player</option>{availablePlayers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></DevelopmentForm>}
   </details>
   <details className="org-register-settings"><summary>Group settings</summary>
    <DevelopmentForm action="rename_group" data={{...base,group_id:g.id}} label="Rename group" onSaved={refresh}><label>Group name<input name="name" required minLength={2} maxLength={100} defaultValue={g.name}/></label></DevelopmentForm>
    <details><summary>Archive this group</summary><p>Removes the group from the active list. Player records are retained.</p><DevelopmentForm action="archive_group" data={{...base,group_id:g.id}} label="Archive group" onSaved={()=>{setGroup('all');refresh()}}/></details>
   </details>
  </details>
 })}</section>
 <section className="org-card"><details className="org-register-all"><summary>All register names · {data.register_entries.length}</summary><p className="org-hint">Names can belong to more than one group. Select a name to manage it.</p><NameList items={data.register_entries.map(e=>({...e,kind:'register' as const}))} onSelect={e=>setSelected({id:e.id,kind:e.kind})}/>{!data.register_entries.length&&<p className="org-hint">Add your first name inside a team or year group.</p>}</details></section>
 {selected&&selectedEntry&&<RegisterNameDialog key={selected.kind+selected.id+selected.groupId} entry={selectedEntry} kind={selected.kind} group={selectedGroup} organisationId={organisationId} onClose={()=>setSelected(null)} onSaved={refresh} onRefer={onRefer}/>}
 {!!data.players.length&&<section className="org-card"><label>Show shared STAR players<select value={group} onChange={e=>setGroup(e.target.value)}><option value="all">All shared players</option>{data.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><p className="org-hint">The development section below shows only STAR players with current parent sharing permission. Register names stay in the lists above.</p></section>}

 {data.players.filter(p=>group==='all'||data.memberships.some(m=>m.group_id===group&&m.link_id===p.id)).map(p=>{const suggestions=data.suggestions.filter(s=>s.link_id===p.id);return <article className="org-card" key={p.id}><h3>{p.name}</h3><details><summary>Suggest a development goal</summary><DevelopmentForm action="suggest_goal" data={{...base,link_id:p.id}} label="Send goal for STAR approval" onSaved={refresh}><label>Suggested goal<textarea name="goal" required minLength={10} maxLength={1000} rows={4} placeholder="What would help this player, and what would progress look like?"/></label></DevelopmentForm></details>
 {p.goals.map(g=><GoalProgress key={g.id} title={g.goal} status={g.status==='working_on'?'Current STAR goal':'Achieved STAR goal'} notes={data.progress.filter(n=>n.link_id===p.id&&n.idp_goal_id===g.id)} target={g.status==='working_on'?{...base,link_id:p.id,idp_goal_id:g.id}:undefined} onSaved={refresh}/>)}
 {!p.goals.length&&!suggestions.length&&<p>No current shared goals or suggestions.</p>}
 {suggestions.map(g=><section className="org-response" key={g.id}><h4>{g.goal}</h4><p><strong>{statusLabel(g.status)}</strong></p>{g.response&&<p>STAR: {g.response}</p>}{manager&&['pending','approved'].includes(g.status)&&<DevelopmentForm action="review_goal" data={{...base,link_id:p.id,goal_id:g.id,revision:g.revision}} label="Save STAR decision" onSaved={refresh}><label>Decision<select name="status">{(g.status==='pending'?['approved','declined']:['completed']).map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select></label><label>Feedback for the organisation<textarea name="response" maxLength={1000} rows={3}/></label></DevelopmentForm>}<GoalProgress title="Progress notes" status="" notes={data.progress.filter(n=>n.link_id===p.id&&n.goal_id===g.id)} target={g.status==='approved'?{...base,link_id:p.id,goal_id:g.id}:undefined} onSaved={refresh}/></section>)}
 </article>})}</>}</div>;
}
function NameList({items,onSelect}:{items:RosterName[];onSelect:(entry:RosterName)=>void}){
 return <ul className="org-register-list">{[...items].sort((a,b)=>a.name.localeCompare(b.name,'en-GB')||a.id.localeCompare(b.id)).map(e=><li key={e.kind+e.id}><button type="button" aria-haspopup="dialog" onClick={()=>onSelect(e)}>{e.name}</button></li>)}</ul>;
}
function RegisterNameDialog({entry,kind,group,organisationId,onClose,onSaved,onRefer}:{entry:RegisterEntry;kind:RosterName['kind'];group?:Group;organisationId:string;onClose:()=>void;onSaved:()=>void;onRefer?:(entry:RegisterEntry)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),titleId=useId();
 const[confirmDelete,setConfirmDelete]=useState(false);
 useEffect(()=>{const element=dialog.current;if(!element)return;const overflow=document.body.style.overflow;element.showModal();document.body.style.overflow='hidden';return()=>{element.close();document.body.style.overflow=overflow}},[]);
 const dismiss=()=>{dialog.current?.close();onClose()};
 const saved=()=>{dismiss();onSaved()};
 const base={organisation_id:organisationId};
 return <dialog ref={dialog} className="org-register-dialog" data-confirm-delete={confirmDelete} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();dismiss()}} onClick={e=>{if(e.target===e.currentTarget)dismiss()}}>
  <div className="org-register-dialog-content">
   <header><h3 id={titleId}>{entry.name}</h3><button type="button" className="org-register-close" onClick={dismiss} aria-label="Close player options" autoFocus>×</button></header>
   {confirmDelete?<><p>Delete this name from the register and every group? This cannot be undone.</p><DevelopmentForm action="delete_name" data={{...base,entry_id:entry.id}} label="Delete name from all groups" onSaved={saved}/><button type="button" className="org-secondary" onClick={()=>setConfirmDelete(false)}>Keep name</button></>:<div className="org-register-options">
    {kind==='register'&&onRefer&&<button type="button" className="org-primary" onClick={()=>{dismiss();onRefer(entry)}}>Refer to STAR</button>}
    {group&&<DevelopmentForm action={kind==='register'?'name_membership':'membership'} data={{...base,group_id:group.id,...(kind==='register'?{entry_id:entry.id}:{link_id:entry.id}),assigned:false}} label="Remove from group" onSaved={saved}/>}
    {kind==='register'?<><details><summary>Rename</summary><DevelopmentForm action="rename_name" data={{...base,entry_id:entry.id}} label="Save name" onSaved={saved}><label>Player’s name<input name="name" required minLength={2} maxLength={150} defaultValue={entry.name}/></label></DevelopmentForm></details><button type="button" className="org-register-delete" onClick={()=>setConfirmDelete(true)}>Delete name</button></>:<p className="org-hint">Removing this player from a group keeps her STAR connection and shared progress.</p>}
   </div>}
  </div>
 </dialog>;
}

function GoalProgress({title,status,notes,target,onSaved}:{title:string;status:string;notes:Progress[];target?:Record<string,unknown>;onSaved:()=>void}){return <section><h4>{title}</h4>{status&&<p className="org-hint">{status}</p>}{notes.map(n=><div className="org-response" key={n.id}><p className="org-hint">{orgDate(n.created_at)}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{n.note}</p></div>)}{target&&<details><summary>Record progress against this goal</summary><DevelopmentForm action="progress" data={target} label="Share progress" onSaved={onSaved}><label>What have you noticed?<textarea name="note" required minLength={10} maxLength={2000} rows={4} placeholder="Describe a football example, what improved and what to try next."/></label></DevelopmentForm></details>}</section>}
