"use client";
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { achievementDate, badgeById, type PlayerAchievement } from '../lib/achievementBadges';
import type { SpaceActions } from '../lib/playerSpace';
import { SpaceIcon } from './PlayerSpaceIcons';

export function PlayerTrophyCabinet({ awards, celebrated, lights, compact, onOpen, onSelect, onLights, onCelebrate }: { awards: PlayerAchievement[]; celebrated: string[]; lights: boolean; compact: boolean; onOpen: () => void; onSelect: (id: string) => void; onLights: (value: boolean) => Promise<void>; onCelebrate: SpaceActions['onCelebrate'] }) {
  const [celebration,setCelebration]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const dialog=useRef<HTMLDialogElement>(null);
  const fresh=awards.filter(a=>a.badge_id&&!celebrated.includes(a.id));
  const shown=compact?[...awards.filter(a=>a.badge_id),...awards.filter(a=>!a.badge_id)].slice(0,3):awards;
  const award=awards.find(a=>a.id===celebration);
  const badge=award?.badge_id?badgeById.get(award.badge_id):undefined;
  useEffect(()=>{if(award&&!dialog.current?.open)dialog.current?.showModal();if(!award&&dialog.current?.open)dialog.current.close();},[award]);
  async function finish() {
    if(!award||busy)return;setBusy(true);setError('');
    try {await onCelebrate([award.id]);const next=fresh.find(a=>a.id!==award.id);setCelebration(next?.id||null);}
    catch{setError('Could not save your celebration. Please try again.');}finally{setBusy(false);}
  }
  return <section className={`ps-trophies ${lights?'ps-lights-on':'ps-lights-off'}`}><div className="ps-section-top"><h2 className="ps-label"><SpaceIcon name="trophy"/> TROPHY CABINET</h2><span className="ps-count"><SpaceIcon name="star"/>{awards.filter(a=>a.badge_id).length} BADGES EARNED</span>{compact&&<button className="ps-text-link" onClick={onOpen}>Open cabinet <SpaceIcon name="arrow"/></button>}</div>
    <div className="ps-cabinet-toolbar"><button type="button" role="switch" aria-checked={lights} className="ps-light-switch" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await onLights(!lights);}catch{setError('Could not save the cabinet lighting. Try again.');}finally{setBusy(false);}}}><span aria-hidden="true" className="ps-switch-track"><i/></span>Cabinet lights {lights?'on':'off'}</button></div>
    {fresh.length>0&&<button className="ps-new-award-banner" onClick={()=>{setError('');setCelebration(fresh[0].id);}}><SpaceIcon name="star"/><span><strong>{fresh.length===1?'A BADGE TO CELEBRATE!':`${fresh.length} BADGES TO CELEBRATE!`}</strong><small>Your coach noticed something special. Open your reward →</small></span></button>}
    {shown.length?<div className={`ps-badge-shelf ${compact?'':'ps-all-badges'}`}>{shown.map(a=>{const b=a.badge_id?badgeById.get(a.badge_id):undefined;const isNew=!!a.badge_id&&!celebrated.includes(a.id);return <button className="ps-earned-badge" key={a.id} onClick={()=>onSelect(a.id)} aria-label={`View ${a.title}, awarded ${achievementDate(a.awarded_on)}${isNew?', new badge':''}`}><div className="ps-badge-art">{isNew&&<span className="ps-new-chip">NEW</span>}{b?<Image src={b.image} alt="" width={220} height={220} sizes="(max-width:600px) 28vw, 220px"/>:<SpaceIcon name="trophy"/>}</div><strong>{a.title}</strong>{!compact&&<small>{achievementDate(a.awarded_on)}</small>}</button>;})}</div>:<div className="ps-empty-shelf"><SpaceIcon name="star"/><h3>Your story starts here.</h3><p>Your coach will award badges for the effort, progress and moments that make you, you.</p></div>}
    {error&&!award&&<p className="ps-error" role="alert">{error}</p>}
    <dialog ref={dialog} className="ps-award-dialog ps-celebration" onClose={()=>setCelebration(null)} aria-labelledby="ps-celebrate-title"><button className="ps-dialog-close" aria-label="Celebrate later" disabled={busy} onClick={()=>{dialog.current?.close();setCelebration(null);}}>×</button>{award&&<><div className="ps-confetti" key={award.id} aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i} as React.CSSProperties}/>)}</div><span className="ps-tape">YOUR EFFORT. RECOGNISED.</span>{badge&&<Image src={badge.image} alt={`${badge.title} badge`} width={260} height={260}/>}<p className="ps-eyebrow">NEW TO YOUR CABINET</p><h2 id="ps-celebrate-title">{award.title}</h2><time dateTime={award.awarded_on}>{achievementDate(award.awarded_on)}</time><div className="ps-coach-note"><strong>Your coach noticed…</strong><p>{award.description}</p></div><button autoFocus disabled={busy} className="ps-action" onClick={()=>void finish()}>{busy?'SAVING…':fresh.length>1?'CELEBRATE & NEXT':'ADD TO MY CABINET'} <SpaceIcon name="star"/></button>{error&&<p className="ps-error" role="alert">{error}</p>}</>}</dialog>
  </section>;
}
