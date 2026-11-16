import {supabaseBrowser} from './supabaseBrowser';
export async function safeguarding<T=unknown>(action:string,data:Record<string,unknown>={}):Promise<T>{
 if(!supabaseBrowser)throw new Error('Secure connection unavailable.');
 const{data:result,error}=await supabaseBrowser.rpc('star_safeguarding',{p_action:action,p_data:data});
 if(error){if(error.code==='42501'&&typeof window!=='undefined')window.dispatchEvent(new Event('star-safeguarding-access-denied'));throw new Error(error.message||'Unable to confirm this request. Please retry.');}
 return result as T;
}
export type SafeCase={id:string;reference:string;subject:string;source:string;original_body:string;parent_requested:boolean;status:string;priority:string;assigned_to:string|null;review_at:string|null;retention_review_at:string|null;legal_hold:boolean;created_at:string;updated_at:string;revision:number};
export type SafeEvent={id:string;actor_id:string;kind:string;body:string;shared_with_player:boolean;occurred_at:string;recorded_at:string};
export type SafeTask={id:string;title:string;assigned_to:string;due_at:string;completed_at:string|null};
export type SafeAudit={id:number;actor_id:string;action:string;recorded_at:string};
export type SafeWorkspace={case:SafeCase;events:SafeEvent[];tasks:SafeTask[];audit:SafeAudit[]};
export type SafeStaff={id:string;label:string};
export type SafeSummary={unread:number;new:number;overdue:number;reviews:number};
