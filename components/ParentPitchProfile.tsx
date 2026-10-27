"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { previewDevelopmentPlans } from "../lib/parentExperiencePreview";
import { pitchFormations, positionStatus, projectPitchPoint, roleGuides, roleMovement, samplePitchProfiles, selectFormationSlot, type Formation, type GameFormat, type PitchPhase, type PitchSlot } from "../lib/parentPitchPreview";

function PitchLines({ stadium = false }: { stadium?: boolean }) {
 const path = (points: { x: number; y: number }[]) => points.map((p, i) => { const c = projectPitchPoint(p, stadium); return `${i ? "L" : "M"}${c.x},${c.y}`; }).join(" ");
 const rectangle = (x: number, y: number, width: number, height: number) => path([{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }, { x, y }]);
 const circle = (x: number, y: number, rx: number, ry: number) => path(Array.from({ length: 49 }, (_, i) => ({ x: x + Math.cos(i * Math.PI / 24) * rx, y: y + Math.sin(i * Math.PI / 24) * ry })));
 return <g className="ppx-pitch-lines" fill="none" stroke="currentColor" strokeWidth="1.4">
  <path d={rectangle(0, 0, 100, 100)} fill="var(--pitch-grass)"/>
  {Array.from({ length: 10 }, (_, i) => i % 2 === 0 && <path key={i} d={rectangle(0, i * 10, 100, 10)} fill="#ffffff04" stroke="none"/>)}
  <path d={path([{ x: 0, y: 50 }, { x: 100, y: 50 }])}/><path d={circle(50, 50, 13, 10)}/>
  <path d={rectangle(21, 0, 58, 17)}/><path d={rectangle(37, 0, 26, 6)}/><path d={rectangle(21, 83, 58, 17)}/><path d={rectangle(37, 94, 26, 6)}/>
  <path d={rectangle(43, -2, 14, 2)}/><path d={rectangle(43, 100, 14, 2)}/>
  {[12, 50, 88].map(y => { const p = projectPitchPoint({ x: 50, y }, stadium); return <circle key={y} cx={p.x} cy={p.y} r="2" fill="currentColor" stroke="none"/>; })}
 </g>;
}

export function PitchProfilePreviewCard({ playerId, name, onOpen }: { playerId: string; name: string; onOpen: () => void }) {
 const profile = samplePitchProfiles[playerId];
 const formation = pitchFormations.find(f => f.format === profile.format && f.id === profile.formation)!;
 return <><div className="ppx-card-top"><span className="ppx-eyebrow">HER PLACE ON THE PITCH</span><span className="ppx-example-chip">SAMPLE</span></div><div className="ppx-pitch-preview-layout"><div><h2>Explore her game.</h2><p>See {name}’s positions and discover what each role involves.</p><div className="ppx-pitch-preview-role"><span>★ MAIN</span><strong>{profile.mainLabel}</strong><span>◎ SECONDARY</span><strong>{profile.secondaryLabel}</strong></div></div><svg className="ppx-pitch-mini" viewBox="0 0 600 720" aria-hidden="true"><PitchLines/>{formation.slots.map(s => { const p = projectPitchPoint(s), status = positionStatus(s, profile); return <g key={s.id}><circle cx={p.x} cy={p.y} r={status === "explore" ? 13 : 19} fill={status === "main" ? "var(--ppx-accent)" : "#142c44"} stroke={status === "explore" ? "#819bb0" : "var(--ppx-accent)"} strokeWidth={status === "secondary" ? 5 : 2}/>{status === "main" && <text x={p.x} y={p.y + 7} textAnchor="middle" fill="#071120" fontSize="23">★</text>}</g>; })}</svg></div><button className="ppx-text-btn" onClick={onOpen}>Open her pitch profile <span aria-hidden="true">↗</span></button></>;
}

