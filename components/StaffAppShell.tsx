"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {staffCanManage,staffRoles,staffSections,type StaffRole,type StaffSection} from "../lib/staffApp";
import {readStaffTouchMode} from "../lib/staffTouchMode";
import "./staff-app.css";
export function StaffIcon({name}:{name:string}){const paths:Record<string,ReactNode>={home:<><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/></>,sessions:<><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v5M16 3v5M4 11h16m-12 5 3 3 5-5"/></>,players:<><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 6"/></>,inbox:<><path d="M4 4h16v13H10l-6 4V4Z"/><path d="M8 9h8M8 13h5"/></>,coaching:<><path d="m5 17-1 4 4-1L21 7l-3-3L5 17ZM14 8l3 3M4 4h7M4 8h4"/></>,operations:<><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></>,analytics:<><path d="M4 20V10M10 20V5M16 20v-8M22 20V3M2 20h21"/></>,more:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>};return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.coaching}</svg>}
export function StaffAppShell({role,section,onNavigate,onSignOut,children,badges={},onMenuChange}:{role:StaffRole;section:StaffSection;onNavigate:(section:StaffSection)=>void;onSignOut:()=>void;children:ReactNode;badges?:Partial<Record<StaffSection,ReactNode>>;onMenuChange?:(open:boolean)=>void}){
 const [menu,setMenu]=useState(false),[keyboard,setKeyboard]=useState(false);
 const [online,setOnline]=useState(true),[wasOffline,setWasOffline]=useState(false);
 const [installedTouch,setInstalledTouch]=useState(false),[virtualDesktopViewport,setVirtualDesktopViewport]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null);
 const items=staffSections(role),groups=["Home","Coaching","Players","Families","Operations","Admin"].filter(group=>items.some(i=>i.group===group));const manage=staffCanManage(role);
 const primary:{id:StaffSection;label:string;icon:string}[]=[
 {id:"overview",label:"Home",icon:"home"},
 {id:"sessions",label:"Sessions",icon:"sessions"},
 {id:"players",label:"Players",icon:"players"},
 manage?{id:"communications",label:"Inbox",icon:"inbox"}:{id:"records",label:"Coaching",icon:"coaching"},
 manage?{id:"organisations",label:"Operations",icon:"operations"}:{id:"workspace",label:"Session workspace",icon:"operations"},
 manage?{id:"analytics",label:"Analytics",icon:"analytics"}:{id:"trainingHub",label:"Player training",icon:"analytics"}
 ];
 const dock=primary.slice(0,4);
 function close(){dialog.current?.close();setMenu(false);onMenuChange?.(false);opener.current?.focus({preventScroll:true});}
 function go(id:StaffSection){if(menu)close();onNavigate(id);}
 useEffect(()=>{
  // Android and iOS both support installed standalone web apps. iOS also
  // exposes navigator.standalone; do not use viewport width alone because
  // Chrome's desktop-site setting can force a ~980px virtual viewport.
  const standalone=window.matchMedia('(display-mode: standalone)');
  const fullscreen=window.matchMedia('(display-mode: fullscreen)');
  const coarse=window.matchMedia('(pointer: coarse)');
  const update=()=>{
   const mode=readStaffTouchMode();
   setInstalledTouch(mode.installedTouch);
   setVirtualDesktopViewport(mode.virtualDesktopViewport);
  };
  update();
  for(const query of [standalone,fullscreen,coarse])query.addEventListener?.('change',update);
  window.addEventListener('resize',update);
  window.addEventListener('orientationchange',update);
  return()=>{for(const query of [standalone,fullscreen,coarse])query.removeEventListener?.('change',update);window.removeEventListener('resize',update);window.removeEventListener('orientationchange',update);};
 },[]);
 useEffect(()=>{if(!menu)return;const el=dialog.current;if(!el)return;el.showModal();const dismiss=el.querySelector<HTMLElement>("[data-staff-close]");dismiss?.focus({preventScroll:true});const overflow=document.body.style.overflow;document.body.style.overflow="hidden";const back=()=>close();window.addEventListener("popstate",back);return()=>{window.removeEventListener("popstate",back);document.body.style.overflow=overflow;if(el.open)el.close()}},[menu]);
 useEffect(()=>{
  const update=()=>{const current=navigator.onLine!==false;setOnline(current);if(!current)setWasOffline(true);};
  update();
  window.addEventListener("online",update);
  window.addEventListener("offline",update);
  return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};
 },[]);
 const refreshOnReconnection=()=>{window.dispatchEvent(new Event("star:staff-refresh"));setWasOffline(false);};
 useEffect(()=>{const viewport=window.visualViewport;if(!viewport)return;let frame=0;const update=()=>{window.cancelAnimationFrame(frame);frame=window.requestAnimationFrame(()=>setKeyboard(!!document.activeElement?.matches("input,textarea,select")&&window.innerHeight-viewport.height>140))};viewport.addEventListener("resize",update);document.addEventListener("focusin",update);document.addEventListener("focusout",update);return()=>{window.cancelAnimationFrame(frame);viewport.removeEventListener("resize",update);document.removeEventListener("focusin",update);document.removeEventListener("focusout",update)}},[]);
 const navigation=()=><>{groups.map(group=><div className="staff-menu-group" key={group}><p>{group}</p>{items.filter(i=>i.group===group).map(item=><button key={item.id} type="button" aria-current={section===item.id?"page":undefined} onClick={()=>go(item.id)}><span>{item.label}</span><span aria-hidden="true">↗</span></button>)}</div>)}</>;
 const primaryNavigation=()=><nav className="staff-main-navigation" aria-label="Main staff areas">{primary.map(item=><button type="button" key={item.id} aria-current={section===item.id?"page":undefined} onClick={()=>go(item.id)}><StaffIcon name={item.icon}/><span>{item.label}</span>{badges[item.id]}</button>)}</nav>;
 const currentTitle=section==="overview"?(installedTouch?"Your coaching hub":"Performance command centre"):items.find(s=>s.id===section)?.label||"Staff workspace";
 return <div className={installedTouch?"staff-app staff-app--installed-touch":"staff-app"}><header className="staff-app-header"><Link href="/" aria-label="STAR website" className="staff-app-logo"><img src="/images/star-colour-transparent.webp" alt="STAR Development Centre" width="1774" height="887"/></Link><div className="staff-app-brand"><span>STAR PERFORMANCE CENTRE</span><strong>Staff Workspace</strong></div><span className="staff-app-role">{staffRoles[role]}</span><button type="button" className="staff-app-menu-button" aria-label="Open staff menu" aria-haspopup="dialog" aria-expanded={menu} onClick={e=>{opener.current=e.currentTarget;setMenu(true);onMenuChange?.(true)}}><StaffIcon name="more"/></button></header><div className="staff-app-layout"><aside className="staff-app-sidebar"><div className="staff-sidebar-brand"><span className="staff-brand-star">★</span><span><strong>STAR</strong><small>PERFORMANCE CENTRE</small></span></div><p className="staff-sidebar-label">MAIN WORKSPACE</p>{primaryNavigation()}<details className="staff-sidebar-extras"><summary>All coaching tools <span aria-hidden="true">⌄</span></summary><nav aria-label="All staff tools">{navigation()}</nav></details><div className="staff-sidebar-footer"><span className="staff-sidebar-status"><span aria-hidden="true" className="staff-live-dot"/>STAFF WORKSPACE</span><button className="staff-sign-out" type="button" onClick={onSignOut}>Sign out</button></div></aside><div className="staff-app-content" id="staff-app-content" tabIndex={-1}><div className="staff-app-page-heading"><p><span className="staff-live-dot" aria-hidden="true"/> STAR PERFORMANCE CENTRE / {staffRoles[role]}</p><h2>{currentTitle}</h2>{section==="overview"&&<span className="staff-page-subtitle">{installedTouch?"Sessions, messages and priority actions":"Live coaching operations · Your next move is here"}</span>}</div>{(!online||wasOffline)&&<div className="staff-connection-banner" role="status" aria-live="polite">
  <span aria-hidden="true" className="staff-connection-dot"/>
  <span>{online?"Your device is back online. Refresh staff data to check for changes.":"Your device reports no connection. Saved information may be out of date; changes cannot be relied on until reconnected."}</span>
  {online&&<button type="button" onClick={refreshOnReconnection}>Refresh data</button>}
 </div>}{virtualDesktopViewport&&<p className="staff-pwa-viewport-notice" role="status"><strong>App display setting</strong> Chrome appears to be using a desktop-sized viewport. For normal text sizing, open Chrome Settings → Site settings → Desktop site and choose Mobile site for STAR.</p>}{children}</div></div><nav className="staff-app-dock" aria-label="Staff navigation" hidden={keyboard}>{dock.map(item=><button key={item.id} type="button" aria-current={section===item.id?"page":undefined} onClick={()=>go(item.id)}><StaffIcon name={item.icon}/><span>{item.label}</span>{badges[item.id]}</button>)}<button type="button" aria-current={!dock.some(i=>i.id===section)?"page":undefined} aria-haspopup="dialog" aria-expanded={menu} onClick={e=>{opener.current=e.currentTarget;setMenu(true);onMenuChange?.(true)}}><StaffIcon name="more"/><span>More</span></button></nav><dialog className="staff-app-sheet" ref={dialog} aria-label="All staff tools" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===e.currentTarget)close()}}><div className="staff-sheet-heading"><div><p>{staffRoles[role]} · STAR PERFORMANCE CENTRE</p><h2>All staff tools</h2></div><button type="button" data-staff-close onClick={close} aria-label="Close staff menu">×</button></div><nav aria-label="More staff tools">{navigation()}</nav><button type="button" className="staff-sign-out" onClick={()=>{close();onSignOut()}}>Sign out</button></dialog></div>;
}
