"use client";

import {useEffect, useRef, useState, type FormEvent} from "react";
import Image from "next/image";
import trailblazers from "../lib/content/football-history.json";
import sparks from "../lib/content/football-history-sparks.json";
import {SparksHistoryArt,SparksHistoryCard,SparksReadAloud} from "./SparksHistoryCard";
import {supabaseBrowser} from "../lib/supabaseBrowser";
import "./player-football-history.css";

const trailblazerSets = [
  {name:"The Pioneers", metal:"Bronze"},
  {name:"Legends of the World Game", metal:"Silver"},
  {name:"Moments That Changed the Game", metal:"Gold"},
] as const;
const sparksSets = [
  {name:"First Football Heroes",metal:"Coral"},
  {name:"Stars Around the World",metal:"Teal"},
  {name:"Big Match Moments",metal:"Violet"},
] as const;
const isSparks = (id:number) => id >= 101;
const cardNumber = (id:number) => isSparks(id) ? `S${String(id-100).padStart(2,"0")}` : String(id).padStart(3,"0");
const cardImage = (id:number, side:"front"|"back") => `/player-space/history/${cardNumber(id)}-${side}.webp`;
type Card = (typeof trailblazers)[number] | (typeof sparks)[number];
type Edition = "sparks"|"trailblazers"|"unknown"|"under-five";
type Progress = {card_id:number; score:number; retry_at:string|null; earned_at:string|null};

