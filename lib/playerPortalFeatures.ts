import type { SpaceSession } from './playerSpace';
import type {PlayerSquad,SquadInput} from './playerSquad';
export type SessionPreparation={session_id:string;player_id:string;help_request:string;checked_kit:string[]};
export type CoachNote={id:string;player_id:string;week_start:string;body:string;updated_at:string};
export type PortalMessage={id:string;player_id:string;sender_id:string;sender_role:'player'|'guardian'|'coach';body:string;created_at:string};
export type MatchPlan={player_id:string;match_date:string;checked_items:string[]};
export type MatchJournal={id:string;player_id:string;match_date:string;opponent:string;positions:string[];minutes:number;things_tried:string;proud_moment:string;lessons:string;created_at:string};
export type MatchInput=Omit<MatchJournal,'id'|'player_id'|'created_at'>;
export type PortalNotification={id:string;player_id:string;category:string;title:string;body:string;tab:'home'|'training'|'journey'|'trophies'|'messages'|'learn';created_at:string};
export type LearningProgress={player_id:string;lesson_id:string;completed_at:string};
export type SharedAward={achievement_id:string;player_id:string};
export type Showcase={player_id:string;alias:string};
export type SharedTrophy={achievement_id:string;alias:string;title:string;badge_id:string|null;awarded_on:string};
export type SharingGroup={id:string;name:string;player_ids?:string[]};
export type PortalFeatures={squads:PlayerSquad[];preparations:SessionPreparation[];coachNotes:CoachNote[];messages:PortalMessage[];matchPlans:MatchPlan[];matchJournal:MatchJournal[];learningProgress:LearningProgress[];notifications:PortalNotification[];notificationReads:string[];sharedAwards:SharedAward[];showcases:Showcase[];sharingGroups:SharingGroup[];sharingFeed:Record<string,SharedTrophy[]>};
export const emptyPortalFeatures:PortalFeatures={squads:[],preparations:[],coachNotes:[],messages:[],matchPlans:[],matchJournal:[],learningProgress:[],notifications:[],notificationReads:[],sharedAwards:[],showcases:[],sharingGroups:[],sharingFeed:{}};
export type PortalFeatureActions={
 onSaveSquad:(playerId:string,squad:SquadInput)=>Promise<void>;
 onBootAnswer:(playerId:string,itemId:string,choice:string)=>Promise<void>;
 onSavePreparation:(playerId:string,sessionId:string,help:string,kit:string[])=>Promise<void>;
 onSendMessage:(playerId:string,body:string)=>Promise<void>;
 onSaveMatchPlan:(playerId:string,date:string,items:string[])=>Promise<void>;
 onSaveMatch:(playerId:string,value:MatchInput,id?:string)=>Promise<void>;
 onLearningProgress:(playerId:string,lessonId:string,complete:boolean)=>Promise<void>;
 onLearningAnswer:(playerId:string,itemId:string,choice:string)=>Promise<void>;
 onUnlockHairstyle:(playerId:string,hairstyle:string)=>Promise<void>;
 onReadNotifications:(ids:string[])=>Promise<void>;
 onShareAward:(playerId:string,awardId:string,share:boolean)=>Promise<void>;
 onSaveAlias:(playerId:string,alias:string)=>Promise<void>;
};
export const positions=['Goalkeeper','Defender','Midfielder','Forward'];
export const matchKit=[{id:'kit',label:'Football kit packed'},{id:'boots',label:'Boots ready'},{id:'shin-pads',label:'Shin pads packed'},{id:'water',label:'Water bottle ready'},{id:'layers',label:'Layers for the weather'},{id:'travel',label:'Time, venue and travel checked'}];
export function sessionTime(session:SpaceSession){return new Date(session.starts_at).toLocaleString('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}

