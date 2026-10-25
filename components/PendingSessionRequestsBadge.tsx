"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
export function PendingSessionRequestsBadge(){
 const db=useMemo(()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k):null},[]);
 const [count,setCount]=useState(0);
 useEffect(()=>{if(!db)return;let active=true;async function check(){const {count,error}=await db!.from("family_session_requests").select("id",{count:"exact",head:true}).eq("status","pending");if(active&&!error)setCount(count||0)}
 void check();const timer=window.setInterval(()=>void check(),60000);const onFocus=()=>void check();window.addEventListener("focus",onFocus);window.addEventListener("star:session-requests-updated",onFocus);return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",onFocus);window.removeEventListener("star:session-requests-updated",onFocus)}},[db]);
 return count>0?<span className="star-unread-badge" aria-label={count+" pending session requests"}>{count>99?"99+":count} pending</span>:null;
}
