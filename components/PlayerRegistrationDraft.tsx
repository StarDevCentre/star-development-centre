"use client";
import {useState} from "react";
const programmes=[["sparks","STAR Sparks (ages 5–10)"],["development","Development Groups (ages 11–16)"],["flyers","STAR Flyers (ages 7–10)"],["prestige","STAR Prestige (ages 11–18)"],["one-to-one","One-to-One (ages 11–18)"],["season-support","Season Support"]];
type Props={onSave:(data:{player_first_name:string;player_last_name:string;date_of_birth:string;programme:string})=>Promise<void>;busy:boolean};
export function PlayerRegistrationDraft({onSave,busy}:Props){
 const [first,setFirst]=useState(""),[last,setLast]=useState(""),[dob,setDob]=useState(""),[programme,setProgramme]=useState("");
 const [error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setError("");const birth=new Date(dob+"T12:00:00Z");const age=(Date.now()-birth.getTime())/31557600000;if(!Number.isFinite(age)||age<5||age>=19){setError("Player must be aged 5–18.");return;}if(!programmes.some(p=>p[0]===programme)){setError("Select a programme.");return;}if(first.trim().length<1||last.trim().length<1){setError("Enter the player's name.");return;}await onSave({player_first_name:first.trim(),player_last_name:last.trim(),date_of_birth:dob,programme});}
 return <form className="star-portal-form" onSubmit={submit}>
 <h3>Apply for a STAR place</h3><p>Only a parent or legal guardian may complete this form. Submitting sends the application to STAR for review. It does not confirm a place or provide enrolment consent.</p>
 {error&&<p role="alert" className="star-portal-error">{error}</p>}
 <label>Player's first name<input required maxLength={100} autoComplete="off" value={first} onChange={e=>setFirst(e.target.value)}/></label>
 <label>Player's last name<input required maxLength={100} autoComplete="off" value={last} onChange={e=>setLast(e.target.value)}/></label>
 <label>Date of birth<input type="date" required value={dob} onChange={e=>setDob(e.target.value)}/></label>
 <label>Interested programme<select required value={programme} onChange={e=>setProgramme(e.target.value)}><option value="">Select a programme</option>{programmes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
 <p>Do not enter medical, disability, safeguarding or emergency contact information here.</p>
 <button type="submit" disabled={busy}>{busy?"Submitting…":"Submit application"}</button>
 </form>;
}
