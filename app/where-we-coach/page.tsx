import Link from "next/link";
import type {Metadata} from "next";
import {pageMetadata,siteOrigin} from "../../lib/siteMetadata";
import {StructuredData} from "../../components/StructuredData";

export const metadata:Metadata=pageMetadata("/where-we-coach");

const locations=[
  {id:"taunton",name:"Taunton",text:"Looking for girls’ football coaching in Taunton? STAR offers individual and group coaching options to support players at different stages of their football journey."},
  {id:"bridgwater",name:"Bridgwater",text:"Families looking for girls’ football coaching in Bridgwater can enquire about STAR’s age-appropriate coaching and individual development programmes."},
  {id:"wellington",name:"Wellington",text:"STAR provides girls’ football coaching in Wellington, with sessions designed around the player’s experience, confidence and development priorities."}
];
export default function WhereWeCoach(){return <main className="star-home">
<StructuredData data={{"@context":"https://schema.org","@type":"Service","@id":siteOrigin+"/where-we-coach#service",name:"Girls’ football coaching in Taunton, Bridgwater and Wellington",serviceType:"Girls’ football coaching",provider:{"@id":siteOrigin+"/#organisation"},areaServed:[{"@type":"City",name:"Taunton"},{"@type":"City",name:"Bridgwater"},{"@type":"City",name:"Wellington"}],audience:{"@type":"PeopleAudience",suggestedMinAge:5,suggestedMaxAge:18},url:siteOrigin+"/where-we-coach",description:"Individual and group girls’ football coaching in Somerset. Exact session venues are arranged and confirmed individually."}}/>
<section className="home-section" style={{background:"#071a34",color:"#fff",padding:"clamp(56px,8vw,110px) 0"}}>
<div className="home-width">
<p className="home-eyebrow" style={{color:"#f5c64d"}}>TAUNTON · BRIDGWATER · WELLINGTON</p>
<h1 style={{fontSize:"clamp(40px,6vw,78px)",lineHeight:1.04,maxWidth:950,margin:"16px 0 24px"}}>GIRLS’ FOOTBALL COACHING<br/><span style={{color:"#f5c64d"}}>ACROSS SOMERSET.</span></h1>
<p style={{fontSize:"clamp(17px,2vw,21px)",lineHeight:1.65,maxWidth:760}}>STAR Development Centre offers girls’ football coaching in Taunton, Bridgwater and Wellington. Whether she is just starting or wants focused support alongside club football, we’ll help you explore the right next step.</p>
<div className="home-actions"><Link className="home-button home-button-red" href="/register">Request her free assessment →</Link><Link className="home-button home-button-outline" href="/programmes">Explore programmes</Link></div>
</div></section>
<section className="home-section" style={{padding:"clamp(44px,6vw,80px) 0"}}><div className="home-width">
<p className="home-eyebrow">COACHING LOCATIONS</p><h2 style={{fontSize:"clamp(30px,4vw,48px)",margin:"12px 0 18px"}}>Three towns. One approach.</h2>
<p style={{maxWidth:820,lineHeight:1.75}}>STAR coaching is available in all three towns. <strong>We arrange the specific venue individually</strong> when discussing a session with your family. We’ll confirm where to meet, the playing surface and any practical details before you attend. We do not operate a fixed public walk-in venue.</p>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,270px),1fr))",gap:20,marginTop:32}}>
{locations.map(place=><article id={place.id} key={place.id} style={{border:"1px solid #d8dfe7",borderRadius:16,padding:"28px",background:"#fff",color:"#0b203c"}}>
<p style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"#a17a19",margin:"0 0 12px"}}>SOMERSET</p>
<h3 style={{fontSize:29,margin:"0 0 12px"}}>{place.name}</h3><p style={{lineHeight:1.7}}>{place.text}</p><Link href={place.id==="taunton"?"/football-coaching/taunton":"/contact"} style={{fontWeight:700,color:"#a21b2c"}}>{place.id==="taunton"?"Explore football coaching in Taunton":"Ask about coaching in "+place.name} →</Link></article>)}
</div></div></section>
<section className="home-section" style={{background:"#eef2f6",padding:"clamp(44px,6vw,76px) 0"}}><div className="home-width">
<p className="home-eyebrow">FIND HER NEXT STEP</p><h2 style={{fontSize:"clamp(30px,4vw,48px)",margin:"12px 0 18px"}}>Coaching that fits her.</h2>
<p style={{maxWidth:790,lineHeight:1.75}}>Our options include group coaching for girls aged 5–16 and individual development programmes for eligible age groups. We welcome complete beginners as well as players already involved in grassroots football. Availability and suitable locations are confirmed individually.</p>
<div className="home-actions"><Link className="home-button home-button-red" href="/programmes">Compare coaching programmes →</Link><Link className="home-button home-button-outline" href="/contact">Ask us a question</Link></div>
</div></section>
<section className="home-section" style={{padding:"clamp(44px,6vw,76px) 0"}}><div className="home-width"><p className="home-eyebrow">BEFORE HER FIRST SESSION</p><h2 style={{fontSize:"clamp(30px,4vw,48px)",margin:"12px 0 18px"}}>Know where you’re going.</h2><p style={{maxWidth:800,lineHeight:1.75}}>When you enquire, tell us which of Taunton, Bridgwater or Wellington works best for you. We’ll discuss the programme, available arrangements and confirm the exact meeting point before the session. No venue address is published here because locations are agreed individually.</p><div className="home-actions"><Link className="home-button home-button-red" href="/register">Request a free assessment →</Link><Link className="home-button home-button-outline" href="/first-session">What to expect</Link></div></div></section>
</main>}
