"use client";
import {useEffect,useState} from "react";
import {playerAge,programmeForAge} from "../lib/siteData";
const programmeLabels=[["sparks","STAR Sparks (ages 5–10)"],["development","Development Groups (ages 11–16)"],["flyers","STAR Flyers (ages 7–10)"],["prestige","STAR Prestige (ages 11–18)"],["one-to-one","One to One Coaching (ages 11–18)"],["season-support","Season Support"]];
type Props={onSave:(data:{player_first_name:string;player_last_name:string;date_of_birth:string;programme:string})=>Promise<boolean>;busy:boolean;initialProgramme?:string};
export function PlayerRegistrationDraft({onSave,busy,initialProgramme=""}:Props){
 const [first,setFirst]=useState(""),[last,setLast]=useState(""),[dob,setDob]=useState(""),[programme,setProgramme]=useState(initialProgramme);
 const [error,setError]=useState(""),[review,setReview]=useState(false);
 useEffect(()=>{if(initialProgramme)setProgramme(initialProgramme)},[initialProgramme]);
 const age=playerAge(dob);
 const available=programmeLabels.filter(([slug])=>!Number.isFinite(age)||programmeForAge(slug,age));
 async function submit(e:React.FormEvent){
  e.preventDefault();if(busy)return;setError("");const age=playerAge(dob);
  if(!Number.isFinite(age)||age<5||age>18){setError("Player must be aged 5–18. Please check her date of birth.");setReview(false);return;}
  if(!programmeForAge(programme,age)){setError("Select a programme available for her age.");setReview(false);return;}
  if(!first.trim()||!last.trim()){setError("Enter the player’s first and last name.");setReview(false);return;}
  if(!review){setReview(true);return;}
  try{if(await onSave({player_first_name:first.trim(),player_last_name:last.trim(),date_of_birth:dob,programme}))document.getElementById("programme-prices")?.scrollIntoView({block:"start"});else setError("Your registration could not be submitted. Your details are still here — please try again.");}
  catch{setError("Your registration could not be submitted. Your details are still here — please try again.");}
 }
 return <form id="player-registration" className="star-portal-form" onSubmit={submit} aria-labelledby="player-registration-title">
 <div><p className="parent-eyebrow">STEP 3 / YOUR PLAYER</p><h3 id="player-registration-title">{review?"Check her details.":"Tell us about her."}</h3><p>{review?"Make sure everything looks right before sending her registration to STAR.":"Add her basic details and choose a programme. You’ll be able to review everything before submitting."}</p></div>
 {error&&<p role="alert" className="star-portal-error">{error}</p>}
 {review?<div className="parent-registration-review"><dl><div><dt>Player</dt><dd>{first.trim()} {last.trim()}</dd></div><div><dt>Date of birth</dt><dd>{new Date(dob+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})} · Age {age}</dd></div><div><dt>Programme</dt><dd>{programmeLabels.find(([slug])=>slug===programme)?.[1]}</dd></div></dl><p className="parent-registration-caption">Submitting asks STAR to review her registration. It does not confirm a place or commit you to payment. Enrolment consent is completed separately.</p></div>:<>
 <label>Player’s first name<input required maxLength={100} autoComplete="off" value={first} disabled={busy} onChange={e=>setFirst(e.target.value)}/></label>
 <label>Player’s last name<input required maxLength={100} autoComplete="off" value={last} disabled={busy} onChange={e=>setLast(e.target.value)}/></label>
 <label>Date of birth<input type="date" required value={dob} disabled={busy} onChange={e=>{const value=e.target.value;setDob(value);const nextAge=playerAge(value);if(Number.isFinite(nextAge)&&!programmeForAge(programme,nextAge))setProgramme("");}}/></label>
 <label>Programme of interest<select required value={programme} disabled={busy} onChange={e=>setProgramme(e.target.value)}><option value="">Choose her programme</option>{available.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><small>Options are matched to her age. Not sure? Ask STAR before choosing.</small></label>
 <p className="parent-registration-caption">Please keep medical, disability, safeguarding and emergency contact information out of this form. Discuss any individual support with STAR directly.</p>
 </>}
 <div className="parent-form-actions">{review&&<button type="button" className="parent-secondary" disabled={busy} onClick={()=>setReview(false)}>← Edit details</button>}<button type="submit" disabled={busy}>{busy?"Submitting…":review?"Submit player registration →":"Review player details →"}</button></div>
 <p className="parent-form-hint">Prices and payment options appear in this account after submission, so you can review them before agreeing a place.</p>
 </form>;
}

