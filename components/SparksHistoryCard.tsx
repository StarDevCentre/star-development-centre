"use client";

import {useEffect, useRef, useState} from "react";
import Image from "next/image";

export function SparksHistoryArt({id, sizes}: {id:number; sizes:string}) {
  return <Image src={`/player-space/history/sparks/${id}.webp`} width={384} height={384} sizes={sizes} alt=""/>;
}

export function SparksHistoryCard({card, face}: {
  card:{id:number;name:string;subtitle:string;story:string};
  face:"front"|"back";
}) {
  return <div className={`ps-sparks-card ps-sparks-card-${face}`}>
    <div className="ps-sparks-card-header"><span>✦ STAR Sparks</span><span>S{String(card.id-100).padStart(2,"0")}</span></div>
    {face==="front" && <SparksHistoryArt id={card.id} sizes="(max-width: 560px) 88vw, 400px"/>}
    <div className="ps-sparks-card-copy">
      <strong>{card.name}</strong>
      <p>{card.subtitle}</p>
      {face==="back" && card.story.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
    <div className="ps-sparks-card-footer" aria-hidden="true">✦ &nbsp; FOOTBALL HISTORY &nbsp; ✦</div>
  </div>;
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
