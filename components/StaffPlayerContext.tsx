'use client';
import {useEffect,useState} from 'react';
import {supabaseBrowser} from '../lib/supabaseBrowser';
import type {StaffSection} from '../lib/staffApp';
export function StaffPlayerContext({playerId,canManage,onNavigate,onClear}:{playerId:string;canManage:boolean;onNavigate:(area:StaffSection,playerId?:string)=>void;onClear:()=>void}){
 const [player,setPlayer]=useState<{id:string;first_name:string;last_name:string;programme:string}|null>(null);
 useEffect(()=>{let live=true;setPlayer(null);void supabaseBrowser?.from('coaching_players').select('id,first_name,last_name,programme').eq('id',playerId).maybeSingle().then(r=>{if(live&&!r.error)setPlayer(r.data)});return()=>{live=false}},[playerId]);
 if(!player)return null;
 return <aside className="star-hub-panel staff-player-context" aria-label="Selected player"><strong>{player.first_name} {player.last_name}</strong><span> · {player.programme}</span><div className="star-session-actions">{([{id:'idps',label:'Development'},{id:'records',label:'Coaching notes'},{id:'playerSpace',label:'Player conversation'},{id:'trainingHub',label:'Assigned practice'},...(canManage?[{id:'communications',label:'Parent inbox'},{id:'familyPublishing',label:'Share with family'}]:[])] as {id:StaffSection;label:string}[]).map(a=><button key={a.id} onClick={()=>onNavigate(a.id,playerId)}>{a.label}</button>)}<button onClick={onClear}>Clear selected player</button></div><small>Player conversations include linked guardians. The parent inbox is a separate family thread.</small></aside>;
}
