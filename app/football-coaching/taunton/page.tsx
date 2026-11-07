import Image from "next/image";
import Link from "next/link";
import type {Metadata} from "next";
import {StructuredData} from "../../../components/StructuredData";
import {pageMetadata,siteOrigin} from "../../../lib/siteMetadata";
import "./taunton.css";

export const metadata:Metadata=pageMetadata("/football-coaching/taunton");

const fees=[
  {name:"One to One Coaching",ages:"11–18",price:"£40",details:"60-minute individual session · pay after the session",href:"/programmes#one-to-one"},
  {name:"STAR Flyers",ages:"7–10",price:"£375",details:"16 weekly 60-minute sessions · upfront, or three payments totalling £380",href:"/programmes#flyers"},
  {name:"STAR Prestige",ages:"11–18",price:"£800",details:"24 weeks · upfront, or 3 × £280 (£840 total), or 6 × £150 (£900 total)",href:"/programmes#prestige"},
  {name:"STAR Sparks",ages:"5–10",price:"£5",details:"Per 60-minute group session · pay as you go",href:"/programmes#sparks"},
  {name:"Development Groups",ages:"11–16",price:"£5",details:"Per 45-minute group session · pay as you go",href:"/programmes#development"},
  {name:"Player Season Support",ages:"Club players",price:"£25",details:"Per agreed club visit · match observations and support by arrangement",href:"/programmes#season-support"}
];
const timetable=[
  {day:"Monday",time:"3:45–4:45pm",name:"STAR Sparks",ages:"5–7 and 8–10 · two groups with different coaches"},
  {day:"Tuesday",time:"4pm start · 45 minutes",name:"Development Group",ages:"11–13"},
  {day:"Tuesday",time:"5pm start · 45 minutes",name:"Development Group",ages:"14–16"}
];

