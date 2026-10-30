"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { activityProgress, activityRoute, footballActivities, nextUnexploredScenario, saveActivityProgress, totalActivityScenarios,
  type ActivityChoice, type ActivityMarker, type ActivityScenario, type FootballActivity, type PitchPoint } from '../lib/playerActivities';
import type { LearningProgress, PortalFeatureActions } from '../lib/playerPortalFeatures';
import './player-activities.css';
import {badgeKey,learningRewards} from '../lib/learningRewards';
import type {SpaceUnlock} from '../lib/playerSpace';
import {LearningRewardArt} from './LearningRewardArt';

type Props = {
  playerId: string; progress: LearningProgress[];
  onLearningProgress: PortalFeatureActions['onLearningProgress'];
  onLearningAnswer:PortalFeatureActions['onLearningAnswer'];unlocks?:SpaceUnlock[];onCollection?:()=>void;
};
const outcomes = { 'opens-play': 'You found a useful option.', 'another-option': 'Another way to play.', 'look-again': 'Look at what could change.' };
const point = (p: PitchPoint) => `${p.x},${p.y}`;

export function ActivityPitch({ activity, scenario, selected, revealed, disabled, onChoose }: {
  activity: FootballActivity; scenario: ActivityScenario; selected: ActivityChoice | undefined;
  revealed: boolean; disabled: boolean; onChoose: (id: ActivityChoice['id']) => void;
}) {
  const uid = useId().replace(/:/g, '');
  const { start, path, arrowPath } = selected ? activityRoute(activity, scenario, selected) : { start: scenario.you, path: '', arrowPath: '' };
  const moving = selected?.kind !== 'hold';
  const defending = activity.phase === 'defend';
  const goalArea = activity.view === 'goal-area';
  return <figure className="ps-activity-figure">
    <div className="ps-activity-direction">{defending ? 'DEFEND YOUR GOAL' : activity.role === 'goalkeeper' ? 'BUILD FROM YOUR GOAL' : 'ATTACK THIS WAY'} <span aria-hidden="true">{defending ? '←' : '→'}</span></div>
    <div className="ps-activity-pitch">
      <svg viewBox="0 0 100 72" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
        <title id={`${uid}-title`}>{scenario.title + ": pitch view"}</title>
        <desc id={`${uid}-desc`}>{scenario.picture}{revealed && selected ? ` Your chosen action: ${selected.label}. The gold arrow shows its direction, not a guaranteed outcome.` : ''}</desc>
        <defs><marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#ffd65e"/></marker><marker id={`${uid}-incoming`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#fffdf7"/></marker></defs>
        <rect width="100" height="72" rx="3" fill="#153c42"/>
        {[0, 2, 4, 6, 8].map(n => <rect key={n} x={n * 10} y="0" width="10" height="72" fill="#fff" opacity=".035"/>)}
        <g fill="none" stroke="#d9e8dc" strokeWidth=".45" opacity=".65"><rect x="5" y="5" width="90" height="62"/>{goalArea ? <><path d="M5 10H58V62H5M5 23H24V49H5M58 24Q74 36 58 48"/><circle cx="43" cy="36" r=".7" fill="#d9e8dc"/></> : <><path d="M50 5V67M5 18H19V54H5M95 18H81V54H95M5 27H10V45H5M95 27H90V45H95"/><circle cx="50" cy="36" r="9"/><circle cx="50" cy="36" r=".6" fill="#d9e8dc"/><path d="M95 28H99V44H95" strokeWidth="1.1"/></>}</g>
        <path d={goalArea ? 'M5 26H1V46H5' : 'M5 28H1V44H5'} fill="none" stroke={defending || activity.role === 'goalkeeper' ? '#ffd65e' : '#d9e8dc'} strokeWidth="1.2"/>
        {goalArea && <path d={`M5 26L${point(scenario.ball)} 5 46`} fill="none" stroke="#fffdf7" strokeWidth=".5" strokeDasharray="1.4 1.4" opacity=".6"/>}
        {activity.mode === 'receive' && <path d={`M${point(scenario.ball)} L${point(scenario.you)}`} fill="none" stroke="#fffdf7" strokeWidth=".65" strokeDasharray="1.5 1.5" opacity=".75" markerEnd={`url(#${uid}-incoming)`}/>}
        {scenario.teammates.filter(t => t.x !== scenario.you.x || t.y !== scenario.you.y).map((t, i) => <g key={i} transform={`translate(${point(t)})`}><circle r="3.5" fill="#081b37" stroke="#fffdf7" strokeWidth=".7"/><text y="1.1" textAnchor="middle" fill="#fffdf7" fontSize="3" fontWeight="800">{i + 2}</text></g>)}
        {scenario.opponents.map((t, i) => <g key={i} transform={`translate(${point(t)})`}><path d="M0-3.9 3.9 0 0 3.9-3.9 0Z" fill="#fffdf7" stroke="#b6263d" strokeWidth=".7"/><path d="m-1-1 2 2m0-2-2 2" fill="none" stroke="#831b2f" strokeWidth=".5"/></g>)}
        <g transform={`translate(${point(scenario.you)})`}><circle r="4" fill="#ffd65e" stroke="#081b37" strokeWidth=".8"/><text y="1" textAnchor="middle" fill="#081b37" fontSize="2.6" fontWeight="900">YOU</text></g>
        <circle cx={scenario.ball.x + 3.8} cy={scenario.ball.y + 3.8} r="1.6" fill="#fffdf7" stroke="#081b37" strokeWidth=".6"/>
        <circle cx={scenario.ball.x + 3.8} cy={scenario.ball.y + 3.8} r=".6" fill="#081b37"/>
        {revealed && selected && (moving ? <g className="ps-activity-route" key={selected.id}>
          <path d={path} fill="none" stroke="#081b37" strokeWidth="2" opacity=".65"/>
          <path d={arrowPath} fill="none" stroke="#ffd65e" strokeWidth=".9" strokeDasharray={selected.kind === 'pass' || selected.kind === 'loft' ? '2 1.3' : undefined} markerEnd={`url(#${uid}-arrow)`}/>
          <circle className="ps-activity-moving-ball" r={activity.mode === 'player' ? 2.5 : 1.5} fill={activity.mode === 'player' ? '#ffd65e' : '#fffdf7'} stroke="#081b37" strokeWidth=".5"><animateMotion dur=".8s" path={path} fill="freeze"/></circle>
        </g> : <circle className="ps-activity-route" cx={start.x} cy={start.y} r="7" fill="none" stroke="#ffd65e" strokeWidth=".9" strokeDasharray="2 1"/>)}
      </svg>
      {scenario.choices.map(c => <button key={c.id} type="button" className="ps-pitch-choice" style={{ left: `${c.at.x}%`, top: `${c.at.y / 72 * 100}%` }} aria-label={`${c.id}. ${c.label}`} aria-pressed={selected?.id === c.id} disabled={disabled} onClick={() => onChoose(c.id)}>{c.id}</button>)}
    </div>
    <figcaption><span><i className="ps-activity-legend-you"/> {activity.role === 'goalkeeper' ? 'You: goalkeeper' : 'You'}</span><span><i className="ps-activity-legend-team"/> Teammate</span><span><i className="ps-activity-legend-opponent"/> Opponent</span><span><i className="ps-activity-legend-ball"/> Ball</span>{activity.mode === 'receive' && <span>Dashed white arrow: incoming pass</span>}{goalArea && <span>Dashed white lines: shooting angle · enlarged view</span>}{revealed && selected?.kind === 'loft' && <span>Curved gold arrow: lifted pass over the press</span>}</figcaption>
  </figure>;
}

