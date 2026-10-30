"use client";
import Image from "next/image";
import Link from "next/link";
import {SpaceIcon,type SpaceIconName} from "./PlayerSpaceIcons";
export type Tab = "home" | "training" | "journey" | "trophies" | "sessions" | "messages" | "learn" | "matchday" | "sharing" | "updates" | "squad" | "boots";
export const nav: { id: Tab; title: string; mobile: string; icon: SpaceIconName }[] = [{ id: "home", title: "My space", mobile: "Home", icon: "home" }, { id: "training", title: "Training", mobile: "Train", icon: "train" }, { id: "journey", title: "My journey", mobile: "Journey", icon: "journey" }, { id: "trophies", title: "Trophies", mobile: "Trophies", icon: "trophy" },{id:"squad",title:"My squad",mobile:"Squad",icon:"captain"},{id:"boots",title:"Boot locker",mobile:"Boots",icon:"boot"},{id:"learn",title:"Learn",mobile:"Learn",icon:"book"},{id:"messages",title:"Inbox",mobile:"Inbox",icon:"chat"}];

export function PlayerSpaceHeader({ tab, onNavigate, onAccount, onUpdates, unread=0, demo = false }: { tab?: Tab; onNavigate?: (tab: Tab) => void; onAccount?: () => void; onUpdates?:()=>void; unread?:number; demo?: boolean }) {
  return <header className="ps-header"><Link href="/player-portal" className="ps-brand" aria-label="STAR Player Space"><span className="ps-logo-paper"><Image src="/images/star-logo.jpg" alt="STAR Development Centre" width={112} height={100} priority/></span><span className="ps-brand-name">PLAYER SPACE</span></Link>
    {onNavigate && <nav aria-label="Player Space" className="ps-desktop-nav">{nav.map(item => <button type="button" key={item.id} onClick={() => onNavigate(item.id)} aria-current={tab === item.id ? "page" : undefined}><SpaceIcon name={item.icon}/><span>{item.title}</span></button>)}</nav>}
    <div className="ps-header-end">{demo && <span className="ps-demo-chip">SAMPLE SPACE</span>}{onUpdates&&<button className="ps-icon-button ps-updates-button" aria-label={`Open updates, ${unread} unread`} onClick={onUpdates}><SpaceIcon name="bell"/>{unread>0&&<span>{unread>99?"99+":unread}</span>}</button>}{onAccount ? <button className="ps-icon-button" type="button" aria-label="Open account options" onClick={onAccount}><SpaceIcon name="settings"/></button> : <Link className="ps-back-link" href="/">Back to STAR ↗</Link>}</div>
  </header>;
}

export function PlayerSpaceHero({ name = "PLAYER", compact = false }: { name?: string; compact?: boolean }) {
  return <section className={"ps-hero ps-paper" + (compact ? " ps-hero-compact" : "")}><div className="ps-hero-copy"><span className="ps-tape">THIS SPACE IS YOURS <span aria-hidden="true">☆</span></span><p className="ps-hello">HEY, {name}!</p><h1><span>BIG DREAMS.</span><br/><em>SMALL STEPS.</em></h1><p className="ps-hero-sub">Make your next move.</p><span className="ps-hero-arrow" aria-hidden="true">↗</span></div><Image className="ps-hero-player" src="/player-space/hero-player-star-kit.webp" alt="Illustrated STAR footballer looking confidently ahead" width={900} height={1350} sizes="(max-width: 600px) 55vw, 500px" priority/><span className="ps-hero-scribble" aria-hidden="true">SAME GIRL.<br/>BIGGER GOALS.</span></section>;
}

