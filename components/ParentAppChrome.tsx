"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

export function ParentMobileHeader({onAccount,onUpdates,unread=0,name="",entry=false}:{onAccount?:()=>void;onUpdates?:()=>void;unread?:number;name?:string;entry?:boolean}) {
 return <header className={"parent-app-bar"+(entry?" parent-entry-bar":"")}><Link href="/" className="parent-app-logo" aria-label="STAR website"><img src="/images/star-colour-transparent.webp" alt="STAR Development Centre" width="83" height="42"/></Link><div className="parent-app-brand"><span>YOUR CONNECTION TO STAR</span><strong>Parent Portal</strong></div>{onUpdates&&<button type="button" className="parent-app-bell" aria-label={`Open updates${unread?`, ${unread} unread`:""}`} onClick={onUpdates}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4l-2 3ZM10 20h4M12 2v2"/></svg>{unread>0&&<span>{unread>99?"99+":unread}</span>}</button>}{onAccount?<button type="button" className="parent-app-account" aria-label="Open my account" onClick={onAccount}>{name.trim().charAt(0).toUpperCase()||<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>}</button>:<Link href="/" className="parent-app-back">Website <span aria-hidden="true">↗</span></Link>}</header>;
}

type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function ParentInstall() {
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null),[installed,setInstalled]=useState(false),[help,setHelp]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if("serviceWorker" in navigator)void navigator.serviceWorker.register("/parent-portal-sw.js",{scope:"/parent-portal"}).catch(()=>{});
  const display=window.matchMedia("(display-mode: standalone)");
  const update=()=>setInstalled(display.matches||!!(navigator as Navigator&{standalone?:boolean}).standalone);
  const offer=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPrompt)};
  const done=()=>{setInstalled(true);setPrompt(null);setHelp(false)};
  update();display.addEventListener("change",update);window.addEventListener("beforeinstallprompt",offer);window.addEventListener("appinstalled",done);
  return()=>{display.removeEventListener("change",update);window.removeEventListener("beforeinstallprompt",offer);window.removeEventListener("appinstalled",done)};
 },[]);
 return <div className="parent-install">{installed?<p>Opened as your home-screen app.</p>:<><button type="button" disabled={busy} aria-expanded={help} onClick={async()=>{if(!prompt){setHelp(v=>!v);return}setBusy(true);try{await prompt.prompt();const result=await prompt.userChoice;if(result.outcome!=="accepted")setHelp(true)}catch{setHelp(true)}finally{setPrompt(null);setBusy(false)}}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4m-2-6V6m-3 3 3 3 3-3"/></svg><span><strong>{busy?"Opening install options…":"Add to Home Screen"}</strong><small>Open your parent portal like an app</small></span><span aria-hidden="true">↗</span></button>{help&&<div className="parent-install-help"><p><strong>iPhone or iPad:</strong> open this page in Safari, tap Share, then Add to Home Screen.</p><p><strong>Android:</strong> open your browser menu and choose Install app or Add to Home screen.</p><p>You’ll sign in as usual. An internet connection is needed for your family’s information.</p></div>}</>}</div>;
}
