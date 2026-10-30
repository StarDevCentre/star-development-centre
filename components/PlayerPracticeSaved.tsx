'use client';
import {usePlayerExperience} from './PlayerExperienceContext';
import {useEffect,useRef} from 'react';
import {PlayerHeroCharacter} from './PlayerHeroCharacter';
import {SpaceIcon} from './PlayerSpaceIcons';
import type {SpaceProfile} from '../lib/playerSpace';
import {achievementDate} from '../lib/achievementBadges';
import type {SavedPracticeMoment} from '../lib/playerSpaceHighlights';
export function PlayerPracticeSaved({moment,profile,demo,onJourney,onHome,onDismiss}:{moment:SavedPracticeMoment;profile?:SpaceProfile;demo:boolean;onJourney:()=>void;onHome:()=>void;onDismiss:()=>void}){
 const {isChild}=usePlayerExperience();
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{root.current?.focus({preventScroll:true});root.current?.scrollIntoView({block:'start',behavior:'auto'});},[moment]);
 return <section ref={root} tabIndex={-1} className="ps-practice-saved ps-paper" aria-labelledby="ps-practice-saved-title"><button type="button" className="ps-saved-dismiss" aria-label="Dismiss saved practice" onClick={onDismiss}>×</button><div className="ps-saved-character"><PlayerHeroCharacter appearance={profile} decorative/></div><div className="ps-saved-copy"><span className="ps-tape"><SpaceIcon name="check"/> {demo?'SAMPLE PRACTICE SAVED':'YOUR PRACTICE IS SAVED'}</span><h2 id="ps-practice-saved-title">{isChild?<>You had a go.<br/>Well done!</>:<>A SMALL STEP.<br/>A MOMENT TO KEEP.</>}</h2><h3>{moment.title}</h3><p>{achievementDate(moment.date)}</p><blockquote>{moment.reflection}</blockquote><p className="ps-saved-milestone">{moment.newDay?`That’s ${moment.practiceDays} different ${moment.practiceDays===1?'day':'days'} of practice in your story.`:'You took a moment to reflect on your football.'}</p><p>{demo?'This stays in the sample space for this visit. No player records were changed.':'Your coach can see how you got on. You can find this entry in your journey.'}</p><div className="ps-saved-actions"><button type="button" className="ps-action" onClick={onJourney}>SEE MY JOURNEY<SpaceIcon name="arrow"/></button><button type="button" className="ps-text-link" onClick={onHome}>Back to my space<SpaceIcon name="home"/></button></div></div></section>;
}
