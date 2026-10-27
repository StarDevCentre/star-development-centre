export type StaffRole="owner"|"manager"|"coach"|"assistant_coach";
export type StaffSection="overview"|"workspace"|"sessions"|"players"|"attendance"|"records"|"idps"|"administration"|"families"|"familyPublishing"|"analytics"|"pathways"|"communications"|"admissions"|"sessionRequests"|"trainingHub"|"badges"|"playerSpace";
export const staffRoles:Record<StaffRole,string>={owner:"Owner",manager:"Manager",coach:"Coach",assistant_coach:"Assistant coach"};
const sections:{id:StaffSection;label:string;group:string;manager?:boolean;owner?:boolean}[]=[
 {id:"overview",label:"Home",group:"Your day"},{id:"workspace",label:"Session workspace",group:"Your day"},{id:"sessions",label:"Session planner",group:"Your day"},{id:"players",label:"Players",group:"Coaching"},{id:"idps",label:"Development plans",group:"Coaching"},{id:"records",label:"Notes & reviews",group:"Coaching"},{id:"attendance",label:"Attendance",group:"Coaching"},{id:"badges",label:"Achievement badges",group:"Coaching"},{id:"trainingHub",label:"Player training",group:"Coaching"},{id:"playerSpace",label:"Player Space coaching",group:"Coaching"},{id:"communications",label:"Family inbox",group:"Families & programmes",manager:true},{id:"admissions",label:"Programme applications",group:"Families & programmes",manager:true},{id:"sessionRequests",label:"Session requests",group:"Families & programmes",manager:true},{id:"familyPublishing",label:"Share with families",group:"Families & programmes",manager:true},{id:"families",label:"Family access",group:"Families & programmes",manager:true},{id:"pathways",label:"Player pathways",group:"Management",manager:true},{id:"analytics",label:"Session analytics",group:"Management",manager:true},{id:"administration",label:"Staff access",group:"Management",owner:true},
];
export const staffCanManage=(role:StaffRole)=>role==="owner"||role==="manager";
export function staffSections(role:StaffRole){return sections.filter(s=>(!s.owner||role==="owner")&&(!s.manager||staffCanManage(role)));}
export function staffSectionFromHash(hash:string,role:StaffRole):StaffSection|null{const id=hash.replace(/^#/,"");return staffSections(role).find(s=>s.id===id)?.id||(id==="home"?"overview":null);}
export type StaffPlayer={id:string;first_name:string;last_name:string;programme:string};
export type StaffSession={id:string;title:string;programme:string;starts_at:string;ends_at:string;venue:string|null};
export type StaffAttendance={session_id:string;player_id:string;status:string};
export type StaffGoal={id:string;player_id:string;goal:string;status:"working_on"|"achieved"};
export type StaffObservation={id:string;player_id:string;next_action:string|null;recorded_at:string};
export const staffDate=(value:string,options:Intl.DateTimeFormatOptions={weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})=>new Date(value).toLocaleString("en-GB",{...options,timeZone:"Europe/London"});
export function staffOverview(sessions:StaffSession[],recent:StaffSession[],players:StaffPlayer[],attendance:StaffAttendance[],goals:StaffGoal[],now:number){
 const upcoming=sessions.filter(s=>Date.parse(s.ends_at)>now).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
 const valid=new Set(["present","absent","late","excused"]);
 const incomplete=recent.filter(s=>Date.parse(s.ends_at)<=now).sort((a,b)=>Date.parse(b.starts_at)-Date.parse(a.starts_at)).flatMap(s=>{const roster=players.filter(p=>p.programme===s.programme);const marked=new Set(attendance.filter(a=>a.session_id===s.id&&valid.has(a.status)).map(a=>a.player_id));const unmarked=roster.filter(p=>!marked.has(p.id)).length;return unmarked?[{...s,unmarked}]:[]});
 const visibleIds=new Set(players.map(p=>p.id));
 return{upcoming,incomplete,activeGoals:goals.filter(g=>g.status==="working_on"&&visibleIds.has(g.player_id))};
}
