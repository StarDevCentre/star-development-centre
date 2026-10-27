"use client";
import {useEffect,useRef,useState} from "react";
import {staffSectionFromHash,staffSections,type StaffRole,type StaffSection} from "../lib/staffApp";
export function useStaffNavigation(role:StaffRole){
 const [section,setSection]=useState<StaffSection>("overview"),[visited,setVisited]=useState<StaffSection[]>(["overview"]);
 const current=useRef<StaffSection>("overview"),positions=useRef<Partial<Record<StaffSection,number>>>({}),pending=useRef(false);
 function show(next:StaffSection){if(next===current.current)return;positions.current[current.current]=window.scrollY;current.current=next;pending.current=true;setVisited(v=>v.includes(next)?v:[...v,next]);setSection(next);}
 useEffect(()=>{const first=staffSectionFromHash(window.location.hash,role);if(first)show(first);const back=()=>{show(staffSectionFromHash(window.location.hash,role)||"overview")};window.addEventListener("popstate",back);window.addEventListener("hashchange",back);return()=>{window.removeEventListener("popstate",back);window.removeEventListener("hashchange",back)}},[role]);
 useEffect(()=>{if(!pending.current)return;pending.current=false;const frame=window.requestAnimationFrame(()=>{const content=document.getElementById("staff-app-content");content?.focus({preventScroll:true});if(window.matchMedia("(max-width: 760px)").matches)window.scrollTo({top:positions.current[section]||0,behavior:"instant"});else content?.scrollIntoView({block:"start",behavior:"instant"})});return()=>window.cancelAnimationFrame(frame)},[section]);
 function goTo(next:StaffSection){if(!staffSections(role).some(s=>s.id===next))return;if(next===current.current)return;window.history.pushState(window.history.state,"","#"+next);show(next);}
 return{section,visited,goTo};
}
