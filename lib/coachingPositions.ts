import {pitchFormations,type GameFormat,type RoleGroup,type PitchCoachProfile} from './parentPitchPreview';

export const positionLabels:Record<RoleGroup,string>={keeper:'Goalkeeper',centreBack:'Centre back',fullBack:'Full back',wingBack:'Wing back',holdingMidfield:'Holding midfield',centralMidfield:'Central midfield',attackingMidfield:'Attacking midfield',leftWide:'Left wing / wide midfield',rightWide:'Right wing / wide midfield',forward:'Striker'};
export type PositionValues={format:GameFormat;formation:string;main_position:RoleGroup|null;secondary_position:RoleGroup|null;coach_focus:string};
export type CoachingPosition=PositionValues&{player_id:string;revision:number;updated_at:string;updated_by:string};
export type FamilyPosition=PositionValues&{player_id:string;source_revision:number;published_at:string};
export const positionFields='player_id,format,formation,main_position,secondary_position,coach_focus';
export const draftPositionFields=positionFields+',revision,updated_at,updated_by';
export const familyPositionFields=positionFields+',source_revision,published_at';
export const emptyPosition=():PositionValues=>({format:11,formation:'4-3-3',main_position:null,secondary_position:null,coach_focus:''});
export function availablePositions(format:number,formation:string){return [...new Set(pitchFormations.find(f=>f.format===format&&f.id===formation)?.slots.map(s=>s.group)||[])];}
export function positionProblem(value:PositionValues){
 const roles=availablePositions(value.format,value.formation);
 if(!roles.length)return 'Choose a valid game format and formation.';
 if(!value.main_position||!roles.includes(value.main_position))return 'Choose a main position available in this formation.';
 if(value.secondary_position&&(!roles.includes(value.secondary_position)||value.secondary_position===value.main_position))return 'Choose a different developing position available in this formation.';
 if(value.coach_focus.trim().length>500)return 'Keep the coaching focus to 500 characters.';
 return '';
}
export function positionValues(value:PositionValues):PositionValues{return {format:value.format,formation:value.formation,main_position:value.main_position,secondary_position:value.secondary_position,coach_focus:value.coach_focus.trim()};}
export function samePosition(a:PositionValues,b:PositionValues){return JSON.stringify(positionValues(a))===JSON.stringify(positionValues(b));}
export function parentPitchProfile(playerId:string,profiles:FamilyPosition[]):PitchCoachProfile|null{
 const value=profiles.find(p=>p.player_id===playerId);
 if(!value||positionProblem(value))return null;
 return {format:value.format,formation:value.formation,main:value.main_position,secondary:value.secondary_position,mainLabel:positionLabels[value.main_position!],secondaryLabel:value.secondary_position?positionLabels[value.secondary_position]:'Not currently set'};
}
