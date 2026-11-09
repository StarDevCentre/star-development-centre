"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {eventAge,eventCategories,eventDate,eventPrice,eventTime,type StarEvent} from "../lib/starEvents";

function EventCard({event}:{event:StarEvent}){
 const cancelled=event.status==="cancelled";
 return <article className="star-event-card">
  <div className="star-event-card-art">
   {(event.image_url?.startsWith("https://")||event.image_url?.startsWith("/events/"))?<img src={event.image_url} alt="" loading="lazy"/>:<div className="star-event-art-mark" aria-hidden="true"><span>★</span><small>STAR EVENTS</small></div>}
   <div className="star-event-date-stamp"><strong>{new Date(event.starts_at).toLocaleDateString("en-GB",{day:"2-digit",timeZone:"Europe/London"})}</strong><span>{new Date(event.starts_at).toLocaleDateString("en-GB",{month:"short",timeZone:"Europe/London"}).toUpperCase()}</span></div>
  </div>
  <div className="star-event-card-content">
   <div className="star-event-tags"><span>{event.category}</span>{cancelled&&<span className="star-event-cancelled">Cancelled</span>}</div>
   <h3><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>
   <p className="star-event-description">{event.summary}</p>
   <dl className="star-event-facts">
    <div><dt>Date and time</dt><dd>{eventDate(event.starts_at)} · {eventTime(event.starts_at)}</dd></div>
    <div><dt>Where</dt><dd>{event.venue_name}</dd></div>
    <div><dt>Who and price</dt><dd>{eventAge(event.minimum_age,event.maximum_age)} · {eventPrice(event.price_pence)}</dd></div>
   </dl>
   <Link className="star-event-card-link" href={`/events/${event.slug}`}>View event details <span aria-hidden="true">↗</span></Link>
  </div>
 </article>;
}

export function EventsListing({events,asOf}:{events:StarEvent[];asOf:string}){
 const [category,setCategory]=useState("All events");
 const [pastOpen,setPastOpen]=useState(false);
 const now=Date.parse(asOf);
 const upcoming=useMemo(()=>events.filter(e=>Date.parse(e.ends_at)>=now && (category==="All events"||e.category===category)),[events,now,category]);
 const past=useMemo(()=>events.filter(e=>Date.parse(e.ends_at)<now && (category==="All events"||e.category===category)).reverse(),[events,now,category]);
 const available=eventCategories.filter(c=>events.some(e=>e.category===c));
 return <div className="star-events-content home-width" id="upcoming-events">
  <div className="star-events-heading"><div><p className="star-events-eyebrow">WHAT'S HAPPENING AT STAR</p><h2>Upcoming <span>events.</span></h2><p>Discover opportunities to train, play, learn and connect. Dates and booking details are published here when confirmed.</p></div><span className="star-events-count">{events.filter(e=>Date.parse(e.ends_at)>=now).length} announced</span></div>
  {available.length>1&&<div className="star-event-filter" role="group" aria-label="Filter events by category">{["All events",...available].map(item=><button type="button" key={item} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div>}
  {upcoming.length?<div className="star-events-grid">{upcoming.map(e=><EventCard key={e.id} event={e}/>)}</div>:<div className="star-events-empty"><span className="star-events-empty-symbol" aria-hidden="true">★</span><h3>{events.length?"No matching upcoming events.":"New events are on the horizon."}</h3><p>{events.length?"Try another event category or explore past activities.":"We haven't announced any upcoming event dates yet. Once a camp, clinic, open day or special event is confirmed, you'll find the details here."}</p><Link href="/contact">Ask STAR about future events <span aria-hidden="true">↗</span></Link></div>}
  {past.length>0&&<section className="star-events-past" aria-labelledby="star-past-title"><div><p className="star-events-eyebrow">OUR FOOTBALL JOURNEY</p><h2 id="star-past-title">Past events.</h2><p>Look back at activities that have already taken place.</p></div><button className="star-events-past-toggle" type="button" aria-expanded={pastOpen} onClick={()=>setPastOpen(!pastOpen)}>{pastOpen?"Hide past events":"Explore past events"} <span aria-hidden="true">{pastOpen?"−":"+"}</span></button>{pastOpen&&<div className="star-events-grid">{past.map(e=><EventCard key={e.id} event={e}/>)}</div>}</section>}
 </div>;
}
