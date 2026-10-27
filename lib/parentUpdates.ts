import type {ParentSection} from './parentDashboard';
export type ParentUpdate={id:string;player_id:string|null;category:'message'|'report'|'session'|'programme';source_kind:string;title:string;created_at:string;read_at:string|null};
export function parentUpdateSection(category:ParentUpdate['category']):ParentSection{return category==='message'?'messages':category==='report'?'development':category==='session'?'sessions':'account';}
export function parentUpdateDescription(category:ParentUpdate['category']){return {message:'Open your family messages to read the conversation.',report:'Read the latest report shared by STAR.',session:'Check shared dates, details and request replies.',programme:'View the latest status in your registrations.'}[category];}
