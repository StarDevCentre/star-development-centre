import type {SupabaseClient} from '@supabase/supabase-js';
import {assessmentJourney} from './staffFamilyJourney';
export type ActionIntake={id:string;first_name:string;last_name:string;assessment_status:string;assessment_requested_at:string|null;assessment_contacted_at:string|null;assessment_starts_at:string|null;completed_at:string|null;guardian_reviewed_at:string|null;created_at:string};
export type ActionRequest={id:string;player_id:string;request_type:string;created_at:string};
export type StaffAction={id:string;targetId:string;area:'onboarding'|'sessionRequests';category:'assessments'|'onboarding'|'sessions';name:string;task:string;since:string};
export const actionIntakeSelect='id,first_name,last_name,assessment_status,assessment_requested_at,assessment_contacted_at,assessment_starts_at,completed_at,guardian_reviewed_at,created_at';
export function intakeAction(p:ActionIntake):StaffAction|null{
 const name=[p.first_name,p.last_name].filter(Boolean).join(' ').trim()||'Player name not yet entered';
 const base={id:'intake:'+p.id,targetId:p.id,area:'onboarding' as const,name};
 if(p.assessment_status==='requested')return {...base,category:'assessments',since:p.assessment_requested_at||p.created_at,task:!p.completed_at||!p.guardian_reviewed_at?'Parent completion or review needed before confirmation':!p.assessment_contacted_at?(assessmentJourney(p).urgency==='due'?'Contact family about assessment — overdue 12-hour target':'Contact family about assessment'):'Agree assessment time and venue'};
 if(['not_requested','confirmed'].includes(p.assessment_status)&&(!p.completed_at||!p.guardian_reviewed_at))return {...base,category:'onboarding',since:p.created_at,task:!p.completed_at?'Awaiting family: finish onboarding':'Awaiting parent: review and submit'};
 if(p.assessment_status==='confirmed'&&assessmentJourney(p).stage==='record_outcome')return {...base,category:'assessments',since:p.assessment_starts_at||p.created_at,task:'Review assessment outcome — appointment time has passed'};
 return null;
}
export function buildStaffActions(intakes:ActionIntake[],requests:ActionRequest[],players:{id:string;first_name:string;last_name:string}[]):StaffAction[]{
 const names=new Map(players.map(p=>[p.id,[p.first_name,p.last_name].join(' ').trim()]));
 const kinds:Record<string,string>={absence:'Review reported absence',cancellation:'Review cancellation request',reschedule:'Review request for another date'};
 const unique=new Map(intakes.map(p=>[p.id,p]));
 return [...Array.from(unique.values()).flatMap(p=>{const action=intakeAction(p);return action?[action]:[]}),...requests.map(r=>({id:'request:'+r.id,targetId:r.id,area:'sessionRequests' as const,category:'sessions' as const,name:names.get(r.player_id)||'Player',task:kinds[r.request_type]||'Review session request',since:r.created_at}))].sort((a,b)=>(Date.parse(a.since)||0)-(Date.parse(b.since)||0)||a.id.localeCompare(b.id));
}
export async function loadStaffActions(db:SupabaseClient){
 const outcomeCutoff=new Date(Date.now()-30*60000).toISOString();
 const [assessments,outcomes,onboarding,requests]=await Promise.all([
  db.from('player_intakes').select(actionIntakeSelect,{count:'exact'}).eq('assessment_status','requested').order('assessment_requested_at').order('id').limit(100),
  db.from('player_intakes').select(actionIntakeSelect,{count:'exact'}).eq('assessment_status','confirmed').lte('assessment_starts_at',outcomeCutoff).order('assessment_starts_at').order('id').limit(100),
  db.from('player_intakes').select(actionIntakeSelect,{count:'exact'}).in('assessment_status',['not_requested','confirmed']).or('completed_at.is.null,guardian_reviewed_at.is.null').order('created_at').order('id').limit(100),
  db.from('family_session_requests').select('id,player_id,request_type,created_at',{count:'exact'}).eq('status','pending').order('created_at').order('id').limit(100),
 ]);
 if(assessments.error||outcomes.error||onboarding.error||requests.error)throw Error('Action list unavailable');
 const ids=Array.from(new Set((requests.data||[]).map(r=>r.player_id)));
 const players=ids.length?await db.from('coaching_players').select('id,first_name,last_name').in('id',ids):{data:[],error:null};
 if(players.error)throw Error('Action list unavailable');
 return {items:buildStaffActions([...(assessments.data||[]),...(outcomes.data||[]),...(onboarding.data||[])] as ActionIntake[],(requests.data||[]) as ActionRequest[],players.data||[]),counts:{assessments:(assessments.count??0)+(outcomes.count??0),onboarding:onboarding.count??0,sessions:requests.count??0}};
}