export default function TauntonFootballCoaching(){
  return <div className="local-page star-home">
    <StructuredData data={{
      "@context":"https://schema.org","@type":"Service",
      "@id":siteOrigin+"/football-coaching/taunton#service",
      name:"Football coaching in Taunton for girls aged 5–18",
      serviceType:"Girls’ football coaching and individual player development",
      provider:{"@id":siteOrigin+"/#organisation"},
      areaServed:{"@type":"City",name:"Taunton"},
      audience:{"@type":"PeopleAudience",suggestedMinAge:5,suggestedMaxAge:18},
      url:siteOrigin+"/football-coaching/taunton",
      description:"One-to-one and group football coaching for girls aged 5–18 in the Taunton area. Individual venue and session arrangements must be confirmed with STAR."
    }}/>
    <StructuredData data={{
      "@context":"https://schema.org","@type":"BreadcrumbList",
      itemListElement:[
        {"@type":"ListItem",position:1,name:"Home",item:siteOrigin+"/"},
        {"@type":"ListItem",position:2,name:"Where We Coach",item:siteOrigin+"/where-we-coach"},
        {"@type":"ListItem",position:3,name:"Taunton football coaching",item:siteOrigin+"/football-coaching/taunton"}
      ]
    }}/>
    <section className="local-hero" aria-labelledby="taunton-title">
      <div className="local-container local-hero-grid">
        <div className="local-hero-copy">
          <nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/where-we-coach">Where we coach</Link><span aria-hidden="true">/</span><span>Taunton</span></nav>
          <p className="local-kicker">STAR DEVELOPMENT CENTRE · SOMERSET</p>
          <h1 id="taunton-title">FOOTBALL COACHING<br/>IN <em>TAUNTON.</em><span> BUILT FOR GIRLS.</span></h1>
          <p className="local-hero-lead">Personal football coaching for girls aged 5–18, from their first experience with the ball to focused development alongside club football.</p>
          <p>At STAR, the player's confidence, enjoyment and goals come first. We work with families across the Taunton area to find coaching that suits her age, experience and ambitions.</p>
          <div className="local-actions"><Link className="local-button local-button-red" href="/register">Book a free 30-minute assessment <span aria-hidden="true">→</span></Link><a className="local-button local-button-outline" href="#coaching-options">Explore coaching options</a></div>
          <p className="local-small">The assessment is free, with no obligation to join. STAR confirms its date and venue after the request.</p>
        </div>
        <div className="local-hero-visual"><Image src="/images/star-player-individual.webp" alt="STAR Development Centre football training image" width={850} height={1366} sizes="(max-width: 820px) 100vw, 48vw" priority/><div className="local-photo-caption">BELIEVE <span>·</span> DEVELOP <span>·</span> ACHIEVE</div></div>
      </div>
    </section>

    <section className="local-section local-intro" id="coaching-options" aria-labelledby="taunton-coaching-title">
      <div className="local-container">
        <p className="local-kicker">ONE PLAYER. HER OWN WAY FORWARD.</p>
        <h2 id="taunton-coaching-title">Football coaching that<br/><span>starts with her.</span></h2>
        <div className="local-split">
          <div><p>Looking for football coaching in Taunton that recognises the individual, not just the team? STAR welcomes girls who are new to football, building confidence, playing grassroots matches or ready for more targeted practice. We listen first, then choose suitable activities and realistic next steps.</p><p>Our lead service is <strong>One to One Coaching for ages 11–18</strong>. Each 60-minute session gives one player the space to practise skills, explore decisions and ask questions. We might work on her first touch, protecting the ball, movement, passing or a situation from her own matches. The focus comes from her game—not a generic session script.</p><p>You can book individual sessions without committing to a full programme. For younger players, STAR Flyers offers a structured individual option, while Prestige provides a longer development journey for ages 11–18, with an individual plan, progress reports and regular reviews.</p></div>
          <aside className="local-spotlight"><span className="local-spotlight-label">FEATURED · AGES 11–18</span><h3>One to One Coaching.</h3><p>60 minutes, tailored to her football and what she wants to improve.</p><strong>£40 <small>per session</small></strong><Link href="/programmes#one-to-one">Explore individual coaching <span aria-hidden="true">→</span></Link></aside>
        </div>
      </div>
    </section>

    <section className="local-section local-schedule" aria-labelledby="taunton-sessions-title">
      <div className="local-container">
        <div className="local-heading-row"><div><p className="local-kicker">GROUP COACHING</p><h2 id="taunton-sessions-title">Published programme<br/><span>session times.</span></h2></div><p>Group coaching gives girls time on the ball with other players of a similar age. STAR Sparks introduces ages 5–10 to football through enjoyable activities; Development Groups support ages 11–16 with technique and decisions.</p></div>
        <div className="local-timetable" role="list">
          {timetable.map(s=><div className="local-time-row" role="listitem" key={s.day+s.time}><strong>{s.day}</strong><span>{s.time}</span><div><b>{s.name}</b><small>{s.ages}</small></div></div>)}
        </div>
        <div className="local-venue-note"><strong>Important: these are STAR's published programme times, not confirmed Taunton bookings.</strong><p>We have not published a fixed Taunton venue or confirmed that every group runs in this town. Ask STAR which dates, venues and places are actually available. For one-to-one sessions and free assessments, we agree the date, playing surface, meeting point and suitable footwear individually before you attend.</p></div>
      </div>
    </section>

    <section className="local-section local-prices" id="prices" aria-labelledby="taunton-prices-title">
      <div className="local-container">
        <p className="local-kicker">CLEAR PRICES. NO GUESSWORK.</p><h2 id="taunton-prices-title">Explore every<br/><span>coaching option.</span></h2>
        <p className="local-intro-copy">These are STAR's current programme prices. Eligibility depends on age, and a programme's availability in the Taunton area needs confirming. The free introductory assessment comes before any paid commitment.</p>
        <div className="local-fee-grid">{fees.map(f=><article className="local-fee" key={f.name}><div><p className="local-fee-age">{f.ages}</p><h3>{f.name}</h3><p>{f.details}</p></div><div className="local-fee-bottom"><strong>{f.price}</strong><Link href={f.href}>Programme details <span aria-hidden="true">→</span></Link></div></article>)}</div>
        <p className="local-fee-note">Girls aged 17–18 can explore individual options; group sessions are for ages 5–16. No academy trials or selection are guaranteed.</p>
      </div>
    </section>

    <section className="local-section local-area" aria-labelledby="taunton-area-title">
      <div className="local-container local-area-grid">
        <div><p className="local-kicker">LOCAL TO TAUNTON</p><h2 id="taunton-area-title">Coaching for families<br/><span>across the area.</span></h2><p>We welcome enquiries from Taunton and nearby communities including Staplegrove, Bishop's Hull, Galmington, Trull, Norton Fitzwarren and Monkton Heathfield. Tell us where you're travelling from so we can discuss a practical arrangement.</p><p>STAR does not operate a public walk-in training site. We confirm the venue for an agreed session rather than advertising an unverified address. Parents can ask about the playing surface, access, travel and watching arrangements before booking.</p><Link href="/where-we-coach">See all areas we coach <span aria-hidden="true">→</span></Link></div>
        <div className="local-area-panel"><p className="local-kicker">NEED A STARTING POINT?</p><h3>Meet your coach.<br/>Try some football.</h3><p>Our free 30-minute assessment is a relaxed introduction for your daughter. We'll find out what she enjoys, see how she approaches simple football activities and talk with you about the right next step.</p><Link className="local-button local-button-red" href="/register">Book her free assessment <span aria-hidden="true">→</span></Link><Link className="local-quiet-link" href="/first-session">What happens at the first session?</Link></div>
      </div>
    </section>

    <section className="local-section local-faq" aria-labelledby="taunton-faq-title">
      <div className="local-container local-faq-grid"><div><p className="local-kicker">PARENTS' QUESTIONS</p><h2 id="taunton-faq-title">Good to know<br/><span>before you start.</span></h2></div><div>
        <details><summary>Does my daughter need to play for a team?</summary><p>No. Beginners are welcome, as are girls who already play for a club. Coaching can complement—not replace—her existing team football.</p></details>
        <details><summary>Can you support an autistic or neurodivergent player?</summary><p>Yes. We discuss communication, sensory preferences and practical adjustments with each family, and involve the player in choosing what works for her. <Link href="/inclusion">Read about inclusion at STAR.</Link></p></details>
        <details><summary>Where exactly will coaching take place in Taunton?</summary><p>We will confirm the specific venue and meeting point before an agreed session. The timetable above is not a promise of a place or venue in Taunton. <Link href="/contact">Ask about current availability.</Link></p></details>
        <details><summary>How do I book the free assessment?</summary><p><Link href="/register">Start with a parent account</Link>, complete her player details and send the assessment request. STAR then agrees the date and venue with you. It is free and does not enrol her in a paid programme.</p></details>
      </div></div>
    </section>
    <section className="local-last"><div className="local-container"><p className="local-kicker">HER FOOTBALL. HER NEXT STEP.</p><h2>Ready to see what<br/><span>she can achieve?</span></h2><p>Start with a conversation and a free assessment, without any pressure to commit to coaching.</p><div className="local-actions"><Link className="local-button local-button-red" href="/register">Book a free 30-minute assessment <span aria-hidden="true">→</span></Link><Link className="local-button local-button-outline" href="/contact">Ask STAR a question</Link></div></div></section>
  </div>;
}
