import {supabaseBrowser} from './supabaseBrowser';
export type Organisation={id:string;name:string;kind:'school'|'club';active?:boolean;referral_code:string};
export type Referral={id:string;organisation_id:string;player_name:string;age_band:string;guardian_name:string;guardian_email:string;reason:string;status:string;response:string;created_at:string};
export type SessionRequest={id:string;organisation_id:string;service:string;details:string;preferred_dates:string;venue:string;status:string;response:string;created_at:string};
export type Observation={id:string;link_id:string;observation:string;response:string;created_at:string};
export type SharedPlayer={link_id:string;name:string;goals:{goal:string;status:string}[];attendance:{date:string;title:string;status:string}[];updates:{id:string;feedback:string;suggested_support:string;created_at:string}[]};
export const services:Record<string,{label:string;kinds:string[]}>= {school_taster:{label:'School football taster',kinds:['school']},school_club:{label:'Lunchtime / after-school club',kinds:['school']},team_coaching:{label:'Club team coaching',kinds:['club']},player_observation:{label:'Individual player observation',kinds:['school','club']},bespoke:{label:'Bespoke request',kinds:['school','club']}};
export const referralStatuses=['submitted','reviewing','contacted','assessment_arranged','completed','closed'];
export const requestStatuses=['requested','discussing','confirmed','completed','declined'];
export const statusLabel=(s:string)=>s.replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
export const orgDate=(s:string)=>new Date(s).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'});
export async function organisationCall<T=unknown>(action:string,data:Record<string,unknown>={}):Promise<T>{
 if(!supabaseBrowser)throw Error('Portal connection is unavailable.');
 const {data:result,error}=await supabaseBrowser.rpc('star_organisation_portal',{p_action:action,p_data:data});
 if(error)throw Error(error.message||'We could not save this. Please try again.');
 return result as T;
}
