export type LinkedPlayer = {id:string;first_name:string;last_name:string;programme:string};
export type PlayerGoal = {id:string;player_id:string;goal:string;status:string};
export type FamilyReport = {id:string;player_id:string;review_month:string;strengths:string;development_areas:string;next_steps:string};
export type FamilySession = {id:string;player_id:string;title:string;starts_at:string;ends_at:string;venue:string};
export type PlayerAssessment = {id:string;player_id:string;category:string;rating:number;assessed_on:string};
export type ParentSection = "overview"|"sessions"|"development"|"practice"|"messages"|"account";

// Display helpers receive only the records already approved for the signed-in guardian.
export function parentViewForPlayer(playerId:string, goals:PlayerGoal[], reports:FamilyReport[], sessions:FamilySession[], now=Date.now()) {
  const playerGoals=goals.filter(g=>g.player_id===playerId);
  const playerReports=reports.filter(r=>r.player_id===playerId).slice().sort((a,b)=>b.review_month.localeCompare(a.review_month));
  const upcoming=sessions.filter(s=>s.player_id===playerId&&Number.isFinite(Date.parse(s.starts_at))&&Date.parse(s.ends_at)>now).slice().sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
  return {goals:playerGoals,activeGoals:playerGoals.filter(g=>g.status!=="achieved"),reports:playerReports,latestReport:playerReports[0]??null,sessions:upcoming,nextSession:upcoming[0]??null};
}
export function parentDate(value:string,options:Intl.DateTimeFormatOptions) {
  const date=new Date(value);
  return Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",...options}).format(date):"Date to be confirmed";
}
export function parentMonth(value:string) {return parentDate(value+"T12:00:00Z",{month:"long",year:"numeric"});}
