export type PlayerAttendanceMark={session_id:string;status:string};
export type PlayerLinkedSession={id:string;starts_at:string;ends_at:string};
export function playerAttendanceSummary(records:PlayerAttendanceMark[],sessions:PlayerLinkedSession[]){
 const allowed=new Set(sessions.map(s=>s.id));
 const bySession=new Map<string,string>();
 for(const row of records)if(allowed.has(row.session_id)&&["present","late","absent","excused"].includes(row.status))bySession.set(row.session_id,row.status);
 const statuses=[...bySession.values()];
 const attended=statuses.filter(status=>status==="present"||status==="late").length;
 const absent=statuses.filter(status=>status==="absent").length;
 const excused=statuses.filter(status=>status==="excused").length;
 const eligible=attended+absent;
 return {marked:statuses.length,attended,absent,excused,rate:eligible?Math.round(100*attended/eligible):null};
}
export function nextLinkedSession<T extends PlayerLinkedSession>(sessions:T[],now:number):T|null{
 return [...sessions].filter(s=>Date.parse(s.ends_at)>now).sort((a,b)=>a.starts_at.localeCompare(b.starts_at))[0]||null;
}
