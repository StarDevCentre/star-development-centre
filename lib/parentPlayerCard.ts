import type {SupabaseClient} from '@supabase/supabase-js';
import type {PlayerAchievement} from './achievementBadges';

export type ParentCardProfile={player_id:string;shirt_name:string;shirt_number:number|null;ambition:string;photo_path:string|null};
export type ParentCardGoal={player_id:string;goal:string;status:string};
export type ParentPlayerCardData={player_id:string;profile:ParentCardProfile|null;goal:string;award:PlayerAchievement|null;photoUrl?:string};

/** Only the selected player's own words and awards may appear in her card. */
export function parentPlayerCardFor(playerId:string,profile:ParentCardProfile|null,goals:ParentCardGoal[],awards:PlayerAchievement[]):ParentPlayerCardData{
 const ownProfile=profile?.player_id===playerId?profile:null;
 const goal=goals.find(g=>g.player_id===playerId&&g.status==='active'&&g.goal.trim())?.goal.trim()||ownProfile?.ambition.trim()||'';
 const award=awards.filter(a=>a.player_id===playerId).slice().sort((a,b)=>b.awarded_on.localeCompare(a.awarded_on))[0]||null;
 return {player_id:playerId,profile:ownProfile,goal,award};
}

/** Existing guardian/player RLS governs all reads; photos stay in private storage. */
export async function loadParentPlayerCard(db:SupabaseClient,playerId:string):Promise<ParentPlayerCardData>{
 const [profile,goals,awards]=await Promise.all([
  db.from('player_space_profiles').select('player_id,shirt_name,shirt_number,ambition,photo_path').eq('player_id',playerId).maybeSingle(),
  db.from('player_personal_goals').select('player_id,goal,status').eq('player_id',playerId).eq('status','active').order('created_at',{ascending:false}).order('id').limit(1),
  db.from('player_achievements').select('id,player_id,title,description,awarded_on,badge_id').eq('player_id',playerId).order('awarded_on',{ascending:false}).order('created_at',{ascending:false}).order('id').limit(1)
 ]);
 if(profile.error||goals.error||awards.error)throw new Error('Unable to load player card');
 const card=parentPlayerCardFor(playerId,profile.data,goals.data||[],awards.data||[]);
 const path=card.profile?.photo_path;
 if(path?.startsWith(playerId+'/')){
  const photo=await db.storage.from('player-card-photos').createSignedUrl(path,3600);
  if(photo.data?.signedUrl)card.photoUrl=photo.data.signedUrl;
 }
 return card;
}
