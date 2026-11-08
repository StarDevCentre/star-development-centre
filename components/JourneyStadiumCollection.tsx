"use client";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import "./player-collections.css";
import "./journey-stadiums.css";
export const journeyStadiums=[
{id:"wembley",name:"Wembley Stadium",location:"London, England",fact:"Wembley hosted the UEFA Women's EURO 2022 final.",level:15},
{id:"emirates",name:"Emirates Stadium",location:"London, England",fact:"Arsenal Women play major home fixtures at the Emirates Stadium.",level:30},
{id:"old-trafford",name:"Old Trafford",location:"Manchester, England",fact:"Old Trafford hosted the opening match of UEFA Women's EURO 2022.",level:45},
{id:"etihad",name:"Etihad Stadium",location:"Manchester, England",fact:"Manchester City Women have played major matches at the Etihad Stadium.",level:60},
{id:"goodison-park",name:"Goodison Park",location:"Liverpool, England",fact:"In 1920, Dick, Kerr Ladies played before a crowd of approximately 53,000 here.",level:75},
{id:"camp-nou",name:"Camp Nou",location:"Barcelona, Spain",fact:"FC Barcelona Femení set a women's football attendance record here in 2022.",level:90}
] as const;
export function JourneyStadiumCollection({unlockedStadiumIds=[]}:{unlockedStadiumIds?:readonly string[]}){
 const [selected,setSelected]=useState<(typeof journeyStadiums)[number]|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(selected&&!dialog.current?.open)dialog.current?.showModal();if(!selected&&dialog.current?.open)dialog.current.close()},[selected]);
 const owns=(id:string)=>unlockedStadiumIds.includes(id);
 const total=journeyStadiums.filter(s=>owns(s.id)).length;
 return <section className="ps-boot-view" aria-label="The Journey stadium collection">
 <div className="ps-title-paper ps-paper"><span className="ps-tape">DISCOVER THE GROUNDS. LEARN THEIR STORIES.</span><h1>STADIUM<br/><em>COLLECTION.</em></h1><p>Explore illustrated football landmarks. Progress through STAR: The Journey to collect each stadium.</p><span className="ps-stat">{total} of {journeyStadiums.length} stadiums collected</span></div>
 <div className="ps-boot-locker">{journeyStadiums.map((s,i)=>{const own=owns(s.id);return <button type="button" key={s.id} className={'ps-boot-cubby '+(own?'is-collected':'is-locked')} onClick={()=>setSelected(s)} aria-label={s.name+', '+(own?'collected':'locked')+', view stadium'}><span className="ps-cubby-number">{String(i+1).padStart(2,'0')}</span><span className="ps-boot-status">{own?'✓ COLLECTED':'🔒 TO COLLECT'}</span><Image src={'/journey/stadiums/stadium-'+s.id+'.svg'} alt={'Illustration of '+s.name} width={500} height={500} unoptimized/><strong>{s.name}</strong><small>{s.location}</small><span className="ps-cubby-label">{own?'VIEW STADIUM ↗':'EARN THROUGH THE JOURNEY}</span></button>})}</div>
 <div className="ps-boot-how ps-paper"><div><h2>Every stadium has a story.</h2><p>Stadium collectibles celebrate football history and are earned through story progress. No purchases or random rewards.</p><p className="ps-fineprint">Preview: all stadiums remain locked until the game supplies verified, player-specific unlock entitlements. This preview does not issue rewards.</p></div></div>
 <dialog ref={dialog} className="ps-boot-dialog" aria-labelledby="journey-stadium-title" onClose={()=>setSelected(null)}><button type="button" className="ps-dialog-close" aria-label="Close stadium details" onClick={()=>setSelected(null)}>×</button>{selected&&<><span className="ps-eyebrow">{owns(selected.id)?'IN YOUR COLLECTION':'NOT YET COLLECTED'}</span><Image src={'/journey/stadiums/stadium-'+selected.id+'.svg'} alt={'Illustration of '+selected.name} width={500} height={500} unoptimized/><h2 id="journey-stadium-title">{selected.name}</h2><p>{selected.location}</p><div className="ps-coach-note"><strong>Football history</strong><p>{selected.fact}</p></div></>}</dialog>
 </section>;
}