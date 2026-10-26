"use client";
import { useEffect, useRef, useState } from "react";
import { PlayerSpace } from "./PlayerSpace";
import { todayInLondon } from "../lib/achievementBadges";
import {emptyPortalFeatures,type PortalFeatureActions} from "../lib/playerPortalFeatures";
import { addDays, defaultProfile, weekOf, type GoalEvent, type SpaceData } from "../lib/playerSpace";

function sampleData(): SpaceData {
  const today = todayInLondon();
  const week = weekOf(today);
  return {
    ...emptyPortalFeatures,
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
    sessions: [{id:'sample-session',player_id:'sample-player',title:'First touch, next move',starts_at:addDays(today,1)+'T17:00:00Z',ends_at:addDays(today,1)+'T18:00:00Z',venue:'STAR training pitch · meet by the entrance',coach_focus:'Look up before you receive the ball, then choose your next touch with confidence.',kit_list:['Football kit','Boots','Shin pads','Water bottle','Weather-appropriate layers']}],
    coachNotes:[{id:'sample-weekly-note',player_id:'sample-player',week_start:week,body:'Alex, I loved your determination with both feet last week. This week, focus on a quick look over your shoulder before you receive a pass. Keep asking questions and enjoy trying things.',updated_at:today+'T09:00:00Z'}],
    messages:[{id:'sample-message-1',player_id:'sample-player',sender_id:'sample-coach',sender_role:'coach',body:'What would help you feel ready for our next session? You can ask me here, and your parent or guardian can follow our conversation.',created_at:today+'T09:00:00Z'}],
    matchJournal:[{id:'sample-match',player_id:'sample-player',match_date:addDays(today,-2),opponent:'Weekend friendly',positions:['Midfielder'],minutes:40,things_tried:'I looked up before receiving and tried a first-time pass.',proud_moment:'I encouraged a teammate after a tricky moment.',lessons:'A quick look over my shoulder helped me find space.',created_at:addDays(today,-2)+'T15:00:00Z'}],
    notifications:[{id:'sample-notification-1',player_id:'sample-player',category:'message',title:'Your weekly coach message is ready',body:'A personal focus for your week is waiting in your inbox.',tab:'messages',created_at:today+'T09:00:00Z'},{id:'sample-notification-2',player_id:'sample-player',category:'session',title:'Get ready for your next session',body:'Check your kit and let your coach know what you want help with.',tab:'home',created_at:today+'T09:01:00Z'}],
    sharingGroups:[{id:'sample-group',name:'Sample STAR teammates',player_ids:['sample-player']}],
    sharingFeed:{'sample-player':[{achievement_id:'sample-teammate-award',alias:'Sam on the ball',title:'Character Builder',badge_id:'character-builder',awarded_on:today}]},
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
  const actions:PortalFeatureActions={
    onSavePreparation:async(playerId,sessionId,help,kit)=>setData(current=>({...current,preparations:[{player_id:playerId,session_id:sessionId,help_request:help,checked_kit:kit},...current.preparations.filter(p=>p.session_id!==sessionId)]})),
    onSendMessage:async(playerId,body)=>setData(current=>({...current,messages:[...current.messages,{id:`sample-message-${current.messages.length+1}`,player_id:playerId,sender_id:'sample',sender_role:'player',body,created_at:new Date().toISOString()}]})),
    onSaveMatchPlan:async(playerId,date,items)=>setData(current=>({...current,matchPlans:[{player_id:playerId,match_date:date,checked_items:items},...current.matchPlans.filter(p=>!(p.player_id===playerId&&p.match_date===date))]})),
    onSaveMatch:async(playerId,value,id)=>setData(current=>({...current,matchJournal:[{...value,player_id:playerId,id:id||`sample-match-${current.matchJournal.length+1}`,created_at:new Date().toISOString()},...current.matchJournal.filter(j=>j.id!==id)]})),
    onLearningProgress:async(playerId,lessonId,complete)=>setData(current=>({...current,learningProgress:complete?[{player_id:playerId,lesson_id:lessonId,completed_at:new Date().toISOString()},...current.learningProgress.filter(p=>p.lesson_id!==lessonId)]:current.learningProgress.filter(p=>p.lesson_id!==lessonId)})),
    onReadNotifications:async ids=>setData(current=>({...current,notificationReads:[...new Set([...current.notificationReads,...ids])]})),
    onShareAward:async(playerId,awardId,share)=>setData(current=>{const award=current.awards.find(a=>a.id===awardId)!;const alias=current.showcases.find(s=>s.player_id===playerId)?.alias||'STAR player';return {...current,sharedAwards:share?[{player_id:playerId,achievement_id:awardId},...current.sharedAwards.filter(s=>s.achievement_id!==awardId)]:current.sharedAwards.filter(s=>s.achievement_id!==awardId),sharingFeed:{...current.sharingFeed,[playerId]:share?[{achievement_id:awardId,alias,title:award.title,badge_id:award.badge_id,awarded_on:award.awarded_on},...(current.sharingFeed[playerId]||[]).filter(a=>a.achievement_id!==awardId)]:(current.sharingFeed[playerId]||[]).filter(a=>a.achievement_id!==awardId)}};}),
    onSaveAlias:async(playerId,alias)=>setData(current=>({...current,showcases:[{player_id:playerId,alias},...current.showcases.filter(s=>s.player_id!==playerId)],sharingFeed:{...current.sharingFeed,[playerId]:(current.sharingFeed[playerId]||[]).map(a=>current.awards.some(own=>own.id===a.achievement_id)?{...a,alias}:a)}}))
  };
  return <PlayerSpace {...actions} actorRole="player" demo userKey="sample" data={data} onRefresh={() => setData(sampleData())} onUpdateProfile={async (playerId,patch,photo)=>{
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
