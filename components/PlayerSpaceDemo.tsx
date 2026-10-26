"use client";
import { useEffect, useRef, useState } from "react";
import { PlayerSpace } from "./PlayerSpace";
import { todayInLondon } from "../lib/achievementBadges";
import { addDays, defaultProfile, weekOf, type GoalEvent, type SpaceData } from "../lib/playerSpace";

function sampleData(): SpaceData {
  const today = todayInLondon();
  const week = weekOf(today);
  return {
    players: [{ id: "sample-player", first_name: "Alex", last_name: "", programme: "Development" }],
    awards: [
      { id: "sample-award-1", player_id: "sample-player", badge_id: "first-steps-bronze", title: "First Steps", description: "You kept trying a new first-touch technique, even when it felt tricky. That determination deserves celebrating.", awarded_on: addDays(today,-7) },
      { id: "sample-award-2", player_id: "sample-player", badge_id: "star-legend-legendary", title: "STAR Legend", description: "For the effort, encouragement and positive energy you bring to every session.", awarded_on: today },
      { id: "sample-award-3", player_id: "sample-player", badge_id: "character-builder", title: "Character Builder", description: "You helped a teammate find their confidence and showed real kindness on and off the pitch.", awarded_on: today }
    ],
    assignments: [{ id: "sample-challenge", player_id: "sample-player", goal_id: "sample-goal-3", title: "First-touch finesse", instructions: "Set out two cone gates. Have a parent or guardian pass the ball towards you. Take your first touch through a gate, turn and pass back. Try both feet and look up before the ball arrives. Take breaks when you need them.", target: "15 minutes · ball + cones · control, turn, play", due_date: null, created_at: today + "T12:00:00Z", week_start: week, practice_day: 1, suggested_minutes: 15, equipment: "Ball + 2 cones", is_optional: false, coaching_points: "Look up before the pass arrives.\nKeep your first touch close.\nTry both feet and take breaks." },
      { id: "sample-friday", player_id: "sample-player", goal_id: null, title: "Head-up dribble", instructions: "Place three markers in a safe space. Dribble between them, looking up before each turn. Ask a parent to call out a colour for you to spot. Pause whenever you need a breather.", target: "Notice what is around you before you turn.", due_date: addDays(week,4), created_at: today+"T12:00:00Z", week_start: week, practice_day: 4, suggested_minutes: 10, equipment: "Ball + 3 markers", is_optional: false, coaching_points: "Scan your space before each turn.\nUse small touches when changing direction." },
      { id: "sample-extra", player_id: "sample-player", goal_id: null, title: "Weak-foot explorer", instructions: "Fancy an extra? In a safe space with a parent, try ten gentle passes using your weaker foot. Aim for a marker and count your own best effort. Stop whenever you want.", target: "Try something new. There is no score to beat.", due_date: null, created_at: today+"T12:00:00Z", week_start: null, practice_day: null, suggested_minutes: 5, equipment: "Ball + a marker", is_optional: true, coaching_points: "Use a gentle pass with the inside of your foot.\nFocus on accuracy at your own pace." }],
    diary: [
      { id: "sample-diary-1", assignment_id: "sample-challenge", practice_date: addDays(today,-7), confidence: 2, enjoyment: 4, minutes: 15, reflection: "My left-foot touches felt more comfortable. Next time I’ll try looking up a little earlier.", created_at: addDays(today,-7) + "T10:00:00Z" },
      { id: "sample-diary-2", assignment_id: "sample-challenge", practice_date: today, confidence: 4, enjoyment: 5, minutes: 15, reflection: "I tried a smaller gate and kept the ball closer when I turned.", created_at: today + "T11:00:00Z" }
    ],
    feedback: [{ diary_id: "sample-diary-2", feedback: "Great effort this week! I love how you’re experimenting with both feet. Keep your head up before the pass arrives.", reviewed_at: today + "T12:00:00Z" }],
    goals: [
      { id: "sample-goal-1", player_id: "sample-player", goal: "Try using both feet in practice", status: "achieved" },
      { id: "sample-goal-2", player_id: "sample-player", goal: "Encourage a teammate every session", status: "achieved" },
      { id: "sample-goal-3", player_id: "sample-player", goal: "Play with your head up", status: "working_on" }
    ],
    sessions: [],
    assessments: ["Technical", "Tactical", "Physical", "Psychological", "Social"].map((category, index) => ({ id: "sample-assessment-" + index, player_id: "sample-player", category, rating: [3, 3, 4, 4, 4][index], assessed_on: today })),
    unlocks: ['avatar-captain','decoration-laurel'].map(cosmetic=>({player_id:'sample-player',cosmetic,unlocked_at:today+'T12:00:00Z'})),
    goalEvents: [
      {id:'sample-history-1',player_id:'sample-player',source_id:'sample-personal-goal',source:'personal',kind:'set',goal:'Try my weaker foot in every practice',occurred_at:addDays(today,-10)+'T12:00:00Z'},
      {id:'sample-history-2',player_id:'sample-player',source_id:'sample-goal-1',source:'coach',kind:'set',goal:'Try using both feet in practice',occurred_at:addDays(today,-14)+'T12:00:00Z'},
      {id:'sample-history-3',player_id:'sample-player',source_id:'sample-goal-1',source:'coach',kind:'achieved',goal:'Try using both feet in practice',occurred_at:addDays(today,-3)+'T12:00:00Z'}
    ],
    profiles: [],
    celebrated: ["sample-award-2", "sample-award-3"],
    personalGoals: [{ id: "sample-personal-goal", player_id: "sample-player", goal: "Try my weaker foot in every practice", target_date: addDays(week,13), status: "active" }],
    reports: []
  };
}

