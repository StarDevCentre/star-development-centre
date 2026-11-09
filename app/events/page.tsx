import Link from "next/link";
import {pageMetadata} from "../../lib/siteMetadata";
import {getPublicEvents} from "../../lib/starEvents";
import {EventsListing} from "../../components/EventsListing";
import "./events.css";

export const metadata=pageMetadata("/events");
export const dynamic="force-dynamic";

export default async function EventsPage(){
 const events=await getPublicEvents();
 return <div className="star-events-page">
  <section className="star-events-hero"><div className="home-width star-events-hero-inner"><div className="star-events-hero-copy">
   <p className="star-events-eyebrow">STAR DEVELOPMENT CENTRE / SOMERSET</p>
   <h1>MORE THAN<br/><span>THE GAME.</span></h1>
   <p className="star-events-hero-lead">Football camps, skills clinics, open days and special experiences for girls. New opportunities to enjoy the game, grow in confidence and make memories.</p>
   <div className="star-events-actions"><a href="#upcoming-events" className="star-events-button star-events-button-red">Explore upcoming events <span aria-hidden="true">↓</span></a><Link href="/programmes" className="star-events-button star-events-button-ghost">Our coaching programmes <span aria-hidden="true">↗</span></Link></div>
  </div><div className="star-events-hero-graphic" aria-hidden="true"><div className="star-events-pitch-circle"/><div className="star-events-hero-star">★</div><span>PLAY · LEARN · BELONG</span></div></div></section>
  <EventsListing events={events} asOf={new Date().toISOString()}/>
  <section className="star-events-about"><div className="home-width star-events-about-inner"><div><p className="star-events-eyebrow">ALL ABILITIES. EVERY AMBITION.</p><h2>A place to <span>belong.</span></h2><p>STAR events are designed to give girls more ways to experience football. Each event will explain its age range, location, price and what to expect, so parents can decide if it suits their daughter.</p><p>We welcome conversations about individual support needs before an event. Contact us to discuss practical adjustments, access or anything that might help your daughter feel comfortable.</p></div><div className="star-events-about-action"><strong>BELIEVE.<br/>DEVELOP.<br/><span>ACHIEVE.</span></strong><Link href="/contact">Talk to STAR about an event <span aria-hidden="true">↗</span></Link></div></div></section>
 </div>;
}
