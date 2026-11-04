import {supabaseBrowser} from './supabaseBrowser';
export type OrganisationSession={id:string;title:string;starts_at:string;ends_at:string;venue:string;status:'scheduled'|'completed'|'cancelled';revision:number;coach_id:string|null;coach_name:string;block_id:string;block_size:number;organisation_id:string;organisation_name:string;request_id:string|null};
export type OrganisationSessionChange={id:string;session_id:string;kind:'change'|'cancel';details:string;status:'pending'|'applied'|'declined';response:string;revision:number;created_at:string};
export type OrganisationScheduleData={sessions:OrganisationSession[];changes:OrganisationSessionChange[];coaches:{id:string;name:string}[];delivered:number};
export async function scheduleCall<T=unknown>(action:string,data:Record<string,unknown>={}):Promise<T>{if(!supabaseBrowser)throw new Error('Portal connection unavailable.');const result=await supabaseBrowser.rpc('star_organisation_schedule',{p_action:action,p_data:data});if(result.error)throw new Error(result.error.message);return result.data as T;}
/** Weekly dates use civil calendar arithmetic; each start is resolved independently in Europe/London on the server. */
export function weeklySessionDates(first:string,weeks:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(first)||!Number.isInteger(weeks)||weeks<1||weeks>40)return [];
 const stamp=Date.parse(first+'T12:00:00Z');if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==first)return [];
 return Array.from({length:weeks},(_,i)=>new Date(stamp+i*7*86400000).toISOString().slice(0,10));
}
