"use client";
import {useEffect,useRef,useState} from 'react';
import {supabaseBrowser as db} from '../lib/supabaseBrowser';
import type {PersonalGoal,SpaceActions,SpaceProfile,SpaceUnlock} from '../lib/playerSpace';
import {PlayerSpaceStyle} from './PlayerSpaceStyle';
import {PlayerCard} from './PlayerCard';
import {PlayerHeroCharacter} from './PlayerHeroCharacter';
import {PlayerPhoneAlerts} from './PlayerPhoneAlerts';
import {SpaceIcon} from './PlayerSpaceIcons';
const steps=['Welcome','Your look','Player card','Your goal','Explore','Updates'] as const;
const templates=['Look up before receiving the ball','Try my weaker foot in each practice','Encourage a teammate every session','Ask my coach when I need help','Try one brave new skill this week'];
type Progress={step:number;status:'in_progress'|'completed'|'skipped'};
type Props=Pick<SpaceActions,'onUpdateProfile'|'onSaveGoal'>&{playerId:string;name:string;userKey:string;actorRole:'player'|'guardian';profile?:SpaceProfile;unlocks:SpaceUnlock[];goals:PersonalGoal[];attendedSessions:number;demo:boolean;visible:boolean};

export function PlayerWelcome({playerId,name,userKey,actorRole,profile,unlocks,goals,attendedSessions,demo,visible,onUpdateProfile,onSaveGoal}:Props){

 const[progress,setProgress]=useState<Progress>({step:0,status:'in_progress'}),[open,setOpen]=useState(false),[ready,setReady]=useState(demo),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[goal,setGoal]=useState('');
 const root=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null),focusNext=useRef(false),saving=useRef(false),goalSaving=useRef(false);
 useEffect(()=>{let active=true;
  if(demo)return;
  void(async()=>{try{
   if(!db)throw new Error('Please sign in to save your welcome journey.');
   const r=await db.from('player_space_onboarding').select('step,status').eq('user_id',userKey).eq('player_id',playerId).maybeSingle();
   if(r.error)throw new Error('Your saved setup could not be loaded. You can still explore Player Space.');
   if(active){const saved=(r.data as Progress|null)||{step:0,status:'in_progress'};setProgress(saved);setOpen(actorRole==='player'&&saved.status==='in_progress');setReady(true);}
  }catch(value){if(active){setError(value instanceof Error?value.message:'Could not load setup.');setReady(false);}}})();
  return()=>{active=false;};
 },[playerId,userKey,actorRole,demo]);
 useEffect(()=>{if(visible&&focusNext.current){focusNext.current=false;if(open)heading.current?.focus({preventScroll:true});else root.current?.focus({preventScroll:true});root.current?.scrollIntoView({block:'start',behavior:'auto'});}},[progress.step,open,visible]);
 async function move(step:number,status:Progress['status']='in_progress'){
  if(saving.current||progress.status==='completed')return;
  saving.current=true;setBusy(true);setError('');
  try{
   const next={step,status};
   if(!demo){if(!db)throw new Error('Please sign in again.');const r=await db.from('player_space_onboarding').upsert({user_id:userKey,player_id:playerId,...next,updated_at:new Date().toISOString()},{onConflict:'user_id,player_id'});if(r.error)throw new Error('Your choices are saved, but setup progress could not be saved. Please try again.');}
   focusNext.current=true;setProgress(next);
   if(status!=='in_progress'){setOpen(false);setNotice(status==='completed'?'YOU’RE READY. Welcome to your Player Space!':'Explore at your own pace. You can continue setup later.');}
  }catch(value){setError(value instanceof Error?value.message:'Could not save setup progress.');throw value;}
  finally{saving.current=false;setBusy(false);}
 }
 const next=()=>move(Math.min(5,progress.step+1));
 if(!visible||!ready||progress.status==='completed')return null;
 return <section ref={root} tabIndex={-1} id="ps-welcome" className={`ps-welcome ${open?'ps-welcome-open ps-paper':''}`} aria-label="Welcome to Player Space">
  {!open?<div className="ps-welcome-invite"><div><span className="ps-eyebrow">MAKE THIS SPACE YOURS.</span><p>{notice||`A quick welcome journey for ${name}. Every step is optional.`}</p></div><button className="ps-action" disabled={!ready} onClick={()=>{setOpen(true);focusNext.current=true;setNotice('');setProgress(current=>({...current,status:'in_progress'}));}}>{progress.step>0||progress.status==='skipped'?'CONTINUE SETUP':'START WELCOME'}<SpaceIcon name="arrow"/></button></div>:<>
   <div className="ps-welcome-top"><span className="ps-tape">THIS SPACE IS YOURS</span><button className="ps-text-link" disabled={busy} onClick={()=>void move(progress.step,'skipped').catch(()=>{})}>Set up later ↗</button></div>
   <ol className="ps-welcome-steps" aria-label="Welcome steps">{steps.map((label,i)=><li key={label} aria-current={i===progress.step?'step':undefined}><span aria-hidden="true">{i<progress.step?'✓':i+1}</span><small>{label}</small></li>)}</ol>
   <h2 ref={heading} tabIndex={-1} className="ps-welcome-heading">{progress.step===0?`HEY, ${name.toUpperCase()}!`:progress.step===1?'YOUR HERO. YOUR LOOK.':progress.step===2?'PUT YOUR NAME ON IT.':progress.step===3?'ONE SMALL NEXT STEP.':progress.step===4?'FIND YOUR FEET.':'YOUR UPDATES. YOUR CHOICE.'}</h2>
   <p className="ps-welcome-summary">Step {progress.step+1} of {steps.length} · {steps[progress.step]}. Save choices to continue, or do this step later.</p>
   <div className="ps-welcome-body" key={progress.step}>
    {progress.step===0&&<div className="ps-welcome-intro"><div><p>{"This is your corner of STAR. Make it feel like you, find your next session and celebrate how far you’ve come."}</p><ul><li>Build your player look and card.</li><li>Choose a goal that matters to you.</li><li>Find training, coach messages and your trophy cabinet.</li></ul><p>You can change everything later. There’s no rush.</p>{demo&&<p className="ps-fineprint">This is a sample journey. All extras are unlocked and changes last for this visit.</p>}</div><PlayerHeroCharacter appearance={profile} decorative/></div>}
    {progress.step===1&&<PlayerSpaceStyle setup playerId={playerId} profile={profile} unlocks={unlocks} onUpdateProfile={onUpdateProfile} demo={demo} attendedSessions={attendedSessions} onSaved={next}/>}
    {progress.step===2&&<PlayerCard setup name={name} playerId={playerId} userKey={userKey} profile={profile} unlocks={unlocks} onUpdateProfile={onUpdateProfile} demo={demo} onSaved={next}/>}
    {progress.step===3&&<form className="ps-welcome-goal" onSubmit={async e=>{e.preventDefault();if(busy||goalSaving.current||goal.trim().length<3)return;goalSaving.current=true;setBusy(true);setError('');try{if(!goals.some(g=>g.status==='active'&&g.goal===goal.trim()))await onSaveGoal(playerId,{goal:goal.trim(),target_date:null,status:'active'});await next();}catch(value){setError(value instanceof Error?value.message:'Could not save your goal.');}finally{goalSaving.current=false;setBusy(false);}}}><p>{"Pick something you want to try. Your coach and linked parent or guardian can see your goal and support you."}</p>{goals.some(g=>g.status==='active')&&<p className="ps-notice">You already have a personal goal. You can keep it and do this step later, or add another.</p>}<label>Need an idea?<select value={templates.includes(goal)?goal:''} onChange={e=>{if(e.target.value)setGoal(e.target.value);}} disabled={busy}><option value="">Choose an idea or write your own</option>{templates.map(t=><option key={t}>{t}</option>)}</select></label><label>My first personal goal<textarea rows={3} minLength={3} maxLength={300} required value={goal} disabled={busy} onChange={e=>setGoal(e.target.value)} placeholder="Something small I’d like to try…"/></label><button className="ps-action" type="submit" disabled={busy||goal.trim().length<3}>{busy?'SAVING…':'SAVE MY GOAL & CONTINUE'}<SpaceIcon name="arrow"/></button></form>}
    {progress.step===4&&<div className="ps-welcome-tour">{[{icon:'calendar',title:'Your next session',body:'Time, venue, kit and your coach’s focus are on Home. Tell your coach what you’d like help with.'},{icon:'train',title:'Training',body:'Follow your coach’s weekly practices, try optional extras and log how it felt.'},{icon:'chat',title:'Your coach inbox',body:'Read encouragement and ask football questions. Your linked parent or guardian can see the conversation.'},{icon:'trophy',title:'Your trophy cabinet',body:'Celebrate badges from your coach. Attendance unlocks the Nike ball at 10 sessions and Gold 90 at 50.'}].map(card=><article key={card.title}><SpaceIcon name={card.icon as 'calendar'|'train'|'chat'|'trophy'}/><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>}
    {progress.step===5&&<PlayerPhoneAlerts userKey={userKey} demo={demo}/>}
   </div>
   <div className="ps-welcome-controls">{progress.step>0&&<button type="button" className="ps-text-link" disabled={busy} onClick={()=>void move(progress.step-1).catch(()=>{})}>← Back</button>}{progress.step===0||progress.step===4?<button className="ps-action" disabled={busy} onClick={()=>void next().catch(()=>{})}>{progress.step===0?'LET’S MAKE IT YOURS':'NEXT: MY UPDATES'}<SpaceIcon name="arrow"/></button>:progress.step===5?<button className="ps-action" disabled={busy} onClick={()=>void move(5,'completed').catch(()=>{})}>{busy?'FINISHING…':'LET’S GO TO MY SPACE'}<SpaceIcon name="check"/></button>:<button className="ps-text-link" disabled={busy} onClick={()=>void next().catch(()=>{})}>Do this step later →</button>}</div>
  </>}
  {error&&<p className="ps-error" role="alert">{error}</p>}
 </section>;
}
