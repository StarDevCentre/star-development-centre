"use client";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {finderGoals, findProgrammeMatches, playerAges, programmeEnquiryHref, type FinderGoal} from "../../lib/programmeOptions";
import {ProgrammePrice, ProgrammePricingProvider} from "../../components/ProgrammePricing";
import "../programmes/programmes.css";
import "./finder.css";
export default function ProgrammeFinder() {
  const [ageChoice, setAgeChoice] = useState("");
  const [goal, setGoal] = useState<FinderGoal | "">("");
  useEffect(() => {
    const requestedAge = new URLSearchParams(window.location.search).get("age");
    try {const saved = JSON.parse(sessionStorage.getItem("star-finder-choices") || "null"); if (saved && playerAges.includes(Number(saved.age)) && finderGoals.some(g => g.value === saved.goal)) {setAgeChoice(String(saved.age)); setGoal(saved.goal);}} catch {}
    if (requestedAge && playerAges.includes(Number(requestedAge))) setAgeChoice(String(Number(requestedAge)));
  }, []);
  function choose(nextAge: string, nextGoal: FinderGoal | "") {setAgeChoice(nextAge); setGoal(nextGoal); try {sessionStorage.setItem("star-finder-choices", JSON.stringify({age: nextAge, goal: nextGoal}));} catch {}}
  const age = Number(ageChoice);
  const matches = useMemo(() => goal && ageChoice ? findProgrammeMatches(age, goal) : [], [age, ageChoice, goal]);
  const complete = !!ageChoice && !!goal;
  return <ProgrammePricingProvider returnTo="finder"><div className="programmes-page finder-page">
    <section className="finder-hero programme-section"><div className="home-width"><p className="programme-eyebrow">STAR PROGRAMME FINDER</p><h1>YOUR FOOTBALL.<br/><span>YOUR STARTING POINT.</span></h1><p>Choose the player’s age and what matters most right now. Explore suitable options together, then talk to STAR about the right fit.</p></div></section>
    <section className="home-width finder-layout" aria-label="Programme finder"><div className="finder-controls"><h2>Start with<br/>the player.</h2><label htmlFor="player-age">Player age</label><select id="player-age" value={ageChoice} onChange={e => choose(e.target.value, goal)}><option value="">Choose an age</option>{playerAges.map(n => <option value={n} key={n}>{n} years</option>)}</select><fieldset><legend>What matters most right now?</legend>{finderGoals.map(g => <label className="finder-radio" key={g.value}><input type="radio" name="goal" checked={goal === g.value} onChange={() => choose(ageChoice, g.value)}/><span>{g.label}</span></label>)}</fieldset><p className="finder-note">The player’s confidence, needs, experience and ambitions help us agree a starting point. These results are guidance, not an enrolment decision.</p></div>
      <div className="finder-results"><p className="programme-eyebrow">YOUR OPTIONS</p><h2>Possible<br/>starting points.</h2><p className="finder-note" role="status">{!complete ? "Choose an age and a focus to see suitable coaching options." : matches.length ? matches.length + (matches.length === 1 ? " option matches" : " options match") + " age " + age + " and the selected focus." : goal === "group" ? "No group coaching is listed for ages 17–18." : "Individual programmes begin at age 7."}</p>
        {complete && matches.map((p, i) => <article className={"finder-result" + (p.slug === "one-to-one" ? " finder-result-featured" : "")} key={p.slug}><span className="finder-result-index">{String(i + 1).padStart(2, "0")} / {p.age}</span><h3>{p.title}</h3><p>{p.summary}</p><div className="finder-reason"><strong>Why this could fit</strong><p>{p.reason}</p></div><p className="finder-detail">{p.detail}</p><ProgrammePrice slug={p.slug}/><div className="finder-result-bottom"><Link className="programme-button" href={programmeEnquiryHref(p.slug, age)}>Enquire about this programme →</Link><Link href={"/programmes#" + p.slug}>Programme details ↗</Link></div></article>)}
        {complete && !matches.length && <div className="finder-result"><h3>{age < 7 ? "A first step with STAR Sparks." : "Let’s discuss an individual option."}</h3><p>{age < 7 ? "Our individual programmes begin at age 7. STAR Sparks offers group coaching for ages 5–7; we can discuss whether that setting would suit the player." : "STAR’s group sessions cover ages 5–16. For ages 17–18, explore One to One Coaching or Prestige, or ask us about a suitable starting point."}</p><Link className="programme-button" href={programmeEnquiryHref("", age)}>Discuss coaching options →</Link><Link className="finder-alternative" href={age < 7 ? "/programmes#sparks" : "/programmes#one-to-one"}>{age < 7 ? "Explore STAR Sparks →" : "Explore individual coaching →"}</Link></div>}
        <Link href="/programmes#compare" className="programme-text-link">Browse all programmes →</Link>
      </div>
    </section>
  </div></ProgrammePricingProvider>;
}
