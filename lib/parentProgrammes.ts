import {playerAge,programmeForAge} from "./siteData";
import type {LinkedPlayer} from "./parentDashboard";
export type ParentRegistration={id:string;player_first_name:string;player_last_name:string;date_of_birth:string;programme:string;status:string;created_at:string;recommended_programme:string|null;enrolled_player_id:string|null;source_registration_id:string|null};
export const registrationFields="id,player_first_name,player_last_name,date_of_birth,programme,status,created_at,recommended_programme,enrolled_player_id,source_registration_id";
export const registrationStatus:Record<string,string>={draft:"Draft",submitted:"Awaiting review",under_review:"Under review",waitlisted:"Waiting list",accepted:"Accepted · arrangements to confirm",declined:"Declined",enrolled:"Enrolled"};
const currentStatuses=["submitted","under_review","waitlisted","accepted","enrolled"];
export function canonicalProgramme(value:string){return ({Sparks:"sparks",Development:"development",Flyers:"flyers",Prestige:"prestige","1-to-1":"one-to-one"} as Record<string,string>)[value]||value;}
export function registrationIdentity(r:Pick<ParentRegistration,"player_first_name"|"player_last_name"|"date_of_birth">){return [r.player_first_name,r.player_last_name,r.date_of_birth].map(v=>(v||"").trim().toLowerCase()).join("|");}
export function effectiveProgramme(r:ParentRegistration){return ["accepted","enrolled"].includes(r.status)?r.recommended_programme||r.programme:r.programme;}
export function registeredPlayers(registrations:ParentRegistration[]){const seen=new Set<string>();return registrations.filter(r=>{if(r.status==="draft"||!r.date_of_birth||!r.player_last_name)return false;const key=registrationIdentity(r);if(seen.has(key))return false;seen.add(key);return true});}
export function programmeAssignments(slug:string,registrations:ParentRegistration[],players:LinkedPlayer[]){
 const found=new Map<string,{name:string;status:string;enrolled:boolean}>();
 for(const r of registrations){if(!currentStatuses.includes(r.status)||effectiveProgramme(r)!==slug)continue;const key=registrationIdentity(r),old=found.get(key);if(!old||r.status==="enrolled")found.set(key,{name:[r.player_first_name,r.player_last_name].filter(Boolean).join(" "),status:registrationStatus[r.status],enrolled:r.status==="enrolled"});}
 for(const p of players){if(canonicalProgramme(p.programme)!==slug)continue;const r=registrations.find(r=>r.enrolled_player_id===p.id);const key=r?registrationIdentity(r):"linked:"+p.id;found.set(key,{name:p.first_name+" "+p.last_name,status:"Enrolled",enrolled:true});}
 return [...found.values()];
}
export function programmeRequestState(source:ParentRegistration,slug:string,registrations:ParentRegistration[],players:LinkedPlayer[]){
 const matching=registrations.find(r=>registrationIdentity(r)===registrationIdentity(source)&&effectiveProgramme(r)===slug&&currentStatuses.includes(r.status));
 if(matching)return registrationStatus[matching.status];
 const playerIds=registrations.filter(r=>registrationIdentity(r)===registrationIdentity(source)&&r.enrolled_player_id).map(r=>r.enrolled_player_id);
 if(players.some(p=>playerIds.includes(p.id)&&canonicalProgramme(p.programme)===slug))return "Enrolled";
 return programmeForAge(slug,playerAge(source.date_of_birth))?null:"Outside age range";
}