export function ParentPitchProfile({ playerId, name, motion }: { playerId: string; name: string; motion: boolean }) {
 const profile = samplePitchProfiles[playerId], plan = previewDevelopmentPlans[playerId];
 const [format, setFormat] = useState<GameFormat>(profile.format);
 const [formationId, setFormationId] = useState(profile.formation);
 const formation = pitchFormations.find(f => f.format === format && f.id === formationId)!;
 const [slotId, setSlotId] = useState(() => formation.slots.find(s => s.group === profile.main)?.id || "GK");
 const slot = formation.slots.find(s => s.id === slotId) || selectFormationSlot(formation, undefined, profile);
 const [stadium, setStadium] = useState(false), [phase, setPhase] = useState<PitchPhase>("attack"), [step, setStep] = useState(0), [playing, setPlaying] = useState(false), [reduceMotion, setReduceMotion] = useState(false);
 const movement = roleMovement(slot, phase, format), canAnimate = motion && !reduceMotion;
 const markerId = `pitch-arrow-${useId().replace(/:/g, "")}`;
 const status = positionStatus(slot, profile);
 useEffect(() => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduceMotion(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
 useEffect(() => {
  if (!playing || !canAnimate) return;
  const first = setTimeout(() => setStep(1), 650), second = setTimeout(() => setStep(2), 1800), finish = setTimeout(() => setPlaying(false), 3000);
  return () => { clearTimeout(first); clearTimeout(second); clearTimeout(finish); };
 }, [playing, canAnimate]);
 useEffect(() => { if (!canAnimate) setPlaying(false); }, [canAnimate]);
 function reset() { setPlaying(false); setStep(0); }
 function chooseFormation(next: Formation) { reset(); setFormat(next.format); setFormationId(next.id); setSlotId(selectFormationSlot(next, slot, profile).id); }
 function chooseSlot(next: PitchSlot) { reset(); setSlotId(next.id); }
 const movementPoints = movement.points.map(p => projectPitchPoint(p, stadium));
 const movementPath = movementPoints.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
 const movementControls = <>
   <div className="ppx-pitch-segment" role="group" aria-label="Movement phase"><button aria-pressed={phase === "attack"} onClick={() => { reset(); setPhase("attack"); }}>When attacking</button><button aria-pressed={phase === "defend"} onClick={() => { reset(); setPhase("defend"); }}>When defending</button></div>
<div className="ppx-pitch-step-status" aria-live="polite"><span>0{step + 1}</span><strong>{movement.labels[step]}</strong></div>
   <div className="ppx-pitch-playback"><button className="ppx-gold-btn" onClick={() => { if (playing) setPlaying(false); else if (!canAnimate) setStep(2); else { setStep(0); setPlaying(true); } }}>{playing ? "Ⅱ Pause" : canAnimate ? "▶ Play movement" : "Show final position"}</button><button className="ppx-outline-btn" onClick={reset}>Reset</button></div>
   <div className="ppx-pitch-steps" role="group" aria-label="Movement steps">{movement.labels.map((label, i) => <button key={i} aria-pressed={step === i} onClick={() => { setPlaying(false); setStep(i); }}><b>0{i + 1}</b><span>{label}</span></button>)}</div>
   {!canAnimate && <p className="ppx-caption">Motion is off. Use the three steps to explore the positions.</p>}
 </>;
 return <article className={`ppx-card ppx-pitch-profile ${stadium ? "ppx-pitch-stadium" : ""} ${canAnimate && playing ? "ppx-pitch-motion" : ""}`} aria-labelledby="ppx-pitch-title">
  <div className="ppx-pitch-heading"><div><span className="ppx-eyebrow">HER POSITION. MORE POSSIBILITIES.</span><h2 id="ppx-pitch-title" tabIndex={-1}>{name}’s pitch profile.</h2><p>Tap a position. See the role. Explore the movement.</p></div><span className="ppx-example-chip">FICTIONAL COACH PROFILE</span></div>
  <div className="ppx-pitch-assignments"><div><span>★ MAIN POSITION</span><strong>{profile.mainLabel}</strong></div><div><span>◎ SECONDARY POSITION</span><strong>{profile.secondaryLabel}</strong></div><small>Set by her coach</small></div>
  <div className="ppx-pitch-toolbar"><div className="ppx-pitch-segment" role="group" aria-label="Pitch game format">{([9, 11] as const).map(value => <button key={value} aria-pressed={format === value} onClick={() => { if (value !== format) chooseFormation(pitchFormations.find(f => f.format === value)!); }}>{value}-a-side</button>)}</div><label className="ppx-pitch-formation">Formation<select aria-label="Pitch formation" value={formationId} onChange={e => chooseFormation(pitchFormations.find(f => f.format === format && f.id === e.target.value)!)}>{pitchFormations.filter(f => f.format === format).map(f => <option key={f.id}>{f.id}</option>)}</select></label><div className="ppx-pitch-segment ppx-pitch-view" role="group" aria-label="Pitch view"><button aria-pressed={!stadium} onClick={() => setStadium(false)}>Tactical</button><button aria-pressed={stadium} onClick={() => setStadium(true)}>Stadium</button></div></div>
  <div className="ppx-pitch-layout"><div className="ppx-pitch-left"><div className="ppx-pitch-surface" role="group" aria-label={`${format}-a-side ${formationId} pitch. Choose a position.`}>
   <div className="ppx-pitch-floodlights" aria-hidden="true"/><div className="ppx-pitch-direction" aria-hidden="true">ATTACKING ↑</div>
   <svg className="ppx-pitch-drawing" viewBox="0 0 600 720" aria-hidden="true"><defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="var(--ppx-accent)"/></marker></defs><PitchLines stadium={stadium}/><path className="ppx-pitch-movement-path" d={movementPath} fill="none" stroke="var(--ppx-accent)" strokeWidth="3" strokeDasharray="7 6" markerEnd={`url(#${markerId})`}/>{movementPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--ppx-accent)" opacity={i === step ? 1 : .5}/>)}</svg>
   {formation.slots.map(s => {
    const selected = s.id === slot.id, kind = positionStatus(s, profile), p = projectPitchPoint(selected ? movement.points[step] : s, stadium);
    return <button key={s.id} className={`ppx-pitch-player ppx-pitch-player-${kind} ${selected ? "ppx-pitch-player-selected" : ""}`} style={{ left: `${p.x / 6}%`, top: `${p.y / 7.2}%` } as CSSProperties} onClick={() => chooseSlot(s)} aria-pressed={selected} aria-label={`${s.label}${kind === "main" ? `, ${name}’s main position` : kind === "secondary" ? `, ${name}’s secondary position` : ""}`}><span>{s.short}</span>{kind !== "explore" && <small aria-hidden="true">{kind === "main" ? "★" : "◎"}</small>}</button>;
   })}
   <span className="ppx-pitch-home-goal" aria-hidden="true">HER TEAM’S GOAL</span>
  </div><div className="ppx-pitch-mobile-controls"><strong className="ppx-pitch-mobile-role">{slot.label}</strong>{movementControls}</div><div className="ppx-pitch-legend"><span>★ Main</span><span>◎ Secondary</span><span>○ Other roles</span></div><p className="ppx-caption">Browse formations freely. Her coach-set positions stay the same.</p></div>
  <div className="ppx-pitch-detail"><div className="ppx-pitch-role-title"><span className="ppx-eyebrow">{status === "main" ? `★ ${name.toUpperCase()}’S MAIN POSITION` : status === "secondary" ? `◎ ${name.toUpperCase()}’S SECONDARY POSITION` : "EXPLORING A DIFFERENT ROLE"}</span><h3>{slot.label}</h3><p>{roleGuides[slot.group].summary}</p></div>
   <p className="ppx-pitch-explanation">{movement.explanation}</p><div className="ppx-pitch-desktop-controls">{movementControls}</div>
   <p className="ppx-caption">One example movement. Match decisions depend on the ball, teammates and opponents. Follow her club coach’s team instructions.</p>
   <div className="ppx-pitch-plan"><span className="ppx-eyebrow">FROM {name.toUpperCase()}’S CURRENT DEVELOPMENT PLAN</span><h4>Her strengths</h4><ul>{plan.strengths.map(s => <li key={s}>{s}</li>)}</ul><h4>Her development targets</h4><ul>{plan.targets.map(s => <li key={s}>{s}</li>)}</ul><small>Sample coach-recorded plan · October</small></div>
  </div></div>
 </article>;
}