function withSampleUnlocks(data:SpaceData):SpaceData {
 const unlocks=[...data.unlocks];
 for(const player of data.players){
  const days=new Set(data.diary.filter(d=>d.minutes>0&&data.assignments.some(a=>a.id===d.assignment_id&&a.player_id===player.id)).map(d=>d.practice_date)).size;
  const badges=data.awards.filter(a=>a.player_id===player.id&&a.badge_id).length;
  const achieved=data.personalGoals.some(g=>g.player_id===player.id&&g.status==='achieved');
  const eligible=[...(badges>=1?['avatar-captain']:[]),...(badges>=3?['decoration-laurel']:[]),...(days>=3?['avatar-comet','decoration-lightning']:[]),...(achieved?['avatar-shield','decoration-starburst']:[])];
  for(const cosmetic of eligible)if(!unlocks.some(u=>u.player_id===player.id&&u.cosmetic===cosmetic))unlocks.push({player_id:player.id,cosmetic,unlocked_at:todayInLondon()+'T12:00:00Z'});
 }
 return {...data,unlocks};
}

export function PlayerSpaceDemo() {
  const [data, setData] = useState(sampleData);
  const photoUrls = useRef<string[]>([]);
  useEffect(()=>()=>{photoUrls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
  return <PlayerSpace demo userKey="sample" data={data} onRefresh={() => setData(sampleData())} onUpdateProfile={async (playerId,patch,photo)=>{
    let photoUrl:string|undefined;
    if(photo) { photoUrl=URL.createObjectURL(photo); photoUrls.current.push(photoUrl); }
    setData(current=>{const old=current.profiles.find(p=>p.player_id===playerId);return {...current,profiles:[...current.profiles.filter(p=>p.player_id!==playerId),{...defaultProfile,...old,...patch,player_id:playerId,photo_path:null,photo_url:photo===null?undefined:photoUrl||old?.photo_url}]};});
  }} onCelebrate={async ids=>setData(current=>({...current,celebrated:[...new Set([...current.celebrated,...ids])]}))} onSaveGoal={async (playerId,value,goalId)=>setData(current=>{
    const id=goalId||`sample-goal-${current.personalGoals.length+1}`;
    const old=current.personalGoals.find(g=>g.id===goalId);
    const kind:GoalEvent['kind']=!old?'set':old.status!==value.status?value.status==='achieved'?'achieved':value.status==='archived'?'archived':'reopened':'updated';
    const event:GoalEvent={id:`sample-history-${current.goalEvents.length+1}`,player_id:playerId,source_id:id,source:'personal',kind,goal:value.goal,occurred_at:new Date().toISOString()};
    return withSampleUnlocks({...current,personalGoals:[{...value,player_id:playerId,id},...current.personalGoals.filter(g=>g.id!==goalId)],goalEvents:!old||old.status!==value.status||old.goal!==value.goal?[event,...current.goalEvents]:current.goalEvents});
  })} onSavePractice={async value => { setData(current => withSampleUnlocks({ ...current, diary: [{ ...value, confidence:value.confidence??null, enjoyment:value.enjoyment??null, id: "sample-entry-" + (current.diary.length + 1), created_at: new Date().toISOString() }, ...current.diary] })); }}/>;
}
