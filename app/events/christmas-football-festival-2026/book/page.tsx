import Link from "next/link";
import type {Metadata} from "next";
import {FestivalGuestBookingForm} from "../../../../components/FestivalGuestBookingForm";
import {privateRobots} from "../../../../lib/siteMetadata";
import "../../events.css";
import "./booking.css";

export const metadata:Metadata={
 title:"Christmas Football Festival guest booking | STAR Development Centre",
 description:"One-off parent and guardian booking request for STAR Christmas Football Festival. No membership or account required.",
 robots:privateRobots
};
export default function ChristmasFestivalGuestBooking(){
 return <main className="star-events-page star-festival-booking-page">
  <section className="star-events-hero">
   <div className="home-width star-festival-booking-hero">
    <div><Link className="star-event-detail-return" href="/events/christmas-football-festival-2026">← Festival details</Link>
     <p className="star-events-eyebrow">ONE-OFF EVENT / NO MEMBERSHIP NEEDED</p>
     <h1>BOOK YOUR<br/><span>FESTIVAL PLACE.</span></h1>
     <p className="star-events-hero-lead">For parents and guardians booking the STAR Christmas Football Festival on Monday 21 December 2026.</p>
    </div>
    <img src="/events/star-christmas-festival.png" alt="STAR Christmas Football Festival logo" className="star-festival-booking-logo"/>
   </div>
  </section>
  <section className="home-width star-festival-booking-shell">
   <FestivalGuestBookingForm/>
  </section>
 </main>;
}
