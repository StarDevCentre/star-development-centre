import {supabaseBrowser as db} from './supabaseBrowser';
import {emptyPortalFeatures,type PortalFeatures,type SharedTrophy} from './playerPortalFeatures';
export async function readPortalPages<T extends {id:string}>(request:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>){const rows=new Map<string,T>();for(let from=0;;from+=500){const r=await request(from,from+499);if(r.error)throw r.error;for(const row of r.data||[])rows.set(row.id,row);if((r.data||[]).length<500)return{data:[...rows.values()],error:null};}}
export const sessionFields='id,player_id,title,starts_at,ends_at,venue,coach_focus,kit_list';
export async function loadPortalFeatures(ids:string[],userId:string):Promise<PortalFeatures>{
 if(!db||!ids.length)return{...emptyPortalFeatures};
 const r=await Promise.all([
  db.from('player_session_preparation').select('session_id,player_id,help_request,checked_kit').in('player_id',ids),
  db.from('player_coach_notes').select('id,player_id,week_start,body,updated_at').in('player_id',ids).order('week_start',{ascending:false}),
  readPortalPages((from,to)=>db!.from('player_space_messages').select('id,player_id,sender_id,sender_role,body,created_at').in('player_id',ids).order('created_at').order('id').range(from,to)),
  db.from('player_match_plans').select('player_id,match_date,checked_items').in('player_id',ids),
  readPortalPages((from,to)=>db!.from('player_match_journal').select('id,player_id,match_date,opponent,positions,minutes,things_tried,proud_moment,lessons,created_at').in('player_id',ids).order('match_date',{ascending:false}).order('id').range(from,to)),
  db.from('player_learning_progress').select('player_id,lesson_id,completed_at').in('player_id',ids),
  readPortalPages((from,to)=>db!.from('player_notifications').select('id,player_id,category,title,body,tab,created_at').in('player_id',ids).order('created_at',{ascending:false}).order('id').range(from,to)),
  readPortalPages((from,to)=>db!.from('player_notification_reads').select('id:notification_id').eq('user_id',userId).order('notification_id').range(from,to)),
  db.from('player_shared_awards').select('achievement_id,player_id').in('player_id',ids),
  db.from('player_showcase_settings').select('player_id,alias').in('player_id',ids),
  db.from('player_sharing_members').select('group_id,player_id').in('player_id',ids),
  Promise.all(ids.map(async id=>{const response=await db!.rpc('shared_trophy_feed',{viewer:id});if(response.error)throw response.error;return{id,data:response.data as SharedTrophy[]};}))
 ]);
 if(r.slice(0,11).some(result=>'error'in result&&result.error))throw new Error('Could not load player features');
 const members=r[10].data||[],groupIds=[...new Set(members.map(m=>m.group_id))];
 const groups=groupIds.length?await db.from('player_sharing_groups').select('id,name').in('id',groupIds):{data:[],error:null};if(groups.error)throw groups.error;
 return{preparations:r[0].data||[],coachNotes:r[1].data||[],messages:r[2].data||[],matchPlans:r[3].data||[],matchJournal:r[4].data||[],learningProgress:r[5].data||[],notifications:r[6].data||[],notificationReads:(r[7].data||[]).map(v=>v.id),sharedAwards:r[8].data||[],showcases:r[9].data||[],sharingGroups:(groups.data||[]).map(g=>({...g,player_ids:members.filter(m=>m.group_id===g.id).map(m=>m.player_id)})),sharingFeed:Object.fromEntries(r[11].map(v=>[v.id,v.data]))} as PortalFeatures;
}
