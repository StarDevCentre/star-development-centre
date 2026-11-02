"use client";
import {PlayerQuizRounds} from './PlayerQuizRounds';
import type {SpaceUnlock} from '../lib/playerSpace';
import {PlayerBootChallenges} from './PlayerBootLocker';
import {useEffect,useState} from 'react';
import {learningArticles,quizQuestions} from '../lib/playerLearning';
import type {LearningProgress,PortalFeatureActions} from '../lib/playerPortalFeatures';
import {SpaceIcon} from './PlayerSpaceIcons';
import {PlayerActivities} from './PlayerActivities';
import {activityProgress} from '../lib/playerActivities';
export function PlayerLearning({playerId,progress,onLearningProgress,onLearningAnswer,unlocks=[],onCollection=()=>{},onBootAnswer,onLocker,initialBoot}:{playerId:string;progress:LearningProgress[];onLearningProgress:PortalFeatureActions['onLearningProgress'];onLearningAnswer:PortalFeatureActions['onLearningAnswer'];unlocks?:SpaceUnlock[];onCollection?:()=>void;onBootAnswer:PortalFeatureActions['onBootAnswer'];onLocker:()=>void;initialBoot?:string|null}){

 const[category,setCategory]=useState<'activities'|'positions'|'tactics'|'stories'|'goalkeeping'|'players'|'clubs'|'international'|'quiz'|'boots'>('activities'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(initialBoot)setCategory('boots');},[initialBoot]);
 const ownProgress=progress.filter(p=>p.player_id===playerId);
 const complete=(id:string)=>ownProgress.some(p=>p.lesson_id===id);
 const guidesExplored=learningArticles.filter(a=>complete(a.id)).length;
 const quizCompleted=quizQuestions.filter(q=>complete('quiz:'+q.id)).length;
 const activitiesExplored=activityProgress(ownProgress,playerId).explored.size;
 async function mark(id:string,value:boolean){setBusy(true);setError('');try{await onLearningProgress(playerId,id,value);}catch(v){setError(v instanceof Error?v.message:'Could not save learning progress.');}finally{setBusy(false);}}
 return <section className="ps-learning-view"><div className="ps-title-paper ps-paper"><span className="ps-tape">GROW YOUR FOOTBALL BRAIN</span><h1>{<>KNOW THE GAME.<br/><em>PLAY YOUR WAY.</em></>}</h1><p>{'Explore positions, understand the game and meet footballers with stories worth knowing.'}</p><span className="ps-stat">{activitiesExplored} activity scenarios explored · {guidesExplored} guides explored · {quizCompleted} quiz questions completed</span></div><nav className="ps-learning-tabs" aria-label="Football learning topics">{([{id:'activities',label:'Play & explore'},{id:'boots',label:'Boot Challenges'},{id:'positions',label:'Positions'},{id:'goalkeeping',label:'Goalkeeping'},{id:'players',label:'Players'},{id:'clubs',label:'WSL Clubs'},{id:'international',label:'Lionesses'},{id:'tactics',label:'Game understanding'},{id:'stories',label:'Inspiring stories'},{id:'quiz',label:'Quiz time'}] as const).map(c=><button key={c.id} aria-pressed={category===c.id} onClick={()=>setCategory(c.id)}>{c.label}</button>)}</nav>{error&&<p className="ps-error" role="alert">{error}</p>}{category==='boots'?<PlayerBootChallenges key={playerId} playerId={playerId} progress={ownProgress} unlocks={unlocks} onBootAnswer={onBootAnswer} onLocker={onLocker} initialChallenge={initialBoot}/>:category==='activities'?<PlayerActivities key={playerId} playerId={playerId} progress={ownProgress} onLearningProgress={onLearningProgress} onLearningAnswer={onLearningAnswer} unlocks={unlocks} onCollection={onCollection}/>:category==='quiz'?<PlayerQuizRounds playerId={playerId} progress={ownProgress} unlocks={unlocks} onLearningAnswer={onLearningAnswer} onCollection={onCollection}/>:<div className="ps-learning-grid">{learningArticles.filter(a=>a.category===category).map(a=><article className="ps-learning-card ps-paper" key={a.id}><span className="ps-eyebrow">{a.level==='senior'?'MORE FOOTBALL DETAIL':category==='stories'?'FOOTBALL STORIES':'FOOTBALL KNOW-HOW'}</span><h2>{a.title}</h2><p>{a.summary}</p><details><summary>{"Read this guide"}</summary>{a.body.map((p,i)=><p key={i}>{p}</p>)}<div className="ps-coach-note"><strong>Take this with you</strong><p>{a.takeaway}</p></div><ul className="ps-learning-sources">{a.source.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>)}</ul></details><button className="ps-text-link" disabled={busy} aria-pressed={complete(a.id)} onClick={()=>void mark(a.id,!complete(a.id))}>{complete(a.id)?'Explored ✓ · mark unread':'I’ve explored this guide ✓'}</button></article>)}</div>}</section>;
}

