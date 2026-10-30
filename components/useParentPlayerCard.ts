"use client";
import {useEffect,useState} from 'react';
import {supabaseBrowser} from '../lib/supabaseBrowser';
import {loadParentPlayerCard,type ParentPlayerCardData} from '../lib/parentPlayerCard';

export function useParentPlayerCard(ownerKey:string,playerId:string,refreshing:boolean,reviewMode:boolean,sample?:ParentPlayerCardData){
 const [data,setData]=useState<ParentPlayerCardData|null>(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(reviewMode||!ownerKey||!supabaseBrowser||refreshing)return;
  let active=true,pending=false;
  const load=async()=>{
   if(pending)return;pending=true;
   try{const next=await loadParentPlayerCard(supabaseBrowser!,playerId);if(active){setData(next);setFailed(false);}}
   catch{if(active)setFailed(true);}finally{pending=false;}
  };
  const refresh=()=>{if(document.visibilityState==='visible')void load();};
  void load();const timer=window.setInterval(refresh,300000);window.addEventListener('focus',refresh);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[ownerKey,playerId,refreshing,reviewMode,attempt]);
 return {data:reviewMode?(sample?.player_id===playerId?sample:null):(data?.player_id===playerId?data:null),failed:!reviewMode&&failed,retry:()=>setAttempt(n=>n+1)};
}
