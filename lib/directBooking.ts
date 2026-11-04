import {supabaseBrowser} from './supabaseBrowser';
export type BookingService={id:string;title:string;audience:'parent'|'school'|'club';minutes:number;price_pence:number;fixed:boolean;programme:string;max_players:number|null;description:string};
export type BookingSlot={id?:string;coach_id?:string;starts_local?:string;starts_at:string;ends_at:string;venue?:string;coach_name?:string;remaining?:number};
export type BookingOrder={id:string;title:string;total_pence:number;discount_percent:number;payment:string;venue:string;sessions:{id:string;starts_at:string;ends_at:string;cancelled:boolean;coach_name:string}[]};
export type BookingCatalogue={services:BookingService[];credits:number;orders:BookingOrder[]};
export async function bookingCall<T=unknown>(action:string,data:Record<string,unknown>={}):Promise<T>{if(!supabaseBrowser)throw new Error('Portal connection unavailable.');const r=await supabaseBrowser.rpc('star_direct_booking',{p_action:action,p_data:data});if(r.error)throw new Error(r.error.message);return r.data as T;}
export const bookingMoney=(pence:number)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(pence/100);
export const bookingTime=(stamp:string)=>new Date(stamp).toLocaleString('en-GB',{timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
export const bookingToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function blockDates(first:string,count:number){const date=first.slice(0,10),time=first.slice(10);return Array.from({length:count},(_,i)=>new Date(Date.parse(date+'T12:00:00Z')+i*7*86400000).toISOString().slice(0,10)+time);}
