export type PracticeDiagram = {width:number;length:number;people:{label:string;x:number;y:number;role:string}[];arrows:{x1:number;y1:number;x2:number;y2:number;kind:string;label:string}[];goals:string[];caption:string;targets?:{x1:number;y1:number;x2:number;y2:number;label:string}[];zones?:{x:number;y:number;w:number;h:number;label:string}[]};
export type PracticeSource = {diagram?:string;publisher:string;title:string;url:string;original:string;section:string;adaptation:string;checked:string};
export type PracticeDetail = {organisation:string[];sequence:string[];coaching:string[];adaptations:string[];timing:string;success:string;diagram:PracticeDiagram};
export type Activity = {diagram?:PracticeDiagram;detail?:PracticeDetail;source?:PracticeSource|null;id?: string; category?: string; format?: string; kind?: string; players?: string; age?: string; title: string; minutes: number; setup: string; points: string; progression: string; equipment: string};
export type Plan = {focus: string; group: string; target: number; activities: Activity[]};
export type SavedPlan = {id: string; title: string; plan: Plan; updated_at: string};
export type LibraryFilters = {query: string; category: string; theme: string; duration: string; favouritesOnly: boolean; favourites: string[]; sort: string;equipment?:string;space?:string};

export const themes = ["Passing & receiving", "Dribbling & turning", "Finishing", "Defending", "Movement & support", "Decisions & scanning", "Goalkeeping", "Reflection & recovery"];
const themePatterns = [/pass|receiv|touch|bounce|connect|distribut|throw|roll-out/i, /dribbl|turn|carry|carrying|feint|shield|escape|slalom|sole|reverse/i, /finish|shoot|shot|strike|cutback|volley|scor/i, /defen|press|intercept|delay|recover|tackl|regain|block/i, /mov|support|overlap|underlap|run|spin|space|angle/i, /scan|decid|decision|choos|choice|recogn|signal|read|look|cue/i, /goalkeep|keeper|catch|save|handling/i, /reflect|review|cool-down|relax|breath/i];
export const activityKey = (a: Activity) => a.id || a.title;
export function activityThemes(a: Activity): string[] {
  const text = `${a.title} ${a.points} ${a.format || ""}`;
  return themes.filter((_, i) => themePatterns[i].test(text));
}
export function spaceCategory(a:Activity){const match=a.setup.match(/(\d+(?:\.\d+)?)\s*(?:m|metres?)?\s*(?:[×x]|by)\s*(\d+(?:\.\d+)?)\s*(?:m|metres?)/i);if(!match)return 'flexible';return Math.max(Number(match[1]),Number(match[2]))<=15?'compact':'larger';}
export function filterLibrary(library: Activity[], filters: LibraryFilters): Activity[] {
  const words = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = library.filter(a => {
    const tags = activityThemes(a);
    const haystack = [a.title, a.setup, a.points, a.progression, a.equipment, a.players, a.category, a.format, a.kind, ...tags].join(" ").toLowerCase();
    return (!filters.category || a.category === filters.category)
      && (!filters.equipment || (filters.equipment==="basic"?!/goal|wall|rebound|bibs|gloves|target|surface|landing|obstacle|water/i.test(a.equipment):a.equipment.toLowerCase().includes(filters.equipment)))
      && (!filters.space || spaceCategory(a)===filters.space)
      && (!filters.theme || tags.includes(filters.theme))
      && (!filters.duration || (filters.duration === "short" ? a.minutes <= 15 : a.minutes > 15))
      && (!filters.favouritesOnly || filters.favourites.includes(activityKey(a)))
      && words.every(word => haystack.includes(word));
  });
  if (filters.sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
  if (filters.sort === "duration") result.sort((a, b) => a.minutes - b.minutes || a.title.localeCompare(b.title));
  return result;
}
export const blankPlan = (): Plan => ({focus: "", group: "", target: 60, activities: []});
export const totalMinutes = (plan: Plan) => plan.activities.reduce((sum, a) => sum + a.minutes, 0);
export function sessionTimeline(plan: Plan) {
  let start = 0;
  return plan.activities.map(a => { const row = {start, end: start + a.minutes}; start = row.end; return row; });
}
export function moveActivity(plan: Plan, from: number, by: number): Plan {
  const to = from + by;
  if (from < 0 || from >= plan.activities.length || to < 0 || to >= plan.activities.length) return plan;
  const activities = [...plan.activities];
  [activities[from], activities[to]] = [activities[to], activities[from]];
  return {...plan, activities};
}
export function planIssue(title: string, plan: Plan): string {
  if (!title.trim() || title.length > 100) return "Give your session a title (up to 100 characters).";
  if (!Number.isInteger(plan.target) || plan.target < 1 || plan.target > 360) return "Choose a target duration of 1–360 whole minutes.";
  if (!plan.activities.length || plan.activities.length > 30) return "Add between 1 and 30 practices to your session.";
  const invalid = plan.activities.findIndex(a => !a.title.trim() || !a.setup.trim() || !Number.isInteger(a.minutes) || a.minutes < 1 || a.minutes > 120);
  return invalid < 0 ? "" : `Practice ${invalid + 1} needs a name, setup and 1–120 whole minutes.`;
}
