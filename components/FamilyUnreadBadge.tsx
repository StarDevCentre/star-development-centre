"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@supabase/supabase-js";
export function FamilyUnreadBadge({userId,role}:{userId:string;role:"staff"|"guardian"}){
 const db=useMemo(()=>{const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;return u&&k?createClient(u,k):null},[]);
 const [count,setCount]=useState(0);
 useEffect(()=>{if(!db||!userId)return;let active=true;async function check(){const q=db!.from("family_messages").select("id",{count:"exact",head:true}).eq("sender_role",role==="staff"?"guardian":"staff").is("read_at",null);if(role==="guardian")q.eq("guardian_id",userId);const {count,error}=await q;if(active&&!error)setCount(count||0)}void check();const timer=window.setInterval(()=>void check(),60000);const onFocus=()=>void check();window.addEventListener("focus",onFocus);return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",onFocus)}},[db,userId,role]);
 return count>0?<span className="star-unread-badge" aria-label={count+" unread family messages"}>{count>99?"99+":count} new</span>:null;
}
