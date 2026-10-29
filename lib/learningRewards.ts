import {footballActivities} from './playerActivities';
import {quizQuestions} from './playerLearning';
import type {LearningProgress} from './playerPortalFeatures';
import type {SpaceUnlock} from './playerSpace';
export const quizRounds=[
 {id:'football-foundations',title:'Football Foundations',questions:['keeper-support','defensive-connection','forward-first-touch','scan-information','after-the-pass']},
 {id:'teamwork-trailblazers',title:'Teamwork & Trailblazers',questions:['six-protect-and-connect','press-and-cover','earps-2023-award','williamson-euro-captain','shaw-helps-jamaica']}
] as const;
export const learningRewards=[
 {id:'pass',title:'Pass Finder',activity:'Spot the Pass',kind:'theme',value:'passing-lanes',extra:'Passing Lanes',description:'Dotted passing routes and gold connection points.',motif:'pass'},
 {id:'space',title:'Space Explorer',activity:'Find the Space',kind:'theme',value:'open-pitch',extra:'Open Pitch',description:'Pitch markings and spacious outlined zones.',motif:'space'},
 {id:'next',title:'Game Reader',activity:'What Happens Next?',kind:'frame',value:'next-move',extra:'Next Move',description:'An angular border with branching arrows.',motif:'next'},
 {id:'touch',title:'First Touch Thinker',activity:'First-Touch Choices',kind:'decoration',value:'touch-trail',extra:'Touch Trail',description:'A football following a curved trail.',motif:'touch'},
 {id:'defend',title:'Danger Defender',activity:'Defend the Danger',kind:'frame',value:'hold-line',extra:'Hold the Line',description:'A segmented defensive border with a shield.',motif:'defend'},
 {id:'counter',title:'Counter Creator',activity:'Counterattack Creator',kind:'decoration',value:'breakaway',extra:'Breakaway',description:'Forward arrows and a football on the move.',motif:'counter'},
 {id:'keeper-position',title:'Angle Keeper',activity:'Goalkeeper: Own the Angle',kind:'frame',value:'between-posts',extra:'Between the Posts',description:'Goalpost corners and a subtle net border.',motif:'keeper'},
 {id:'keeper-distribution',title:'Build-up Keeper',activity:'Goalkeeper: Play Out',kind:'theme',value:'build-back',extra:'Build from the Back',description:'Passing routes spreading out from the goal.',motif:'distribution'},
 {id:'football-foundations',title:'Football Foundations',activity:'Football Foundations quiz',kind:'theme',value:'notebook',extra:'Football Notebook',description:'Coaching-board sketches, routes and football notes.',motif:'book'},
 {id:'teamwork-trailblazers',title:'Teamwork & Trailblazers',activity:'Teamwork & Trailblazers quiz',kind:'frame',value:'learning-crest',extra:'Learning Crest',description:'A gold border with a book and football crest.',motif:'crest'}
] as const;
export const learningHairstyles=[
 {key:'high-bun',label:'High bun',description:'A rounded bun with loose strands.'},
 {key:'double-braids',label:'Double braids',description:'Two distinct braids behind the shoulders.'},
 {key:'half-up',label:'Half-up waves',description:'Loose waves with the upper section tied back.'},
 {key:'curly-ponytail',label:'Curly ponytail',description:'A high ponytail with defined curls.'},
 {key:'twisted-bun',label:'Twisted bun',description:'Rope twists gathered into a compact bun.'},
 {key:'short-crop',label:'Short textured crop',description:'A textured top with neat short sides.'}
] as const;
export type LearningFrame='none'|'next-move'|'hold-line'|'between-posts'|'learning-crest';
export type LearningTheme='passing-lanes'|'open-pitch'|'build-back'|'notebook';
export type LearningDecoration='touch-trail'|'breakaway';
export type LearningReward=typeof learningRewards[number];
export function extraKey(r:LearningReward){return `${r.kind}-${r.value}`;}
export function badgeKey(id:string){return `learning-badge-${id}`;}
export function learningRequirements(id:string):string[]{
 const game=footballActivities.find(a=>a.id===id);
 if(game)return game.scenarios.map(s=>'mastery:'+s.id);
 const round=quizRounds.find(r=>r.id===id);return round?round.questions.map(q=>'quiz:'+q):[];
}
export function learningCount(id:string,progress:LearningProgress[],playerId:string){const saved=new Set(progress.filter(p=>p.player_id===playerId).map(p=>p.lesson_id));return learningRequirements(id).filter(key=>saved.has(key)).length;}
export function hairstyleChoices(unlocks:SpaceUnlock[],playerId:string){const own=unlocks.filter(u=>u.player_id===playerId);return Math.max(0,Math.min(6,learningRewards.filter(r=>own.some(u=>u.cosmetic===badgeKey(r.id))).length)-learningHairstyles.filter(h=>own.some(u=>u.cosmetic==='hair-'+h.key)).length);}
export function learningAnswerMarker(itemId:string,choice:string){
 const scene=footballActivities.flatMap(a=>a.scenarios).find(s=>s.id===itemId);
 if(scene){const answer=scene.choices.find(c=>c.id===choice);if(!answer)throw new Error('Choose an available move.');return answer.outcome==='look-again'?null:'mastery:'+itemId;}
 const question=quizQuestions.find(q=>q.id===itemId);if(!question||!/^\d$/.test(choice)||Number(choice)>=question.options.length)throw new Error('Choose an available answer.');return Number(choice)===question.answer?'quiz:'+itemId:null;
}