export function PlayerFootballHistory({playerId, preview}: {playerId:string; preview:boolean}) {
  const [edition,setEdition] = useState<Edition|null>(preview?"trailblazers":null);
  const [progress,setProgress] = useState<Record<number,Progress>>({});
  const [load,setLoad] = useState<"loading"|"ready"|"error">(preview?"ready":"loading");
  const [loadAttempt,reload] = useState(0);
  const [view,setView] = useState<"stories"|"collection"|"keepsakes">("stories");
  const [selected,setSelected] = useState<Card|null>(null);
  const [mode,setMode] = useState<"story"|"quiz"|"card">("story");
  const [side,setSide] = useState<"front"|"back">("front");
  const [choices,setChoices] = useState<number[]>([]);
  const [question,setQuestion] = useState(0);
  const [result,setResult] = useState<Progress|null>(null);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const sending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [now,setNow] = useState(() => Date.now());

  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    async function readProgress() {
      if (!supabaseBrowser) {setLoad("error");return;}
      const [band,response] = await Promise.all([
        supabaseBrowser.rpc("football_history_edition",{target_player:playerId}).abortSignal(controller.signal),
        supabaseBrowser.from("player_history_progress")
          .select("card_id,score,retry_at,earned_at").eq("player_id",playerId).abortSignal(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      if (band.error || response.error || !["sparks","trailblazers","unknown","under-five"].includes(band.data)) {setLoad("error");return;}
      setEdition(band.data);
      setProgress(Object.fromEntries(response.data.map(row => [row.card_id,row])));
      setLoad("ready");
    }
    void readProgress().catch(() => {if (!controller.signal.aborted) setLoad("error");});
    return () => controller.abort();
  },[playerId,preview,loadAttempt]);

  const active = selected ? progress[selected.id] : undefined;
  const deadline = active?.retry_at ? Date.parse(active.retry_at) : 0;
  const remaining = Math.max(0,Math.ceil((deadline-now)/1000));
  useEffect(() => {
    if (!deadline || deadline <= Date.now()) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= deadline) window.clearInterval(timer);
    },1000);
    return () => window.clearInterval(timer);
  },[deadline]);

  function focusHeading() {
    requestAnimationFrame(() => {
      heading.current?.focus({preventScroll:true});
      heading.current?.scrollIntoView({block:"start"});
    });
  }
  function open(card:Card, nextMode:"story"|"card") {
    setSelected(card);setMode(nextMode);setSide("front");setChoices([]);setQuestion(0);
    setResult(null);setError("");setNow(Date.now());focusHeading();
  }
  function close() {
    setSelected(null);setResult(null);setError("");focusHeading();
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !supabaseBrowser || preview || sending.current || (isSparks(selected.id) && question!==4) || choices.filter(Number.isInteger).length !== 5) return;
    sending.current=true;setBusy(true);setError("");
    try {
      const {data,error:rpcError} = await supabaseBrowser.rpc("submit_football_history_quiz",{
        target_player:playerId,target_card:selected.id,choices,
      }).single<Progress>();
      if (rpcError?.code==="42501") {
        close();setView("stories");setEdition(null);setLoad("loading");reload(n=>n+1);
        return;
      }
      if (rpcError || !data) throw new Error("Quiz could not be saved");
      setProgress(previous => ({...previous,[data.card_id]:data}));
      setNow(Date.now());setResult(data);
      setMode(data.earned_at?"card":"story");setSide("front");focusHeading();
    } catch {
      setError("We couldn’t confirm your result. Try submitting again.");
    } finally {sending.current=false;setBusy(false);}
  }

  if (!edition || edition==="unknown" || edition==="under-five") return <section className="ps-history">
    <header className="ps-history-hero"><h2>Football history collection</h2>
      {load==="loading" ? <p role="status">Finding your collection…</p>
        : load==="error" ? <p role="alert">Your collection couldn’t load. <button type="button" className="ps-history-back" onClick={() => {setLoad("loading");reload(n=>n+1);}}>Try again</button></p>
        : <p>{edition==="under-five"?"The Sparks collection opens when you turn five.":"Ask a parent or STAR to check your date of birth in your player details."}</p>}
    </header>
  </section>;

  const junior = edition==="sparks" || view==="keepsakes";
  const cards:Card[] = junior ? sparks : trailblazers;
  const sets = junior ? sparksSets : trailblazerSets;
  const collected = cards.filter(card => progress[card.id]?.earned_at).length;
  const hasKeepsakes = edition==="trailblazers" && sparks.some(card => progress[card.id]?.earned_at);
  const tier = selected ? sets[Math.floor(((junior ? selected.id-100 : selected.id)-1)/10)] : null;
  return <section className={`ps-history${junior?" ps-history-sparks":""}`} aria-labelledby="ps-history-title">
    {selected && tier ? <>
      <button type="button" className="ps-history-back" disabled={busy} onClick={close}>← Back to {view==="stories"?"all stories":view==="keepsakes"?"my Sparks cards":"my collection"}</button>
      <article className={`ps-history-detail ps-history-${tier.metal.toLowerCase()}`}>
        <p className="ps-history-kicker">Card {cardNumber(selected.id)} · {tier.metal} · {tier.name}</p>
        <h2 id="ps-history-title" ref={heading} tabIndex={-1}>{selected.name}</h2>
        {result && <p className="ps-history-notice" role="status">{result.earned_at
          ? "5 out of 5! Your card has been added to My collection."
          : `${result.score} out of 5. Read the story again while your quiz resets.`}</p>}
        {mode==="card" && active?.earned_at ? <>
          <div className="ps-history-viewer">
            <div className="ps-history-flip" data-side={side}>
              {(["front","back"] as const).map(face => <div key={face} className={`ps-history-face ps-history-face-${face}`} aria-hidden={side!==face}>
                {junior ? <SparksHistoryCard card={selected} face={face} number={cardNumber(selected.id)} setName={tier.name}/> : <Image src={cardImage(selected.id,face)} width={576} height={768} sizes="(max-width: 560px) 88vw, 420px" alt={`${selected.name} collector card, ${face} side`}/>}
              </div>)}
            </div>
            <div className="ps-history-controls" role="group" aria-label="Card side">
              <button type="button" aria-pressed={side==="front"} onClick={() => setSide("front")}>{junior?"Card front":"Front"}</button>
              <button type="button" aria-pressed={side==="back"} onClick={() => setSide("back")}>{junior?"Story side":"Back"}</button>
            </div>
          </div>
          <button type="button" className="ps-history-back" onClick={() => {setMode("story");setResult(null);}}>Read the story in text</button>
        </> : mode==="quiz" ? <form onSubmit={submit}>
          <p>{junior?"Pick one answer. Get all five right to earn your card.":"Choose one answer for each question. Score 5 out of 5 to earn this card."}</p>
          {junior && <p className="ps-history-kicker">Question {question+1} of 5</p>}
          {selected.questions.map(({prompt,options},index) => (!junior || index===question) && <fieldset key={prompt} disabled={busy}>
            <legend>{index+1}. {prompt}</legend>
            {junior && <SparksReadAloud text={`${prompt} ${options.join(". ")}`} label="Read this question to me"/>}
            {options.map((option,i) => <label key={option}>
              <input type="radio" name={`history-question-${index}`} checked={choices[index]===i}
                onChange={() => setChoices(previous => Object.assign(previous.slice(),{[index]:i}))}/>
              {option}
            </label>)}
          </fieldset>)}
          {error && <p className="ps-error" role="alert">{error}</p>}
          <div className="ps-history-controls">
            {junior && question>0 && <button type="button" disabled={busy} onClick={() => {setQuestion(n=>n-1);focusHeading();}}>Previous question</button>}
            {junior && question<4 ? <button type="button" className="ps-history-primary" disabled={!Number.isInteger(choices[question])} onClick={() => {setQuestion(n=>n+1);focusHeading();}}>Next question</button>
              : <button type="submit" disabled={busy || choices.filter(Number.isInteger).length!==5}>{busy?"Checking…":"Check my answers"}</button>}
            <button type="button" disabled={busy} onClick={() => {setMode("story");setError("");focusHeading();}}>Read the story again</button>
          </div>
        </form> : <>
          <p className="ps-history-era">{selected.subtitle}{"era" in selected && ` · ${selected.era}`}</p>
          {junior && <div className="ps-sparks-story-art"><SparksHistoryArt id={selected.id} sizes="(max-width: 480px) 80vw, 260px"/></div>}
          {junior && <SparksReadAloud text={selected.story} label="Read this story to me"/>}
          <div className="ps-history-story">
            {selected.story.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
          {"facts" in selected && <><h3>Key facts</h3>
          <ul>{selected.facts.map(fact => <li key={fact}>{fact}</li>)}</ul></>}
          <div className="ps-history-sources">
            <a href={selected.source} target="_blank" rel="noreferrer">Historical source ↗</a>
            {"furtherReading" in selected && selected.furtherReading.map(({url,label}) => <a key={url} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}
          </div>
          {active?.earned_at ? <button type="button" className="ps-history-primary" onClick={() => {setMode("card");setSide("front");}}>View my card</button>
            : preview ? <p>Sign in to your own Player Space to take the quiz and earn this card.</p>
            : remaining > 0 ? <p className="ps-history-notice">Retry in <time>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}</time>. You can explore another story while you wait.</p>
            : <button type="button" className="ps-history-primary" disabled={load!=="ready"} onClick={() => {setMode("quiz");if (!junior || result) {setChoices([]);setQuestion(0);}setResult(null);focusHeading();}}>{junior && !result && choices.some(Number.isInteger)?"Continue quiz":"Start the 5-question quiz"}</button>}
        </>}
      </article>
    </> : <>
      <header className="ps-history-hero">
        <p className="ps-history-kicker">{junior?"STAR Sparks · Football history":"Series one · The Trailblazers"}</p>
        <h2 id="ps-history-title" ref={heading} tabIndex={-1}>{junior?"Sparks":"Football history"}<br/><em>collection</em></h2>
        <p>Read a story. Get all five answers right. Earn its card.</p>
        <div className="ps-history-meter"><strong>{collected} / 30 cards collected</strong><progress aria-label="Cards collected" value={collected} max={30}/></div>
      </header>
      {load==="loading" && <p role="status">Loading your collection…</p>}
      {load==="error" && <div className="ps-history-notice" role="alert">Your collection couldn’t load. <button type="button" onClick={() => {setLoad("loading");reload(n => n+1);}}>Try again</button></div>}
      <div className="ps-history-controls" role="group" aria-label="Football history views">
        <button type="button" aria-pressed={view==="stories"} onClick={() => setView("stories")}>Explore stories</button>
        <button type="button" aria-pressed={view==="collection"} onClick={() => setView("collection")}>My collection</button>
        {hasKeepsakes && <button type="button" aria-pressed={view==="keepsakes"} onClick={() => setView("keepsakes")}>My Sparks cards</button>}
      </div>
      {view==="collection" && load==="ready" && !collected && <p className="ps-history-notice">Your collection is empty. Explore a story and score 5 out of 5 to earn your first card.</p>}
      {sets.map(({name,metal},index) => {
        const group=cards.slice(index*10,index*10+10);
        const owned=group.filter(card => progress[card.id]?.earned_at);
        const shown=view==="stories"?group:owned;
        return shown.length>0 && <section key={name} className={`ps-history-set ps-history-${metal.toLowerCase()}`}>
          <div className="ps-history-set-title"><h3>{name}</h3><span>{metal} · {owned.length}/10</span></div>
          <ul className="ps-history-grid">{shown.map(card => {
            const earned=Boolean(progress[card.id]?.earned_at);
            if (junior && view!=="stories") return <li key={card.id}>
              <button type="button" className="ps-sparks-collection-card" aria-label={`View ${card.name} card`} onClick={() => open(card,"card")}>
                <SparksHistoryCard card={card} face="front" number={cardNumber(card.id)} setName={name} compact/>
              </button>
            </li>;
            return <li key={card.id}><button type="button" onClick={() => open(card,view==="stories"?"story":"card")}>
              {junior ? <SparksHistoryArt id={card.id} sizes="(max-width: 600px) 43vw, 210px"/>
                : view==="collection" && <Image src={cardImage(card.id,"front")} width={576} height={768} sizes="(max-width: 600px) 43vw, 210px" alt=""/>}
              <span className="ps-history-kicker">{cardNumber(card.id)} · {earned?"Collected":"Story"}</span>
              <strong>{card.name}</strong>
              <span>{view==="stories"?card.subtitle:"View card"} →</span>
            </button></li>;
          })}</ul>
        </section>;
      })}
    </>}
  </section>;
}
