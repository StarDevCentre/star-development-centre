"use client";
import {useEffect,useState} from "react";
import {playerAge,programmeForAge} from "../lib/siteData";
const programmeLabels=[["sparks","STAR Sparks (ages 5–10)"],["development","Development Groups (ages 11–16)"],["flyers","STAR Flyers (ages 7–10)"],["prestige","STAR Prestige (ages 11–18)"],["one-to-one","One-to-One (ages 11–18)"],["season-support","Season Support"]];
type Props={onSave:(data:{player_first_name:string;player_last_name:string;date_of_birth:string;programme:string})=>Promise<boolean>;busy:boolean;initialProgramme?:string};
export function PlayerRegistrationDraft({onSave,busy,initialProgramme=""}:Props){
 const [first,setFirst]=useState(""),[last,setLast]=useState(""),[dob,setDob]=useState(""),[programme,setProgramme]=useState(initialProgramme);
 const [error,setError]=useState("");
 useEffect(()=>{if(initialProgramme)setProgramme(initialProgramme)},[initialProgramme]);
 const age=playerAge(dob);
 const available=programmeLabels.filter(([slug])=>!Number.isFinite(age)||programmeForAge(slug,age));
 async function submit(e:React.FormEvent){e.preventDefault();setError("");const age=playerAge(dob);if(!Number.isFinite(age)||age<5||age>18){setError("Player must be aged 5–18.");return;}if(!programmeForAge(programme,age)){setError("Select a programme available for her age.");return;}if(first.trim().length<1||last.trim().length<1){setError("Enter the player's name.");return;}if(await onSave({player_first_name:first.trim(),player_last_name:last.trim(),date_of_birth:dob,programme})){setFirst("");setLast("");setDob("");document.getElementById("programme-prices")?.scrollIntoView({block:"start"});}}
 return <form id="player-registration" className="star-portal-form" onSubmit={submit}>
 <h3>Apply for a STAR place</h3><p>Only a parent or legal guardian may complete this form. Submitting sends the application to STAR for review. It does not confirm a place or provide enrolment consent.</p>
 {error&&<p role="alert" className="star-portal-error">{error}</p>}
 <label>Player's first name<input required maxLength={100} autoComplete="off" value={first} onChange={e=>setFirst(e.target.value)}/></label>
 <label>Player's last name<input required maxLength={100} autoComplete="off" value={last} onChange={e=>setLast(e.target.value)}/></label>
 <label>Date of birth<input type="date" required value={dob} onChange={e=>{const value=e.target.value;setDob(value);const age=playerAge(value);if(Number.isFinite(age)&&!programmeForAge(programme,age))setProgramme("");}}/></label>
 <label>Interested programme<select required value={programme} onChange={e=>setProgramme(e.target.value)}><option value="">Select a programme</option>{available.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
 <p>Do not enter medical, disability, safeguarding or emergency contact information here.</p>
 <p>After submitting your registration, prices and payment options will appear above. You can review them before agreeing a place.</p>
 <button type="submit" disabled={busy}>{busy?"Submitting…":"Submit application"}</button>
 </form>;
}