function ActivityScene({ activity, scenario, index, playerId, explored, favourite, savingProgress, savingAnswer, mastered, onBack, onNavigate }: {
  activity: FootballActivity; scenario: ActivityScenario; index: number; playerId: string;
  explored: Set<string>; mastered:Set<string>; favourite: boolean; savingProgress: Props['onLearningProgress'];savingAnswer:Props['onLearningAnswer'];
  onBack: () => void; onNavigate: (index: number) => void;
}) {
  const [selectedId, setSelectedId] = useState<ActivityChoice['id'] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState<ActivityMarker | 'answer' | null>(null);
  const saving = useRef(false);
  const result = useRef<HTMLDivElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<{ kind: ActivityMarker | 'answer'; value: boolean; message: string } | null>(null);
  const selected = scenario.choices.find(c => c.id === selectedId);
  const saved = explored.has(scenario.id);
  const hintId = useId(), resultId = useId();
  useEffect(() => { if (revealed) result.current?.focus(); }, [revealed]);

  async function save(kind: ActivityMarker | 'answer', value: boolean) {
    if (saving.current) return;
    saving.current = true; setBusy(kind); setError(null);
    try { if(kind==='answer'){if(!selected)throw new Error('Choose a move first.');await savingAnswer(playerId,scenario.id,selected.id);}else await saveActivityProgress(playerId, scenario.id, kind, value, savingProgress); }
    catch (v) { setError({ kind, value, message: v instanceof Error ? v.message : 'Your choice could not be saved. Try again.' }); }
    finally { saving.current = false; setBusy(null); }
  }
  function choose(id: ActivityChoice['id']) {
    if (saving.current) return;
    setSelectedId(id); setRevealed(false);
  }
  function navigate(next: number) { if (!saving.current) onNavigate(next); }

  return <section className="ps-activity-play ps-paper" aria-label={activity.title}>
    <div className="ps-activity-play-top"><button type="button" className="ps-activity-link" disabled={!!busy} onClick={onBack}>← All games</button><button type="button" className="ps-activity-favourite" aria-pressed={favourite} disabled={!!busy} onClick={() => void save('favourite', !favourite)}><span aria-hidden="true">{favourite ? '★' : '☆'}</span> {busy === 'favourite' ? 'Saving…' : favourite ? 'In favourites' : 'Save favourite'}</button></div>
    <p className="ps-activity-eyebrow">{activity.title} · SCENARIO {index + 1} OF {activity.scenarios.length}</p>
    <h2>{scenario.title}</h2>
    <p className="ps-activity-prompt">{scenario.prompt}</p>
    <p className="ps-activity-instruction">{activity.instruction}</p>
    <div className="ps-activity-board">
      <ActivityPitch activity={activity} scenario={scenario} selected={selected} revealed={revealed} disabled={!!busy} onChoose={choose}/>
      <div className="ps-activity-decision">
        <fieldset disabled={!!busy}><legend>Choose on the pitch or use these buttons</legend><div className="ps-activity-options">{scenario.choices.map((c, i) => <button ref={i === 0 ? firstOption : undefined} type="button" key={c.id} aria-pressed={selectedId === c.id} onClick={() => choose(c.id)}><b>{c.id}</b><span>{c.label}</span>{selectedId === c.id && <span className="ps-activity-check" aria-hidden="true">✓</span>}</button>)}</div></fieldset>
        <button type="button" className="ps-activity-link ps-activity-hint-toggle" aria-expanded={hint} aria-controls={hintId} onClick={() => setHint(v => !v)}>{hint ? 'Hide the hint' : 'Give me a hint'}</button>
        {hint && <div className="ps-activity-hint" id={hintId}><strong>Try looking for this</strong><p>{scenario.hint}</p></div>}
        {!revealed && <button type="button" className="ps-activity-primary" disabled={!selected || !!busy} onClick={() => { if (!selected || saving.current) return; setRevealed(true); void save('answer', true); }} aria-controls={resultId}>SEE THIS MOVE <span aria-hidden="true">↗</span></button>}
        {revealed && selected && <div ref={result} tabIndex={-1} className={`ps-activity-feedback ps-activity-feedback-${selected.outcome}`} id={resultId} role="region" aria-label="Your move explained"><span className="ps-activity-eyebrow">YOU CHOSE: {selected.label}</span><h3>{outcomes[selected.outcome]}</h3><p>{selected.feedback}</p><details className="ps-activity-detail"><summary>More football detail</summary><p>{selected.detail}</p></details><button type="button" className="ps-activity-link" disabled={!!busy} onClick={() => { setSelectedId(null); setRevealed(false); requestAnimationFrame(() => firstOption.current?.focus()); }}>Try another move ↺</button></div>}
        {(busy === 'activity'||busy==='answer') && <p className="ps-activity-save" role="status">Saving your move…</p>}
        {!busy && saved && <p className="ps-activity-save">{mastered.has(scenario.id)?'Useful choice found ✓ · Saved.':'Explored ✓ · Try a useful choice to complete this scenario.'}</p>}
        {error && <div className="ps-activity-save-error" role="alert"><p>{error.message} Your scenario is still here.</p><button type="button" disabled={!!busy} onClick={() => void save(error.kind, error.value)}>Try saving again</button></div>}
      </div>
    </div>
    <div className="ps-activity-bottom"><nav className="ps-activity-steps" aria-label={`${activity.title} scenarios`}>{activity.scenarios.map((s, i) => <button type="button" key={s.id} aria-current={i === index ? 'step' : undefined} aria-label={`Scenario ${i + 1}: ${s.title}${explored.has(s.id) ? ', explored' : ''}`} disabled={!!busy} onClick={() => navigate(i)}>{i + 1}{mastered.has(s.id) && <span aria-hidden="true">✓</span>}</button>)}</nav><div className="ps-activity-next"><button type="button" className="ps-activity-link" disabled={index === 0 || !!busy} onClick={() => navigate(index - 1)}>← Previous</button>{index + 1 < activity.scenarios.length ? <button type="button" className="ps-activity-primary" disabled={!!busy} onClick={() => navigate(index + 1)}>NEXT SCENARIO →</button> : <button type="button" className="ps-activity-primary" disabled={!!busy} onClick={onBack}>CHOOSE AN ACTIVITY →</button>}</div></div>
    <p className="ps-activity-footnote">These original STAR snapshots show a few players. Real games change: scan again and follow your coach’s plan. Arrows show possible actions, not guaranteed results.{activity.mode === 'receive' ? ' First-touch arrows show direction; choose a distance you can control.' : ''}{activity.view === 'goal-area' ? ' This enlarged diagram is not to scale; positions show decision areas, not exact distances.' : ''}</p>
    {activity.source && <p className="ps-activity-source">Further learning: <a href={activity.source.url} target="_blank" rel="noopener noreferrer">{activity.source.label} ↗</a></p>}
  </section>;
}

