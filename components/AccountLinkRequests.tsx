"use client";
import {useEffect,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';

type Invitation={link_id:string;player_name:string;invited_by:string};
export function AccountLinkRequests({onAccepted,appearance='space'}:{onAccepted:(id:string)=>void;appearance?:'space'|'intake'}){
 const[items,setItems]=useState<Invitation[]>([]),[busy,setBusy]=useState(''),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{if(!db)return;let active=true;void db.rpc('pending_account_links').then(r=>{if(!active)return;if(r.error){setError('Could not check invitations. Verify your email and try again.');return;}setItems(r.data||[]);setError('');});return()=>{active=false;};},[revision]);
 useEffect(()=>{const refresh=()=>setRevision(v=>v+1);window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[]);
 async function accept(item:Invitation){if(!db||busy)return;setBusy(item.link_id);setError('');try{const r=await db.rpc('accept_account_link',{p_invitation:item.link_id});if(r.error)throw r.error;setItems(v=>v.filter(i=>i.link_id!==item.link_id));onAccepted(r.data as string);}catch(e){setError(e&&typeof e==='object'&&'message' in e?String(e.message):'Could not connect this invitation. Ask your parent to invite your email again.');}finally{setBusy('');}}
 if(!items.length&&!error)return null;
 return <section className={appearance==='intake'?'intake-card':'ps-invite-card'}><h3>Your family invitation</h3>{items.map(item=><div key={item.link_id}><p><strong>{item.invited_by}</strong> has invited you to connect to <strong>{item.player_name||'your player profile'}</strong>.</p><button type="button" className={appearance==='space'?'ps-action':undefined} disabled={!!busy} onClick={()=>void accept(item)}>{busy===item.link_id?'Connecting…':`Connect to ${item.player_name||'my player profile'}`}</button></div>)}{error&&<p role="alert">{error}</p>}<button type="button" className={appearance==='space'?'ps-text-link':undefined} disabled={!!busy} onClick={()=>setRevision(v=>v+1)}>Refresh invitations</button></section>;
}
