import { emptyPortalFeatures, type PortalFeatures } from "./playerPortalFeatures";
import type { PlayerAchievement } from "./achievementBadges";
import {defaultHero,type HeroAppearance} from "./heroCharacter";
export type SpacePlayer = { id: string; first_name: string; last_name: string; programme: string };
export type SpaceAssignment = { id: string; player_id: string; goal_id: string | null; title: string; instructions: string; target: string | null; due_date: string | null; created_at: string; week_start: string | null; practice_day: number | null; suggested_minutes: number | null; equipment: string | null; is_optional: boolean; coaching_points: string | null };
export type SpaceDiary = { id: string; assignment_id: string; practice_date: string; minutes: number; reflection: string; created_at: string; confidence: number | null; enjoyment: number | null };
export type SpaceFeedback = { diary_id: string; feedback: string; reviewed_at: string };
export type SpaceGoal = { id: string; player_id: string; goal: string; status: string };
export type SpaceSession = { id: string; player_id: string; title: string; starts_at: string; ends_at: string; venue: string; coach_focus: string | null; kit_list: string[] };
export type SpaceAssessment = { id: string; player_id: string; category: string; rating: number; assessed_on: string };
export type SpaceReport = { id: string; player_id: string; review_month: string; strengths: string; development_areas: string; next_steps: string };
export type SpaceData = PortalFeatures & { ballProgress:{player_id:string;attended_sessions:number}[]; players: SpacePlayer[]; awards: PlayerAchievement[]; assignments: SpaceAssignment[]; diary: SpaceDiary[]; feedback: SpaceFeedback[]; goals: SpaceGoal[]; sessions: SpaceSession[]; assessments: SpaceAssessment[]; reports: SpaceReport[]; profiles: SpaceProfile[]; personalGoals: PersonalGoal[]; celebrated: string[]; unlocks: SpaceUnlock[]; goalEvents: GoalEvent[] };
export const emptySpaceData: SpaceData = { ...emptyPortalFeatures, ballProgress:[], players: [], awards: [], assignments: [], diary: [], feedback: [], goals: [], sessions: [], assessments: [], reports: [], profiles: [], personalGoals: [], celebrated: [], unlocks: [], goalEvents: [] };
export type PracticeInput = { assignment_id: string; practice_date: string; minutes: number; reflection: string; confidence?: number | null; enjoyment?: number | null };

export type ProfileFields = HeroAppearance & { accent: 'navy' | 'red' | 'gold'; icon: AvatarKey; motto: string; shirt_name: string; shirt_number: number | null; ambition: string; cabinet_lights: boolean; theme: 'midnight' | 'stadium' | 'scrapbook'; decoration: 'none' | 'lightning' | 'laurel' | 'starburst'; experience:'junior'|'senior'; preferred_positions:string[]; stronger_foot:''|'Left'|'Right'|'Both'; favourite_footballer:string; favourite_team:string; playing_teams:string; school:string };
export type SpaceProfile = ProfileFields & { player_id: string; photo_path: string | null; photo_url?: string };
export const defaultProfile: ProfileFields = { ...defaultHero, accent: 'navy', icon: 'train', motto: 'Your game. Your journey.', shirt_name: '', shirt_number: null, ambition: '', cabinet_lights: true, theme: 'midnight', decoration: 'none', experience:'junior',preferred_positions:[],stronger_foot:'',favourite_footballer:'',favourite_team:'',playing_teams:'',school:'' };
export type PersonalGoal = { id: string; player_id: string; goal: string; target_date: string | null; status: 'active' | 'achieved' | 'archived' };
export type GoalInput = Pick<PersonalGoal, 'goal' | 'target_date' | 'status'>;
export type SpaceActions = {
 onUpdateProfile: (playerId: string, patch: Partial<ProfileFields>, photo?: Blob | null) => Promise<void>;
 onSaveGoal: (playerId: string, value: GoalInput, goalId?: string) => Promise<void>;
 onCelebrate: (awardIds: string[]) => Promise<void>;
};
export function weekOf(date: string) {
 const d = new Date(date + 'T12:00:00Z');
 d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
 return d.toISOString().slice(0, 10);
}
export function addDays(date: string, days: number) {
 const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
export const assignmentFields = 'id,player_id,goal_id,title,instructions,target,due_date,created_at,week_start,practice_day,suggested_minutes,equipment,is_optional,coaching_points';

export type AvatarKey = 'train' | 'ball' | 'star' | 'captain' | 'comet' | 'shield';
export type SpaceUnlock = { player_id: string; cosmetic: string; unlocked_at: string };
export type GoalEvent = { id: string; player_id: string; source_id: string; source: 'personal' | 'coach'; kind: 'set' | 'achieved' | 'reopened' | 'archived' | 'updated'; goal: string; occurred_at: string };
export const diaryFields = 'id,assignment_id,practice_date,minutes,reflection,created_at,confidence,enjoyment';
export const cosmetics = [
 { key: 'avatar-captain', title: 'Captain', requirement: 'Earn your first badge', icon: 'captain' },
 { key: 'avatar-comet', title: 'Comet', requirement: 'Log practice on 3 different days', icon: 'comet' },
 { key: 'avatar-shield', title: 'Guardian', requirement: 'Achieve a personal goal', icon: 'shield' },
 { key: 'decoration-lightning', title: 'Lightning', requirement: 'Log practice on 3 different days', icon: 'comet' },
 { key: 'decoration-laurel', title: 'Victory leaves', requirement: 'Earn 3 badges', icon: 'trophy' },
 { key: 'decoration-starburst', title: 'Starburst', requirement: 'Achieve a personal goal', icon: 'star' },
 { key: 'ball-nike-10', title: 'Nike yellow & orange', requirement: 'Attend 10 coaching sessions', icon: 'ball' },
 { key: 'ball-gold-50', title: 'Gold 90', requirement: 'Attend 50 coaching sessions', icon: 'ball' }
] as const;
