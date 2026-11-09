import Link from "next/link";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {StructuredData} from "../../../components/StructuredData";
import {eventAge,eventDate,eventPrice,eventTime,eventBookingUrl,getPublicEvent} from "../../../lib/starEvents";
import {siteOrigin,siteName,isPreview,privateRobots} from "../../../lib/siteMetadata";
import "../events.css";
export const dynamic="force-dynamic";

type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;const event=await getPublicEvent(slug);
 if(!event)return {title:"Event not found",robots:privateRobots};
 const title=event.title+" | "+siteName;
 return {title:{absolute:title},description:event.summary,alternates:{canonical:`${siteOrigin}/events/${event.slug}`},robots:isPreview?privateRobots:{index:true,follow:true},openGraph:{title,description:event.summary,url:`${siteOrigin}/events/${event.slug}`,siteName,type:"website"}};
}
export default async function EventDetail({params}:Props){
 const {slug}=await params;const event=await getPublicEvent(slug);if(!event)notFound();
 const cancelled=event.status==="cancelled";
 const finished=Date.parse(event.ends_at)<Date.now();
 const bookUrl=eventBookingUrl(event.registration_url);
 const emailLink=`mailto:coachdmp7@gmail.com?subject=${encodeURIComponent("STAR event enquiry: "+event.title)}`;
 const sameDay=eventDate(event.starts_at)===eventDate(event.ends_at);
 return <div className="star-events-page star-event-detail-page">
 <StructuredData data={{"@context":"https://schema.org","@type":"SportsEvent",name:event.title,description:event.summary,startDate:event.starts_at,endDate:event.ends_at,eventStatus:cancelled?"https://schema.org/EventCancelled":"https://schema.org/EventScheduled",eventAttendanceMode:"https://schema.org/OfflineEventAttendanceMode",url:`${siteOrigin}/events/${event.slug}`,organizer:{"@type":"Organization",name:siteName,url:siteOrigin},location:{"@type":"Place",name:event.venue_name,...(event.venue_address?{address:event.venue_address}:{})},...(event.price_pence!==null?{offers:{"@type":"Offer",url:bookUrl||`${siteOrigin}/events/${event.slug}`,priceCurrency:"GBP",price:(event.price_pence/100).toFixed(2)}}:{})}}/>
 <section className="star-events-hero"><div className="home-width star-events-hero-inner"><div>
  <Link className="star-event-detail-return" href="/events">← All STAR events</Link>
  <p className="star-events-eyebrow">{event.category}{cancelled?" / CANCELLED":""}</p>
  <div className="star-christmas-detail-head"><div><h1>{event.title}</h1><p className="star-events-hero-lead">{event.summary}</p></div>{event.slug==="christmas-football-festival-2026"&&<img src="/events/star-christmas-festival.svg" alt="STAR Christmas Football Festival emblem" className="star-christmas-detail-logo"/>}</div>
 </div></div></section>
 <section className="star-event-detail home-width" aria-labelledby="event-about">
  <div><p className="star-events-eyebrow">ALL THE DETAILS</p><h2 id="event-about">About this event.</h2><p>{event.description}</p><h2 style={{marginTop:40}}>Before you arrive.</h2><p>Check the date, venue, age guidance and joining information before you travel. If your daughter has any individual or accessibility needs, please get in touch so we can discuss them with you.</p><Link className="star-event-card-link" href="/contact">Questions? Contact STAR <span aria-hidden="true">↗</span></Link></div>
  <aside className="star-event-detail-sidebar" aria-label="Event information"><h2>Event information.</h2><dl>
   <dt>Date</dt><dd>{eventDate(event.starts_at)}{sameDay?"":" – "+eventDate(event.ends_at)}</dd>
   <dt>Time (UK)</dt><dd>{eventTime(event.starts_at)}–{eventTime(event.ends_at)}</dd>
   <dt>Venue</dt><dd>{event.venue_name}{event.venue_address&&<><br/>{event.venue_address}</>}</dd>
   <dt>Age group</dt><dd>{eventAge(event.minimum_age,event.maximum_age)}</dd>
   <dt>Price</dt><dd>{event.slug==="christmas-football-festival-2026"?"£10 early bird / £15 standard":eventPrice(event.price_pence)}</dd>
   {event.capacity!==null&&<><dt>Event capacity</dt><dd>Up to {event.capacity} participants</dd></>}
  </dl>
  {event.slug==="christmas-football-festival-2026"?<p role="status" className="star-event-detail-pending">Registration is not yet open. The date and venue are proposed and will be confirmed before booking begins.</p>:cancelled?<p role="status" className="star-event-detail-cancelled">This event has been cancelled. Please contact STAR with any questions.</p>:finished?<p role="status" className="star-event-detail-cancelled">This event has finished.</p>:<><a href={bookUrl||emailLink} target={bookUrl?"_blank":undefined} rel={bookUrl?"noopener noreferrer":undefined}>{bookUrl?"Register for this event ↗":"Enquire about this event ↗"}</a><small>{bookUrl?"Registration is handled through the linked booking page.":"Enquiries are not confirmed bookings. STAR will explain availability and joining arrangements."}</small></>}
  </aside>
 </section>
 <section className="star-events-about"><div className="home-width"><p className="star-events-eyebrow">KEEP PLAYING. KEEP DEVELOPING.</p><h2>Explore <span>STAR coaching.</span></h2><p>Events are just one way to experience STAR. Our regular development programmes offer more opportunities throughout the year.</p><Link className="star-events-button star-events-button-red" href="/programmes">See our programmes ↗</Link></div></section>
 </div>;
}