function ActivityCardArt({ activity, number }: { activity: FootballActivity; number: number }) {
  let art;
  switch (activity.id) {
    case 'pass': art = <><circle cx="35" cy="57" r="7"/><circle cx="118" cy="25" r="7"/><path d="M47 52 104 30m-9-3 9 3-4 8"/></>; break;
    case 'space': art = <><circle cx="44" cy="52" r="7"/><circle className="ps-activity-art-space" cx="113" cy="27" r="13"/><path d="m57 48 44-17m-9-3 9 3-4 8"/></>; break;
    case 'next': art = <><circle cx="52" cy="44" r="7"/><path d="M66 44h55m-8-6 8 6-8 6M66 44l37-22M66 44l37 22"/></>; break;
    case 'touch': art = <><circle cx="55" cy="53" r="7"/><path d="M19 64 45 57M64 48 113 23m-9-2 9 2-4 9"/></>; break;
    case 'defend': art = <><path d="M80 20 101 28V46Q100 62 80 70 60 62 59 46V28Z"/><path d="m69 44 9 9 16-21"/></>; break;
    case 'counter': art = <><circle cx="29" cy="61" r="6"/><path d="m41 57 25-24 24 12 38-27m-15 1 15-1-4 14"/></>; break;
    case 'keeper-position': art = <><path d="M18 27V61H26V27ZM27 28 128 45 27 60"/><circle cx="46" cy="44" r="7"/><circle cx="128" cy="45" r="5"/></>; break;
    case 'keeper-distribution': art = <><path d="M17 27V61H25V27M42 43 106 23M42 43 108 66"/><circle cx="35" cy="43" r="7"/><circle cx="116" cy="20" r="7"/><circle cx="119" cy="69" r="7"/></>; break;
  }
  return <div className="ps-activity-card-art" aria-hidden="true"><span>{String(number).padStart(2, '0')}</span><svg viewBox="0 0 160 88"><path d="M8 12H152V76H8ZM80 12V76"/>{art}</svg></div>;
}

