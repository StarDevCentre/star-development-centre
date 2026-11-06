export type JourneyIntake = {
 assessment_status:string;
 assessment_requested_at:string|null;
 assessment_contacted_at:string|null;
 assessment_starts_at:string|null;
 completed_at:string|null;
 guardian_reviewed_at:string|null;
};
export type JourneyStage="waiting_family"|"contact_family"|"arrange"|"booked"|"record_outcome"|"next_steps"|"closed";
export type JourneyUrgency="waiting"|"normal"|"due";
export type JourneyAction={stage:JourneyStage;label:string;task:string;urgency:JourneyUrgency;since:string|null;dueAt:string|null};
export const assessmentContactHours=12;
const validDate=(value:string|null):number|null=>{
 if(!value)return null;
 const ms=Date.parse(value);
 return Number.isFinite(ms)?ms:null;
};
export function assessmentJourney(p:JourneyIntake,now=Date.now()):JourneyAction{
 const waiting=(!p.completed_at||!p.guardian_reviewed_at);
 const requested=validDate(p.assessment_requested_at);
 const overdueContact=requested!==null&&now-requested>=assessmentContactHours*3600000;
 const dueAt=requested!==null?new Date(requested+assessmentContactHours*3600000).toISOString():null;
 if(p.assessment_status==="not_requested"||(["requested","confirmed"].includes(p.assessment_status)&&waiting)){
  return {stage:"waiting_family",label:"Awaiting parent",task:p.completed_at?"Parent review and submission needed":"Family to complete onboarding",urgency:"waiting",since:p.assessment_requested_at,dueAt:null};
 }
 if(p.assessment_status==="requested"&&!p.assessment_contacted_at){
  return {stage:"contact_family",label:overdueContact?"Contact overdue":"Contact family",task:"Contact the parent about the free assessment; record contact only after it happens",urgency:overdueContact?"due":"normal",since:p.assessment_requested_at,dueAt};
 }
 if(p.assessment_status==="requested"){
  return {stage:"arrange",label:"Arrange assessment",task:"Agree a date and venue with the family, then confirm the booking",urgency:"normal",since:p.assessment_contacted_at,dueAt:null};
 }
 if(p.assessment_status==="confirmed"){
  const start=validDate(p.assessment_starts_at);
  const ended=start!==null&&now>=start+30*60000;
  return ended?{stage:"record_outcome",label:"Review assessment outcome",task:"Confirm the actual assessment outcome; this does not mark attendance automatically",urgency:"due",since:p.assessment_starts_at,dueAt:null}:
   {stage:"booked",label:"Assessment booked",task:"Check the 30-minute session details and welcome arrangements",urgency:"normal",since:p.assessment_starts_at,dueAt:null};
 }
 if(p.assessment_status==="completed"){
  return {stage:"next_steps",label:"Discuss next steps",task:"Review development recommendations and any separate programme application",urgency:"normal",since:p.assessment_starts_at,dueAt:null};
 }
 return {stage:"closed",label:"Closed or cancelled",task:"No active assessment action. Reopen only if the family requests it",urgency:"waiting",since:p.assessment_starts_at,dueAt:null};
}
export function assessmentPipelineCounts(rows:JourneyIntake[],now=Date.now()){
 const count={total:rows.length,awaitingParent:0,needsContact:0,contactOverdue:0,arranging:0,booked:0,needsOutcome:0,completed:0,closed:0};
 for(const row of rows){
  const stage=assessmentJourney(row,now);
  if(stage.stage==="waiting_family")count.awaitingParent++;
  if(stage.stage==="contact_family"){count.needsContact++;if(stage.urgency==="due")count.contactOverdue++;}
  if(stage.stage==="arrange")count.arranging++;
  if(stage.stage==="booked")count.booked++;
  if(stage.stage==="record_outcome")count.needsOutcome++;
  if(stage.stage==="next_steps")count.completed++;
  if(stage.stage==="closed")count.closed++;
 }
 return count;
}
export function assessmentQueueRank(p:JourneyIntake,now=Date.now()){
 const result=assessmentJourney(p,now);
 return result.stage==="contact_family"&&result.urgency==="due"?0:result.stage==="record_outcome"?1:result.stage==="contact_family"?2:result.stage==="arrange"?3:result.stage==="booked"?4:result.stage==="next_steps"?5:result.stage==="waiting_family"?6:7;
}
