"use client";
import {useEffect,useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {LinkedPlayer} from "../lib/parentDashboard";
import {programmeAssignments,programmeRequestState,registeredPlayers,type ParentRegistration} from "../lib/parentProgrammes";
import "./parent-prices.css";
export type ProgrammePrice={slug:string;title:string;price:string;unit:string;options:string[]};
type Actions={registrations:ParentRegistration[];players:LinkedPlayer[];onRequest:(sourceId:string,programme:string)=>Promise<void>;onRegisterNew:(programme:string)=>void};
export function ParentProgrammePrices({supabase,userId,eligible,...actions}:{supabase:SupabaseClient;userId:string;eligible:boolean}&Actions){
 const [prices,setPrices]=useState<ProgrammePrice[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  setPrices([]);setError("");if(!eligible)return;
  const controller=new AbortController();setLoading(true);
  async function load(){try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session||session.user.id!==userId)throw Error("Please sign in again to view prices.");
   const response=await fetch("/api/programme-prices",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store",signal:controller.signal});
   const data=await response.json();if(!response.ok)throw Error(data.error||"Unable to load programme prices.");
   if(!controller.signal.aborted)setPrices(data.prices);
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Unable to load programme prices.");}
  finally{if(!controller.signal.aborted)setLoading(false);}}
  void load();return()=>controller.abort();
 },[supabase,userId,eligible,attempt]);
 return <section className="parent-programmes" id="programme-prices" aria-labelledby="parent-prices-title"><h3 id="parent-prices-title">Programmes & prices</h3>
 {!eligible?<p>Submit your player registration to view prices and sign up to programmes.</p>:<><p className="parent-programmes-intro">Tap a programme for payment options or to sign up a player.</p>{loading&&<p role="status">Loading programmes…</p>}{error&&<div role="alert"><p>{error}</p><button type="button" onClick={()=>setAttempt(n=>n+1)}>Try again</button></div>}<ParentProgrammeList prices={prices} {...actions}/><p className="parent-programmes-note">New sign-ups are reviewed by STAR. Places and payment arrangements are confirmed separately.</p></>}
 </section>;
}
export function ParentProgrammeList({prices,registrations,players,onRequest,onRegisterNew}:Actions&{prices:ProgrammePrice[]}){
 const [signup,setSignup]=useState(""),[source,setSource]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const candidates=registeredPlayers(registrations);
 async function submit(e:React.FormEvent,slug:string){e.preventDefault();if(busy)return;setError("");setNotice("");if(source==="new"){setSignup("");onRegisterNew(slug);return}const player=candidates.find(r=>r.id===source);if(!player){setError("Choose a player.");return}const state=programmeRequestState(player,slug,registrations,players);if(state){setError(state==="Outside age range"?"This programme is not available for her age.":"She already has an enrolment or request for this programme.");return}setBusy(true);try{await onRequest(source,slug);setSignup("");setNotice("Sign-up sent for "+player.player_first_name+". Awaiting STAR review.")}catch(e){setError(e instanceof Error?e.message:"We couldn’t send this sign-up. Please try again.")}finally{setBusy(false)}}
 return <div className="parent-programme-list">{notice&&<p className="parent-programme-success" role="status">{notice}</p>}{prices.map(p=>{const assigned=programmeAssignments(p.slug,registrations,players);return <details className="parent-programme-row" key={p.slug}><summary><span className="parent-programme-heading"><strong>{p.title}</strong><span className="parent-programme-cost">{p.price}<small>{p.unit}</small></span>{assigned.length>0&&<span className="parent-programme-assigned">{assigned.map(a=><span key={a.name+a.status}>{a.name} <b>{a.status}</b></span>)}</span>}</span><span className="parent-programme-chevron" aria-hidden="true">⌄</span></summary><div className="parent-programme-expanded"><ul>{p.options.map(option=><li key={option}>{option}</li>)}</ul>{signup===p.slug?<form className="parent-programme-signup" onSubmit={e=>void submit(e,p.slug)}><label>Player<select required disabled={busy} value={source} onChange={e=>{setSource(e.target.value);setError("")}}><option value="">Choose a player</option>{candidates.map(r=>{const state=programmeRequestState(r,p.slug,registrations,players);return <option key={r.id} value={r.id} disabled={!!state}>{r.player_first_name} {r.player_last_name}{state?" · "+state:""}</option>})}<option value="new">+ Register a new player</option></select></label>{error&&<p className="parent-details-error" role="alert">{error}</p>}<div className="parent-details-actions"><button type="submit" disabled={busy||!source}>{busy?"Sending…":source==="new"?"Continue to player details":"Submit programme sign-up"}</button><button type="button" disabled={busy} onClick={()=>{setSignup("");setError("")}}>Cancel</button></div></form>:<button type="button" className="parent-programme-join" disabled={busy} onClick={()=>{setSignup(p.slug);setSource("");setError("");setNotice("")}}>Sign up a player <span aria-hidden="true">→</span></button>}</div></details>})}</div>;
}
