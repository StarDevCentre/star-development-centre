"use client";
import {useEffect,useState} from "react";
import {StaffOnboarding} from "./StaffOnboarding";
import {StaffInbox} from "./StaffInbox";
import {AdmissionsManagement} from "./AdmissionsManagement";
import "./staff-family-operations.css";

type Pane="pipeline"|"messages"|"applications";
export function StaffFamilyOperations({userId,active,initialIntakeId,selectionRequest,onOpenCalendar}:{
 userId:string;active:boolean;initialIntakeId?:string;selectionRequest?:number;onOpenCalendar:()=>void;
}){
 const [pane,setPane]=useState<Pane>("pipeline");
 const [playerForInbox,setPlayerForInbox]=useState("");
 const [inboxRevision,setInboxRevision]=useState(0);
 useEffect(()=>{if(initialIntakeId&&selectionRequest)setPane("pipeline");},[initialIntakeId,selectionRequest]);
 function openInbox(playerId:string){
  setPlayerForInbox(playerId);setInboxRevision(n=>n+1);setPane("messages");
 }
 return <section className="staff-family-ops" aria-label="Family and onboarding operations">
  <div className="staff-family-ops-head"><div><span className="kicker">STAR · FAMILY OPERATIONS</span><h2>Family journey</h2><p>From parent registration to a free assessment and the next coaching decision.</p></div></div>
  <nav className="staff-family-ops-tabs" aria-label="Family operations">
   <button type="button" aria-current={pane==="pipeline"?"page":undefined} onClick={()=>setPane("pipeline")}>Assessment pipeline</button>
   <button type="button" aria-current={pane==="messages"?"page":undefined} onClick={()=>setPane("messages")}>Messages</button>
   <button type="button" aria-current={pane==="applications"?"page":undefined} onClick={()=>setPane("applications")}>Programme applications</button>
  </nav>
  {pane==="pipeline"&&<StaffOnboarding initialIntakeId={initialIntakeId} selectionRequest={selectionRequest}
   onOpenInbox={openInbox} onOpenAdmissions={()=>setPane("applications")} onOpenCalendar={onOpenCalendar}/>}
  {pane==="messages"&&<div className="staff-family-ops-panel"><p className="staff-family-ops-hint">Secure family messaging requires an approved guardian-player link. The original Inbox remains available from navigation.</p>
   <StaffInbox key={playerForInbox+":"+inboxRevision} userId={userId} initialPlayerId={playerForInbox} active={active&&pane==="messages"}/>
  </div>}
  {pane==="applications"&&<div className="staff-family-ops-panel"><p className="staff-family-ops-hint">An assessment does not automatically enrol a player. Programme applications are reviewed separately.</p><AdmissionsManagement userId={userId}/></div>}
 </section>;
}
