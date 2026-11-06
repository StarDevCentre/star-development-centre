import {attendanceSummary} from "./sessionOperations";
export type AnalyticsPlayer={id:string;programme:string};
export type AnalyticsSession={id:string;title:string;programme:string;starts_at:string};
export type AnalyticsAttendance={session_id:string;player_id:string;status:string};
export type AnalyticsRoster={session_id:string;player_id:string};
export type AnalyticsAssessment={player_id:string;assessed_on:string;category:string};
export type AnalyticsObservation={player_id:string;recorded_at:string;recorded_by:string};
export type AnalyticsGoal={player_id:string;status:string};
export type AnalyticsData={
 players:AnalyticsPlayer[];sessions:AnalyticsSession[];attendance:AnalyticsAttendance[];
 participants:AnalyticsRoster[];assessments:AnalyticsAssessment[];
 observations:AnalyticsObservation[];goals:AnalyticsGoal[];
};
export const emptyAnalytics=():AnalyticsData=>({players:[],sessions:[],attendance:[],participants:[],assessments:[],observations:[],goals:[]});
export const assessmentCategories=["Technical","Tactical","Physical","Psychological","Social"] as const;
export const percentage=(a:number,b:number)=>b?Math.round(100*a/b)+"%":"—";
const allowed=new Set(["attended","present","late","absent","no_show","excused"]);
const attendanceKey=(sessionId:string,playerId:string)=>sessionId+":"+playerId;
export function staffAnalyticsSnapshot(data:AnalyticsData,{programme="all",days=90,now=Date.now()}:{programme?:string;days?:number;now?:number}={}){
 const since=now-days*86400000;
 const scopedPlayers=data.players.filter(p=>programme==="all"||p.programme===programme);
 const players=new Set(scopedPlayers.map(p=>p.id));
 const sessions=data.sessions.filter(s=>{
  const date=Date.parse(s.starts_at);
  return date>=since&&date<=now&&(programme==="all"||s.programme===programme);
 }).sort((a,b)=>b.starts_at.localeCompare(a.starts_at));
 const sessionIds=new Set(sessions.map(s=>s.id));
 const roster=new Set(data.participants.filter(p=>sessionIds.has(p.session_id)&&players.has(p.player_id)).map(p=>attendanceKey(p.session_id,p.player_id)));
 const marks=new Map<string,AnalyticsAttendance>();
 for(const mark of data.attendance){
  const key=attendanceKey(mark.session_id,mark.player_id);
  if(roster.has(key)&&allowed.has(mark.status.toLowerCase()))marks.set(key,mark);
 }
 const markList=[...marks.values()];
 const summary=attendanceSummary(markList,roster.size);
 const scopedAssessments=data.assessments.filter(a=>{
  const date=Date.parse(a.assessed_on+"T12:00:00Z");
  return players.has(a.player_id)&&date>=since&&date<=now;
 });
 const scopedObservations=data.observations.filter(o=>players.has(o.player_id)&&Date.parse(o.recorded_at)>=since&&Date.parse(o.recorded_at)<=now);
 const goals=data.goals.filter(g=>players.has(g.player_id));
 const assessedPlayers=new Set(scopedAssessments.map(a=>a.player_id)).size;
 const observedPlayers=new Set(scopedObservations.map(o=>o.player_id)).size;
 const byCategory=assessmentCategories.map(category=>({category,count:new Set(scopedAssessments.filter(a=>a.category===category).map(a=>a.player_id)).size}));
 const bySession=sessions.slice(0,12).map(s=>{
  const sessionMarks=markList.filter(a=>a.session_id===s.id);
  const expected=[...roster].filter(k=>k.startsWith(s.id+":")).length;
  const counts=attendanceSummary(sessionMarks,expected);
  return {id:s.id,title:s.title,date:s.starts_at,expected,...counts};
 });
 const recorded=summary.present+summary.late+summary.absent+summary.excused;
 return {
  sessions,scopedPlayers,summary,
  assessedPlayers,observedPlayers,byCategory,bySession,goals,
  coachContributors:new Set(scopedObservations.map(o=>o.recorded_by)).size,
  observationsCount:scopedObservations.length,
  attendedPercentage:percentage(summary.attended,summary.eligible),
  registerCoverage:percentage(recorded,roster.size),
  rosterPlaces:roster.size,recorded,unmarked:summary.unmarked,
  needsAttendance:bySession.filter(s=>s.unmarked>0).length
 };
}
