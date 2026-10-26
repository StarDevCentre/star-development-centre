"use client";
import { useEffect, useRef, useState } from "react";
import { PlayerSpace } from "./PlayerSpace";
import { todayInLondon } from "../lib/achievementBadges";
import { addDays, defaultProfile, weekOf, type SpaceData } from "../lib/playerSpace";

function sampleData(): SpaceData {
  const today = todayInLondon();
  const week = weekOf(today);
  return {
    players: [{ id: "sample-player", first_name: "Alex", last_name: "", programme: "Development" }],
    awards: [
      { id: "sample-award-1", player_id: "sample-player", badge_id: "first-steps-bronze", title: "First Steps", description: "You kept trying a new first-touch technique, even when it felt tricky. That determination deserves celebrating.", awarded_on: today },
      { id: "sample-award-2", player_id: "sample-player", badge_id: "star-legend-legendary", title: "STAR Legend", description: "For the effort, encouragement and positive energy you bring to every session.", awarded_on: today },
      { id: "sample-award-3", player_id: "sample-player", badge_id: "character-builder", title: "Character Builder", description: "You helped a teammate find their confidence and showed real kindness on and off the pitch.", awarded_on: today }
    ],
    assignments: [{ id: "sample-challenge", player_id: "sample-player", goal_id: "sample-goal-3", title: "First-touch finesse", instructions: "Set out two cone gates. Have a parent or guardian pass the ball towards you. Take your first touch through a gate, turn and pass back. Try both feet and look up before the ball arrives. Take breaks when you need them.", target: "15 minutes · ball + cones · control, turn, play", due_date: null, created_at: today + "T12:00:00Z", week_start: week, practice_day: 1, suggested_minutes: 15, equipment: "Ball + 2 cones", is_optional: false },
      { id: "sample-friday", player_id: "sample-player", goal_id: null, title: "Head-up dribble", instructions: "Place three markers in a safe space. Dribble between them, looking up before each turn. Ask a parent to call out a colour for you to spot. Pause whenever you need a breather.", target: "Notice what is around you before you turn.", due_date: addDays(week,4), created_at: today+"T12:00:00Z", week_start: week, practice_day: 4, suggested_minutes: 10, equipment: "Ball + 3 markers", is_optional: false },
      { id: "sample-extra", player_id: "sample-player", goal_id: null, title: "Weak-foot explorer", instructions: "Fancy an extra? In a safe space with a parent, try ten gentle passes using your weaker foot. Aim for a marker and count your own best effort. Stop whenever you want.", target: "Try something new. There is no score to beat.", due_date: null, created_at: today+"T12:00:00Z", week_start: null, practice_day: null, suggested_minutes: 5, equipment: "Ball + a marker", is_optional: true }],
    diary: [
      { id: "sample-diary-1", assignment_id: "sample-challenge", practice_date: today, minutes: 15, reflection: "My left-foot touches felt more comfortable. Next time I’ll try looking up a little earlier.", created_at: today + "T10:00:00Z" },
      { id: "sample-diary-2", assignment_id: "sample-challenge", practice_date: today, minutes: 15, reflection: "I tried a smaller gate and kept the ball closer when I turned.", created_at: today + "T11:00:00Z" }
    ],
    feedback: [{ diary_id: "sample-diary-2", feedback: "Great effort this week! I love how you’re experimenting with both feet. Keep your head up before the pass arrives.", reviewed_at: today + "T12:00:00Z" }],
    goals: [
      { id: "sample-goal-1", player_id: "sample-player", goal: "Try using both feet in practice", status: "achieved" },
      { id: "sample-goal-2", player_id: "sample-player", goal: "Encourage a teammate every session", status: "achieved" },
      { id: "sample-goal-3", player_id: "sample-player", goal: "Play with your head up", status: "working_on" }
    ],
    sessions: [],
    assessments: ["Technical", "Tactical", "Physical", "Psychological", "Social"].map((category, index) => ({ id: "sample-assessment-" + index, player_id: "sample-player", category, rating: [3, 3, 4, 4, 4][index], assessed_on: today })),
    profiles: [],
    celebrated: ["sample-award-2", "sample-award-3"],
    personalGoals: [{ id: "sample-personal-goal", player_id: "sample-player", goal: "Try my weaker foot in every practice", target_date: addDays(week,13), status: "active" }],
    reports: []
  };
}

export function PlayerSpaceDemo() {
  const [data, setData] = useState(sampleData);
  const photoUrls = useRef<string[]>([]);
  useEffect(()=>()=>{photoUrls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
  return <PlayerSpace demo userKey="sample" data={data} onRefresh={() => setData(sampleData())} onUpdateProfile={async (playerId,patch,photo)=>{
    let photoUrl:string|undefined;
    if(photo) { photoUrl=URL.createObjectURL(photo); photoUrls.current.push(photoUrl); }
    setData(current=>{const old=current.profiles.find(p=>p.player_id===playerId);return {...current,profiles:[...current.profiles.filter(p=>p.player_id!==playerId),{...defaultProfile,...old,...patch,player_id:playerId,photo_path:null,photo_url:photo===null?undefined:photoUrl||old?.photo_url}]};});
  }} onCelebrate={async ids=>setData(current=>({...current,celebrated:[...new Set([...current.celebrated,...ids])]}))} onSaveGoal={async (playerId,value,goalId)=>setData(current=>({...current,personalGoals:[{...value,player_id:playerId,id:goalId||`sample-goal-${current.personalGoals.length+1}`},...current.personalGoals.filter(g=>g.id!==goalId)]}))} onSavePractice={async value => { setData(current => ({ ...current, diary: [{ ...value, id: "sample-entry-" + (current.diary.length + 1), created_at: new Date().toISOString() }, ...current.diary] })); }}/>;
}
