import type { PlayerAchievement } from "./achievementBadges";
export type SpacePlayer = { id: string; first_name: string; last_name: string; programme: string };
export type SpaceAssignment = { id: string; player_id: string; goal_id: string | null; title: string; instructions: string; target: string | null; due_date: string | null; created_at: string; week_start: string | null; practice_day: number | null; suggested_minutes: number | null; equipment: string | null; is_optional: boolean };
export type SpaceDiary = { id: string; assignment_id: string; practice_date: string; minutes: number; reflection: string; created_at: string };
export type SpaceFeedback = { diary_id: string; feedback: string; reviewed_at: string };
export type SpaceGoal = { id: string; player_id: string; goal: string; status: string };
export type SpaceSession = { id: string; player_id: string; title: string; starts_at: string; ends_at: string; venue: string };
export type SpaceAssessment = { id: string; player_id: string; category: string; rating: number; assessed_on: string };
export type SpaceReport = { id: string; player_id: string; review_month: string; strengths: string; development_areas: string; next_steps: string };
export type SpaceData = { players: SpacePlayer[]; awards: PlayerAchievement[]; assignments: SpaceAssignment[]; diary: SpaceDiary[]; feedback: SpaceFeedback[]; goals: SpaceGoal[]; sessions: SpaceSession[]; assessments: SpaceAssessment[]; reports: SpaceReport[]; profiles: SpaceProfile[]; personalGoals: PersonalGoal[]; celebrated: string[] };
export const emptySpaceData: SpaceData = { players: [], awards: [], assignments: [], diary: [], feedback: [], goals: [], sessions: [], assessments: [], reports: [], profiles: [], personalGoals: [], celebrated: [] };
export type PracticeInput = { assignment_id: string; practice_date: string; minutes: number; reflection: string };

export type ProfileFields = { accent: 'navy' | 'red' | 'gold'; icon: 'train' | 'ball' | 'star'; motto: string; shirt_name: string; shirt_number: number | null; ambition: string; cabinet_lights: boolean };
export type SpaceProfile = ProfileFields & { player_id: string; photo_path: string | null; photo_url?: string };
export const defaultProfile: ProfileFields = { accent: 'navy', icon: 'train', motto: 'Your game. Your journey.', shirt_name: '', shirt_number: null, ambition: '', cabinet_lights: true };
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
export const assignmentFields = 'id,player_id,goal_id,title,instructions,target,due_date,created_at,week_start,practice_day,suggested_minutes,equipment,is_optional';
