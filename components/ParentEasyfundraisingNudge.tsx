"use client";
import Image from "next/image";
import {useEffect,useState} from "react";
import "./parent-easyfundraising-nudge.css";

const CAUSE_URL="https://www.easyfundraising.org.uk/causes/star-development-centre";
const INTERVAL_MS=7*24*60*60*1000;
const APPEAR_AFTER_MS=12000;
const VISIBLE_FOR_MS=18000;

/**
 * A light-touch reminder in the signed-in Parent Space.
 * One appearance per account/browser every seven days, automatically removed after 18s.
 * Only mount from the live Home view, never login/registration or review previews.
 */
export function ParentEasyfundraisingNudge({accountKey}:{accountKey:string}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  if(!accountKey)return;
  const key="star:easyfundraising-nudge:last-shown:v1:"+accountKey;
  try{
   const last=Number(window.localStorage.getItem(key)||0);
   if(Number.isFinite(last)&&last>0&&Date.now()-last<INTERVAL_MS)return;
  }catch{return;} // If storage is unavailable, fail closed rather than repeatedly prompting.

  let ready=false,shown=false;
  let hideTimer:ReturnType<typeof setTimeout>|undefined;
  const maybeShow=()=>{
   if(!ready||shown||document.visibilityState!=="visible")return;
   shown=true;
   try{window.localStorage.setItem(key,String(Date.now()));}catch{}
   setVisible(true);
   hideTimer=setTimeout(()=>setVisible(false),VISIBLE_FOR_MS);
  };
  const appearTimer=setTimeout(()=>{ready=true;maybeShow();},APPEAR_AFTER_MS);
  document.addEventListener("visibilitychange",maybeShow);
  return ()=>{
   clearTimeout(appearTimer);
   if(hideTimer)clearTimeout(hideTimer);
   document.removeEventListener("visibilitychange",maybeShow);
  };
 },[accountKey]);

 if(!visible)return null;
 return <aside className="parent-easyfundraising-nudge" aria-label="Support the STAR Scholarship Programme">
  <a href={CAUSE_URL} target="_blank" rel="noopener noreferrer"
   className="parent-easyfundraising-nudge-link"
   aria-label="Support STAR Scholarships through easyfundraising. Opens in a new tab.">
   <Image src="/images/easyfundraising-parent-floating.png" alt="Support us through easyfundraising" width={88} height={88} sizes="(max-width: 700px) 70px, 88px" priority={false}/>
  </a>
  <button type="button" className="parent-easyfundraising-nudge-dismiss"
   aria-label="Dismiss easyfundraising reminder" onClick={()=>setVisible(false)}>×</button>
 </aside>;
}
