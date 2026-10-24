"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {programmes} from "../../lib/siteData";
import "./finder.css";

// STAR Phase 1 preview: interactive programme guidance, pending owner approval.
const ageOptions=[5,6,7,8,9,10,11,12,13,14,15,16,17,18];
const goals=[
{value:"start",label:"Build confidence and enjoy football"},
{value:"group",label:"Develop skills with other players"},
{value:"individual",label:"Work towards individual football goals"},
{value:"match",label:"Get feedback from match performances"}
] as const;
type Goal=typeof goals[number]["value"];
export default function ProgrammeFinder(){
 const [age,setAge]=useState<number>(11);
 const [goal,setGoal]=useState<Goal>("individual");
 const matches=useMemo(()=>{
  const slugs=goal==="start"?["sparks","development","flyers","one-to-one"]:goal==="group"?["development","sparks","flyers","prestige"]:goal==="match"?["season-support","one-to-one","prestige"]:["prestige","one-to-one","flyers","development"];
  return programmes.filter(p=>{
   const eligible=p.slug==="sparks"?age<=10:p.slug==="development"?age>=11&&age<=16:p.slug==="flyers"?age>=7&&age<=10:p.slug==="prestige"||p.slug==="one-to-one"?age>=11&&age<=18:true;
   return eligible&&slugs.includes(p.slug);
  }).sort((a,b)=>slugs.indexOf(a.slug)-slugs.indexOf(b.slug));
 },[age,goal]);
 return <main className="finder-page"><section className="inner-hero"><div className="container"><div className="kicker light">FIND HER PATH</div><h1>HER JOURNEY.<br/><em>HER WAY.</em></h1><p>Explore STAR coaching options based on her age and what she wants to work towards. This is a guide, not an assessment or guaranteed placement.</p></div></section>
 <section className="container finder-layout" aria-label="Programme finder"><div className="finder-controls"><h2>Tell us about her</h2><label htmlFor="player-age">Player age</label><select id="player-age" value={age} onChange={e=>setAge(Number(e.target.value))}>{ageOptions.map(n=><option value={n} key={n}>{n} years</option>)}</select><fieldset><legend>What matters most right now?</legend>{goals.map(g=><label className="finder-radio" key={g.value}><input type="radio" name="goal" checked={goal===g.value} onChange={()=>setGoal(g.value)}/><span>{g.label}</span></label>)}</fieldset><p className="finder-note">STAR coaches consider each player's confidence, needs, experience and ambitions before recommending a programme.</p></div>
 <div className="finder-results" aria-live="polite"><div className="kicker">YOUR OPTIONS</div><h2>Possible starting points</h2>{matches.length?matches.map((p,i)=><article className="finder-result" key={p.slug}><span className="finder-result-index">{String(i+1).padStart(2,"0")} / {p.age}</span><h3>{p.title}</h3><p>{p.summary}</p><p className="finder-detail">{p.detail}</p><div className="finder-result-bottom"><strong>{p.price} <small>{p.unit}</small></strong><Link href={"/programmes#"+p.slug}>Programme details ↗</Link></div></article>):<p>No matching programme is listed for that combination. Please contact STAR to discuss individual options.</p>}<Link href="/contact" className="button primary">ASK STAR FOR GUIDANCE ↗</Link></div></section></main>
}
