"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';
import type {ParentUpdate} from '../lib/parentUpdates';
export function useParentUpdates(userId:string,enabled:boolean){
 const [state,setState]=useState<{owner:string;items:ParentUpdate[];loading:boolean;error:string}>({owner:'',items:[],loading:false,error:''});
 const sequence=useRef(0),identity=useRef('');identity.current=enabled?userId:'';
 const refresh=useCallback(async()=>{
  const owner=enabled?userId:'';if(!owner||!db)return;const request=++sequence.current;
  setState(s=>({owner,items:s.owner===owner?s.items:[],loading:true,error:''}));
  try{const result=await db.from('parent_notifications').select('id,player_id,category,source_kind,title,created_at,read_at').eq('user_id',owner).order('created_at',{ascending:false}).limit(100);
   if(result.error)throw Error();if(identity.current===owner&&request===sequence.current)setState({owner,items:result.data||[],loading:false,error:''});
  }catch{if(identity.current===owner&&request===sequence.current)setState({owner,items:[],loading:false,error:'We couldn’t load your updates. Please try again.'});}
 },[userId,enabled]);
 useEffect(()=>{if(!enabled){++sequence.current;setState({owner:'',items:[],loading:false,error:''});return;}
  void refresh();const reload=()=>{if(document.visibilityState==='visible')void refresh()};
  const timer=window.setInterval(reload,60000);window.addEventListener('focus',reload);document.addEventListener('visibilitychange',reload);
  return()=>{++sequence.current;window.clearInterval(timer);window.removeEventListener('focus',reload);document.removeEventListener('visibilitychange',reload)};
 },[refresh,enabled]);
 const items=enabled&&state.owner===userId?state.items:[];
 async function markRead(ids:string[]){
  if(!db||!enabled||identity.current!==userId)throw new Error('Please sign in again.');
  const date=new Date().toISOString();const result=await db.from('parent_notifications').update({read_at:date}).eq('user_id',userId).in('id',ids).select('id');
  if(result.error||ids.some(id=>!result.data?.some(row=>row.id===id)))throw new Error('We couldn’t mark these updates as read. Refresh and try again.');
  if(identity.current===userId){++sequence.current;setState(s=>s.owner===userId?{...s,loading:false,items:s.items.map(n=>ids.includes(n.id)?{...n,read_at:date}:n)}:s);}
 }
 return {items,unread:items.filter(n=>!n.read_at).length,loading:state.owner===userId&&state.loading,error:state.owner===userId?state.error:'',refresh,markRead};
}
