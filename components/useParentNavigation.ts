"use client";
import {useEffect,useRef,useState} from "react";
import {parentSectionFromHash,type ParentSection} from "../lib/parentDashboard";

// Navigation state stays in memory; URLs contain section names only.
export function useParentNavigation() {
 const [section,setSection]=useState<ParentSection>("overview"),[visited,setVisited]=useState<ParentSection[]>(["overview"]);
 const current=useRef<ParentSection>("overview"),positions=useRef<Partial<Record<ParentSection,number>>>({}),pending=useRef(false);
 function show(next:ParentSection) {
  if(next===current.current)return;
  positions.current[current.current]=window.scrollY;
  current.current=next;pending.current=true;
  setVisited(v=>v.includes(next)?v:[...v,next]);setSection(next);
 }
 useEffect(()=>{
  const initial=parentSectionFromHash(window.location.hash);
  if(initial)show(initial);
  const back=()=>{const next=parentSectionFromHash(window.location.hash);if(next)show(next);else if(!window.location.hash||window.location.hash==="#parent-account")show("overview")};
  window.addEventListener("popstate",back);window.addEventListener("hashchange",back);
  return()=>{window.removeEventListener("popstate",back);window.removeEventListener("hashchange",back)};
 },[]);
 useEffect(()=>{
  if(!pending.current)return;
  pending.current=false;
  const frame=window.requestAnimationFrame(()=>{
   const content=document.getElementById("parent-dashboard-content");
   content?.focus({preventScroll:true});
   if(window.matchMedia("(max-width: 760px)").matches)window.scrollTo({top:positions.current[section]||0,behavior:"instant"});
   else content?.scrollIntoView({block:"start",behavior:"instant"});
  });
  return()=>window.cancelAnimationFrame(frame);
 },[section]);
 function goTo(next:ParentSection) {
  if(next===current.current){document.getElementById("parent-dashboard-content")?.focus({preventScroll:true});return;}
  window.history.pushState(window.history.state,"","#"+next);
  show(next);
 }
 return {section,visited,goTo};
}
