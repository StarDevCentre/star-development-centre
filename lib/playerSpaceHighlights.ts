import {weekOf,cosmetics,type SpaceData,type SpaceAssignment,type PracticeInput} from './playerSpace';

export type UnlockMilestone={key:string;title:string;current:number;target:number;unit:string;remaining:string;ready:boolean};
export function playerUnlockProgress(data:SpaceData,playerId:string):UnlockMilestone|null{
 const assignmentIds=new Set(data.assignments.filter(a=>a.player_id===playerId).map(a=>a.id));
 const days=new Set(data.diary.filter(d=>assignmentIds.has(d.assignment_id)&&d.minutes>0).map(d=>d.practice_date)).size;
 const badges=data.awards.filter(a=>a.player_id===playerId&&a.badge_id!==null).length;
 const goals=data.personalGoals.filter(g=>g.player_id===playerId&&g.status==='achieved').length;
 const sessions=data.ballProgress.find(p=>p.player_id===playerId)?.attended_sessions||0;
 const earned=new Set(data.unlocks.filter(u=>u.player_id===playerId).map(u=>u.cosmetic));
 const groups=[
  {keys:['avatar-comet','decoration-lightning'],current:days,target:3,unit:'different practice days',remaining:'Practice on another day when it suits you. Days do not need to be consecutive.'},
  {keys:['avatar-captain'],current:badges,target:1,unit:'coach-awarded badge',remaining:'Your coach awards badges for the effort and progress they notice.'},
  {keys:['decoration-laurel'],current:badges,target:3,unit:'coach-awarded badges',remaining:'Your coach awards badges for the effort and progress they notice.'},
  {keys:['avatar-shield','decoration-starburst'],current:goals,target:1,unit:'personal goal achieved',remaining:'Work towards a personal goal at your own pace.'},
  {keys:['ball-nike-10'],current:sessions,target:10,unit:'coaching sessions attended',remaining:'Completed sessions marked present or late by your coach count.'},
  {keys:['ball-gold-50'],current:sessions,target:50,unit:'coaching sessions attended',remaining:'Completed sessions marked present or late by your coach count.'},
 ];
 return groups.flatMap(g=>{
  const pending=g.keys.filter(key=>!earned.has(key));if(!pending.length)return [];
  const title=pending.map(key=>{const c=cosmetics.find(c=>c.key===key)!;return c.title+(key.startsWith('avatar-')?' avatar':key.startsWith('ball-')?' football':' decoration');}).join(' + ');
  return [{key:pending.join(':'),title,current:Math.min(g.current,g.target),target:g.target,unit:g.unit,remaining:g.remaining,ready:g.current>=g.target}];
 }).sort((a,b)=>b.current/b.target-a.current/a.target)[0]||null;
}
export function weeklyPlayerPlan(data:SpaceData,playerId:string,today:string){
 const week=weekOf(today),ids=new Set(data.assignments.filter(a=>a.player_id===playerId).map(a=>a.id));
 const logged=new Set(data.diary.filter(d=>ids.has(d.assignment_id)&&d.practice_date>=week&&d.practice_date<=today).map(d=>d.assignment_id));
 const available=data.assignments.filter(a=>a.player_id===playerId&&(!a.week_start||a.week_start===week));
 const day=(new Date(today+'T12:00:00Z').getUTCDay()+6)%7;
 const order=(a:SpaceAssignment,b:SpaceAssignment)=>Number(a.practice_day!==null&&a.practice_day>day)-Number(b.practice_day!==null&&b.practice_day>day)||(a.practice_day??day)-(b.practice_day??day)||a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id);
 const planned=available.filter(a=>!a.is_optional).sort(order);
 const extra=available.filter(a=>a.is_optional&&!logged.has(a.id)).sort(order)[0];
 return {planned:planned.length,logged:planned.filter(a=>logged.has(a.id)).length,challenge:planned.find(a=>!logged.has(a.id))||extra,hasPlan:available.length>0};
}
export function distinctPracticeDays(data:SpaceData,playerId:string){
 const ids=new Set(data.assignments.filter(a=>a.player_id===playerId).map(a=>a.id));
 return new Set(data.diary.filter(d=>ids.has(d.assignment_id)&&d.minutes>0).map(d=>d.practice_date));
}

export type SavedPracticeMoment={playerId:string;title:string;date:string;reflection:string;newDay:boolean;practiceDays:number};
export async function savePracticeMoment(data:SpaceData,playerId:string,value:PracticeInput,save:(value:PracticeInput)=>Promise<void>):Promise<SavedPracticeMoment>{
 const task=data.assignments.find(a=>a.id===value.assignment_id&&a.player_id===playerId);
 if(!task)throw Error('This practice is not available in this player space.');
 const days=distinctPracticeDays(data,playerId),newDay=value.minutes>0&&!days.has(value.practice_date);
 await save(value);
 return {playerId,title:task.title,date:value.practice_date,reflection:value.reflection,newDay,practiceDays:days.size+(newDay?1:0)};
}
