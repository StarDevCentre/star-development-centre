"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Analytics} from "@vercel/analytics/next";
import Script from "next/script";
const KEY="star-cookie-choice-v1", SIX_MONTHS=183*24*60*60*1000;
type Choice="accepted"|"rejected";
function readChoice():Choice|null {try {const value=JSON.parse(localStorage.getItem(KEY)||"null");return value && (value.choice==="accepted"||value.choice==="rejected") && typeof value.time==="number" && value.time<=Date.now() && Date.now()-value.time<SIX_MONTHS ? value.choice : null}catch{return null}}
export function CookieControls(){
 const [choice,setChoice]=useState<Choice|null>(null),[ready,setReady]=useState(false),[open,setOpen]=useState(false);
 useEffect(()=>{setChoice(readChoice());setReady(true);const sync=(event:StorageEvent)=>{if(event.key===KEY||event.key===null)window.location.reload()};const show=()=>setOpen(true);window.addEventListener("star-open-cookie-settings",show);window.addEventListener("storage",sync);return()=>{window.removeEventListener("star-open-cookie-settings",show);window.removeEventListener("storage",sync)}},[]);
 function choose(next:Choice){try{localStorage.setItem(KEY,JSON.stringify({choice:next,time:Date.now()}))}catch{};if(choice==="accepted"&&next==="rejected"){window.location.reload();return}setChoice(next);setOpen(false)}
 if(!ready)return null;
 return <>{choice==="accepted"&&<><Analytics/><Script id="star-gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);})(window,document,\'script\',\'dataLayer\',\'GTM-KFQ275JM\');`}</Script></>}{(choice===null||open)?<section className="star-cookie-banner" role="region" aria-label="Cookie choices"><div><strong>Your privacy at STAR</strong><p>We use essential browser storage to run the site and keep accounts secure. With your permission, we also use Vercel Web Analytics and Google Analytics 4 to understand visits. Google Analytics may use cookies. <Link href="/cookies">Cookie policy</Link></p></div><div className="star-cookie-actions"><button type="button" onClick={()=>choose("accepted")}>Accept analytics</button><button type="button" onClick={()=>choose("rejected")}>Reject analytics</button></div></section>:null}</>
}
