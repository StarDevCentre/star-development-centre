'use client';
import {supabaseBrowser} from './supabaseBrowser';
export type OrganisationThread={id:string;organisation_id:string;organisation_name:string;subject:string;link_id:string|null;last_id:number|null;updated_at:string|null;unread:number};
export type OrganisationMessage={id:string;sender_role:string;kind:string;body:string;created_at:string;own:boolean};
export type OrganisationInboxList={threads:OrganisationThread[];organisations:{id:string;name:string}[];players:{link_id:string;organisation_id:string;name:string}[]};
export async function inboxCall<T>(action:string,data:Record<string,unknown>={}):Promise<T>{
 if(!supabaseBrowser)throw new Error('Portal connection unavailable.');
 const result=await supabaseBrowser.rpc('star_organisation_inbox',{p_action:action,p_data:data});
 if(result.error)throw new Error(result.error.message);
 return result.data as T;
}
export const inboxChanged=()=>window.dispatchEvent(new Event('star:organisation-inbox-updated'));