export function PlayerActivities({ playerId, progress, onLearningProgress,onLearningAnswer,unlocks=[],onCollection=()=>{} }: Props) {
  const [active, setActive] = useState<{ activityId: FootballActivity['id']; index: number } | null>(null);
  const [group, setGroup] = useState<'all' | 'outfield' | 'goalkeeper'>('all');
  const heading = useRef<HTMLHeadingElement>(null);
  const status = activityProgress(progress, playerId);
  const activity = footballActivities.find(a => a.id === active?.activityId);
  const scenario = activity?.scenarios[active?.index ?? 0];
  const visibleActivities = footballActivities.filter(a => group === 'all' || (group === 'goalkeeper' ? a.role === 'goalkeeper' : a.role !== 'goalkeeper'));
  const goalkeeperCount = footballActivities.filter(a => a.role === 'goalkeeper').length;
  const favourites = footballActivities.flatMap(a => a.scenarios.map((s, i) => ({ activity: a, scenario: s, index: i }))).filter(s => status.favourites.has(s.scenario.id));
  function open(activityId: FootballActivity['id'], index: number) {
    setActive({ activityId, index });
    // The section remains mounted; focus its heading after the new scenario renders.
    requestAnimationFrame(() => heading.current?.focus());
  }
  function back() { setActive(null); requestAnimationFrame(() => heading.current?.focus()); }

  return <div className="ps-activities">
    <h2 className="ps-activity-section-heading" ref={heading} tabIndex={-1}>{activity ? activity.title : 'Your football playground'}</h2>
    {activity && scenario && active ? <><ActivityScene key={`${playerId}:${scenario.id}`} activity={activity} scenario={scenario} index={active.index} playerId={playerId} explored={status.explored} mastered={status.mastered} savingAnswer={onLearningAnswer} favourite={status.favourites.has(scenario.id)} savingProgress={onLearningProgress} onBack={back} onNavigate={index => open(activity.id, index)}/>{unlocks.some(u=>u.player_id===playerId&&u.cosmetic===badgeKey(activity.id))&&<div className="ps-learning-complete ps-paper" role="status"><LearningRewardArt motif={learningRewards.find(r=>r.id===activity.id)!.motif} badge/><h3>GAME COMPLETE ✓</h3><p>Your learning badge and profile extra are yours to keep.</p><button type="button" className="ps-action" onClick={onCollection}>SEE MY REWARDS →</button></div>}</> : <>
      <div className="ps-activity-intro"><p>{footballActivities.length} games to explore. Take your time, use a hint and try different ideas.</p><span>{status.explored.size} of {totalActivityScenarios} scenarios explored</span></div>
      <nav className="ps-activity-filters" aria-label="Filter games">{([{ id: 'all', label: 'All games', count: footballActivities.length }, { id: 'outfield', label: 'Outfield', count: footballActivities.length - goalkeeperCount }, { id: 'goalkeeper', label: 'Goalkeepers', count: goalkeeperCount }] as const).map(g => <button type="button" key={g.id} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>{g.label} <span>{g.count}</span></button>)}</nav>
      <div className={`ps-activity-library${group === 'goalkeeper' ? ' ps-activity-library-keepers' : ''}`}>{visibleActivities.map(a => {
        const count = a.scenarios.filter(s => status.explored.has(s.id)).length;
        const useful=a.scenarios.filter(s=>status.mastered.has(s.id)).length;
        const next = nextUnexploredScenario(a, status.mastered);
        const reward=learningRewards.find(r=>r.id===a.id)!;
        const earned=unlocks.some(u=>u.player_id===playerId&&u.cosmetic===badgeKey(a.id));
        return <article key={a.id} className="ps-activity-card ps-paper" data-activity={a.id}><ActivityCardArt activity={a} number={footballActivities.indexOf(a) + 1}/><p className="ps-activity-eyebrow">{a.role === 'goalkeeper' ? 'GOALKEEPER · ' : ''}{a.scenarios.length} SCENARIOS · YOUR PACE</p><h3>{a.title}</h3><p>{a.description}</p><strong className="ps-activity-focus">{a.focus}</strong><div className="ps-activity-card-progress"><span>{useful} of {a.scenarios.length} useful choices · {count} explored{count === a.scenarios.length ? ' ✓' : ''}</span><progress max={a.scenarios.length} value={useful} aria-label={`${a.title}: ${useful} of ${a.scenarios.length} explored`}/></div><button type="button" className="ps-activity-primary" onClick={() => open(a.id, next)}>{earned ? 'PLAY AGAIN' : count > 0 ? 'KEEP EXPLORING' : 'LET’S PLAY'} <span aria-hidden="true">→</span></button><p className="ps-learning-game-reward">{earned?'Reward earned ✓':`Unlock: ${reward.extra} ${reward.kind==='theme'?'background':reward.kind} + badge`}</p></article>;
      })}</div>
      <section className="ps-activity-favourites"><div><h3>Your favourites <span aria-hidden="true">★</span></h3><p>Keep the situations you want to try again.</p></div>{favourites.length ? <ul>{favourites.map(f => <li key={f.scenario.id}><button type="button" onClick={() => open(f.activity.id, f.index)}><span>{f.activity.title}</span><strong>{f.scenario.title}</strong><span aria-hidden="true">↗</span></button></li>)}</ul> : <p className="ps-activity-empty">Open a scenario and choose “Save favourite” to keep it here.</p>}</section>
      <p className="ps-activity-footnote">No timer, leaderboard or score to beat. Find a useful choice in all six scenarios to earn the game’s learning badge and profile extra. Unlimited retries. Each game rewards you once; coach-awarded badges stay separate.</p>
    </>}
  </div>;
}
