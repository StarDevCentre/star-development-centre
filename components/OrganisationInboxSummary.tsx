'use client';
import {useEffect,useState} from 'react';
import {inboxCall} from '../lib/organisationInbox';
export function OrganisationInboxSummary({organisationId='',badge=false,onOpen}:{organisationId?:string;badge?:boolean;onOpen?:()=>void}){
 const[count,setCount]=useState<number|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let alive=true;async function refresh(){try{const result=await inboxCall<{unread:number}>('summary',organisationId?{organisation_id:organisationId}:{});if(alive){setCount(result.unread);setFailed(false)}}catch{if(alive){setCount(null);setFailed(true)}}}void refresh();const update=()=>{if(document.visibilityState==='visible')void refresh()};window.addEventListener('focus',update);window.addEventListener('star:organisation-inbox-updated',update);const timer=window.setInterval(update,60000);return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('star:organisation-inbox-updated',update)}},[organisationId]);
 if(badge)return count?<span className="star-unread-badge" aria-label={count+' unread organisation updates'}>{count>99?'99+':count} org</span>:null;
 return <section className="org-card org-inbox-summary"><p className="org-eyebrow">YOUR INBOX</p><h3>{failed?'Check your organisation messages':count===null?'Checking for updates…':count?`${count} unread update${count===1?'':'s'}`:'You’re up to date'}</h3><p>Messages, selected player feedback and replies from STAR appear together here.</p><button className="org-primary" type="button" onClick={onOpen}>Open inbox →</button></section>;
}
