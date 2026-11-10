"use client";

import {useEffect, useRef, useState} from "react";
import Image from "next/image";

export function SparksHistoryArt({id, sizes}: {id:number; sizes:string}) {
  return <Image src={`/player-space/history/sparks/${id}.webp`} width={384} height={384} sizes={sizes} alt=""/>;
}

function Spark() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M12 0c1.8 7.2 4.8 10.2 12 12-7.2 1.8-10.2 4.8-12 12C10.2 16.8 7.2 13.8 0 12 7.2 10.2 10.2 7.2 12 0Z"/>
  </svg>;
}

export function SparksHistoryCard({card, face, number, setName, compact = false}: {
  card:{id:number;name:string;subtitle:string;story:string};
  face:"front"|"back";
  number:string;
  setName:string;
  compact?:boolean;
}) {
  const Surface = compact ? "span" : "div";

  return <Surface className={`ps-sparks-card ps-sparks-card-${face}${compact?" ps-sparks-card-mini":""}`} aria-hidden={compact||undefined}>
    <span className="ps-sparks-card-header">
      <span className="ps-sparks-card-brand"><Spark/> STAR Sparks</span>
      <span className="ps-sparks-card-number">{number}</span>
    </span>

    {face==="front" ? <>
      <span className="ps-sparks-card-art">
        <SparksHistoryArt id={card.id} sizes={compact?"(max-width: 550px) 43vw, 210px":"(max-width: 560px) 88vw, 400px"}/>
      </span>
      <span className="ps-sparks-card-nameplate">
        <strong className="ps-sparks-card-name">{card.name}</strong>
        {!compact && <span className="ps-sparks-card-subtitle">{card.subtitle}</span>}
        {!compact && <span className="ps-sparks-card-sticker" aria-hidden="true"><Spark/></span>}
      </span>
    </> : <>
      <div className="ps-sparks-card-story-title">
        <SparksHistoryArt id={card.id} sizes="64px"/>
        <div>
          <strong className="ps-sparks-card-name">{card.name}</strong>
          <span className="ps-sparks-card-subtitle">{card.subtitle}</span>
        </div>
      </div>
      <div className="ps-sparks-card-reading">
        <strong className="ps-sparks-card-story-label">The story</strong>
        {card.story.split("\n\n").map((paragraph,index) => <p key={index}>{paragraph}</p>)}
      </div>
    </>}

    {!compact && <span className="ps-sparks-card-set"><Spark/>{setName}</span>}
  </Surface>;
}

export function SparksReadAloud({text,label}: {text:string;label:string}) {
  const [available,setAvailable]=useState(false);
  const [reading,setReading]=useState(false);
  const active=useRef<SpeechSynthesisUtterance|null>(null);
  useEffect(() => {
    setAvailable("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => {
      if (active.current) {
        active.current.onend=null;
        active.current.onerror=null;
        active.current=null;
        window.speechSynthesis.cancel();
      }
    };
  },[]);
  if (!available) return null;
  function toggle() {
    if (active.current) {
      active.current.onend=null;
      active.current.onerror=null;
      active.current=null;
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang="en-GB";
    utterance.rate=.85;
    utterance.onend=utterance.onerror=()=>{active.current=null;setReading(false);};
    active.current=utterance;
    setReading(true);
    window.speechSynthesis.speak(utterance);
  }
  return <button type="button" className="ps-history-back" onClick={toggle}>{reading?"Stop reading":label}</button>;
}
