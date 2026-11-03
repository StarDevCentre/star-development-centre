'use client';
import {useState} from 'react';
import {supabaseBrowser} from '../lib/supabaseBrowser';
import {orgDate,orgTime} from '../lib/organisationPortal';
import {Field,PortalAction} from './OrganisationPortalShared';
export type OrganisationMember={id:string;organisation_id:string;display_name:string;email:string;active:boolean;accepted_at:string|null;expires_at:string;email_status?:string;email_attempted_at?:string|null;email_sent_at?:string|null};
export function OrganisationInvitations({organisationId,members,onSaved}:{organisationId:string;members:OrganisationMember[];onSaved:()=>void}){
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function send(name:string,email:string):Promise<boolean>{
  if(!supabaseBrowser||busy)return false;
  setBusy(true);setError('');setNotice('');
  try{
   const{data,error:failure}=await supabaseBrowser.functions.invoke('organisation-invitation',{body:{organisation_id:organisationId,name,email}});
   if(failure){let message='We could not confirm the email was sent. Refresh its status before trying again.';
    if('context' in failure&&failure.context instanceof Response){try{const details=await failure.context.json();if(typeof details.error==='string')message=details.error}catch{}}
    throw Error(message);
   }
   if(!data?.ok)throw Error(data?.error||'The invitation email was not sent.');
   setNotice(data.message);return true;
  }catch(cause){setError(cause instanceof Error?cause.message:'The invitation could not be sent.');return false}
  finally{setBusy(false);onSaved()}
 }
 return <section className="org-card"><h3>Invite a staff member</h3><form className="org-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const values=new FormData(form);if(await send(String(values.get('name')||'').trim(),String(values.get('email')||'').trim().toLowerCase()))form.reset()}}><fieldset disabled={busy}><Field label="Staff member’s name" name="name" maxLength={100}/><Field label="Their individual email address" name="email" type="email" maxLength={254}/><button className="org-primary" type="submit">{busy?'Sending…':'Send invitation email'}</button></fieldset></form><p>The personal email link verifies their address. New account holders choose a password; existing STAR account holders keep their current password. Invitations must be accepted within 14 days. Email security links expire sooner; resend an unused invitation if needed.</p>{error&&<p role="alert" className="org-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 {members.map(m=><div className="org-response" key={m.id}><strong>{m.display_name}</strong><p>{m.email}</p><p className="org-hint">{!m.active?'Access revoked':m.accepted_at?'Accepted · '+orgDate(m.accepted_at):Date.parse(m.expires_at)<Date.now()?'Invitation expired':'Awaiting acceptance · invitation expires '+orgDate(m.expires_at)}</p>
 {!m.accepted_at&&<><p className="org-hint">{m.email_status==='sent'&&m.email_sent_at?'Email sent · '+orgTime(m.email_sent_at):m.email_status==='failed'?'Email could not be sent. Use resend to try again.':m.email_status==='sending'?'Email sending was started. Refresh to check the result.':'No invitation email has been sent yet.'}</p><button type="button" className="org-secondary" disabled={busy} onClick={()=>void send(m.display_name,m.email)}>{m.active?'Resend invitation email':'Send a new invitation'}</button></>}
 {!m.active&&m.accepted_at&&<PortalAction action="restore_member" data={{id:m.id}} label="Restore this account’s access" onSaved={onSaved}/>}
 {m.active&&<PortalAction action="revoke_member" data={{id:m.id}} label="Revoke this staff member" onSaved={onSaved} confirmText={'Revoke '+m.display_name+'’s access to this organisation?'}/>}</div>)}</section>
}
