export type SessionAttendanceMark={player_id:string;status:string};
export type SessionFlowCounts={total:number;present:number;absent:number;late:number;excused:number;unmarked:number;marked:number;ready:boolean};

/** Every total comes from the actual session roster, never programme membership. */
export function sessionFlowCounts(rosterIds:string[],marks:SessionAttendanceMark[]):SessionFlowCounts{
 const ids=new Set(rosterIds);
 const valid=new Set(['present','absent','late','excused']);
 const latest=new Map<string,string>();
 for(const mark of marks)if(ids.has(mark.player_id)&&valid.has(mark.status))latest.set(mark.player_id,mark.status);
 const totals={present:0,absent:0,late:0,excused:0};
 for(const status of latest.values())totals[status as keyof typeof totals]++;
 const total=ids.size,marked=latest.size,unmarked=total-marked;
 return {...totals,total,marked,unmarked,ready:total>0&&unmarked===0};
}
