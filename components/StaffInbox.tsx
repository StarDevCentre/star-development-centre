'use client';
import {useEffect,useState} from 'react';
import dynamic from 'next/dynamic';
const FamilyCommunications=dynamic(()=>import('./FamilyCommunications').then(m=>m.FamilyCommunications),{loading:()=> <p role="status">Loading family inbox…</p>});
const OrganisationInbox=dynamic(()=>import('./OrganisationInbox').then(m=>m.OrganisationInbox),{loading:()=> <p role="status">Loading organisation inbox…</p>});
export function StaffInbox({userId,initialPlayerId='',active=true,target}:{userId:string;initialPlayerId?:string;active?:boolean;target?:{tab:string;revision:number}}){
 const[tab,setTab]=useState('families');
 useEffect(()=>{if(target?.revision)setTab(target.tab);else if(new URLSearchParams(window.location.search).get('inbox')==='organisations')setTab('organisations')},[target]);
 return <div className="org-embedded"><nav className="org-tabs" aria-label="Inbox"><button type="button" aria-current={tab==='families'?'page':undefined} onClick={()=>setTab('families')}>Families</button><button type="button" aria-current={tab==='organisations'?'page':undefined} onClick={()=>setTab('organisations')}>Schools & clubs</button></nav>{tab==='families'?<FamilyCommunications userId={userId} role="staff" initialPlayerId={initialPlayerId} active={active}/>:<OrganisationInbox staff active={active}/>}</div>;
}
