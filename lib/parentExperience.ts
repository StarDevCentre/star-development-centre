import type {PlayerAssessment} from './parentDashboard';
export type AssessmentPoint={id:string;date:string;rating:number};
/** Never mix players, invent missing ratings or average separate coach assessments. */
export function assessmentTimeline(rows:PlayerAssessment[],playerId:string,category:string):AssessmentPoint[]{
 const dates=new Map<string,AssessmentPoint>();
 for(const row of rows.filter(r=>r.player_id===playerId&&r.category===category).slice().sort((a,b)=>a.id.localeCompare(b.id))){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(row.assessed_on)||!Number.isFinite(Date.parse(row.assessed_on+'T12:00:00Z'))||new Date(row.assessed_on+'T12:00:00Z').toISOString().slice(0,10)!==row.assessed_on||!Number.isFinite(row.rating)||row.rating<1||row.rating>5)continue;
  dates.set(row.assessed_on,{id:row.id,date:row.assessed_on,rating:row.rating});
 }
 return [...dates.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function parentSpaceKey(owner:string,player:string){return `star-parent-space-v1:${encodeURIComponent(owner)}:${encodeURIComponent(player)}`;}
export const parentSpaceSections=['Home','Development','Sessions','Messages','Moments','Learning','My space'] as const;
export type ParentSpaceSection=typeof parentSpaceSections[number]|'Account'|'Updates'|'Practice';
export function parentSpaceSectionFromHash(hash:string):ParentSpaceSection|null{
 let value='';try{value=decodeURIComponent(hash.replace(/^#/,''));}catch{return null;}
 const old:Record<string,ParentSpaceSection>={overview:'Home',development:'Development',sessions:'Sessions',messages:'Messages',practice:'Practice',account:'Account',updates:'Updates'};
 if(old[value])return old[value];
 return ([...parentSpaceSections,'Account','Updates','Practice'] as string[]).includes(value)?value as ParentSpaceSection:null;
}
export function calendarForSession(session:{id:string;title:string;venue:string;starts_at:string;ends_at:string},now=new Date()){
 const stamp=(value:string)=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const escape=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//STAR Development Centre//Parent Portal//EN','BEGIN:VEVENT',`UID:${session.id}@star-development-centre`,`DTSTAMP:${stamp(now.toISOString())}`,`DTSTART:${stamp(session.starts_at)}`,`DTEND:${stamp(session.ends_at)}`,`SUMMARY:${escape(session.title)}`,`LOCATION:${escape(session.venue)}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
