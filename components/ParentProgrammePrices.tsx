"use client";
import {useEffect,useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import "./parent-prices.css";
type Price={slug:string;title:string;price:string;unit:string;options:string[]};
export function ParentProgrammePrices({supabase,userId,eligible,preferred}:{supabase:SupabaseClient;userId:string;eligible:boolean;preferred:string[]}){
 const [prices,setPrices]=useState<Price[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(false),[attempt,setAttempt]=useState(0);
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
 return <section className="parent-prices" id="programme-prices" aria-labelledby="parent-prices-title"><h3 id="parent-prices-title">Programme prices & payment options</h3>
 {!eligible?<p>Complete your parent profile and submit your player’s registration above to see prices and payment options here.</p>:<>
 <p>Compare payment options before agreeing a place with STAR. Your selected or recommended programmes are marked below.</p>
 {loading&&<p role="status">Loading programme prices…</p>}{error&&<div role="alert"><p>{error}</p><button type="button" onClick={()=>setAttempt(n=>n+1)}>Try again</button></div>}
 <div className="parent-prices-grid">{prices.map(p=><article key={p.slug} className={preferred.includes(p.slug)?"parent-price selected":"parent-price"}>{preferred.includes(p.slug)&&<span className="parent-price-label">Your programme interest</span>}<h4>{p.title}</h4><p className="parent-price-amount"><strong>{p.price}</strong><span>{p.unit}</span></p><ul>{p.options.map(x=><li key={x}>{x}</li>)}</ul></article>)}</div>
 <p className="parent-price-note">Registration does not confirm a place or commit you to payment. Availability, session arrangements and payment schedules are agreed directly with STAR.</p></>}
 </section>;
}
