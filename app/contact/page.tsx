import {pageMetadata} from '../../lib/siteMetadata';
import {Suspense} from "react";
import type {Metadata} from "next";
import {EnquiryForm} from "../../components/EnquiryForm";
import {enquiryResponseTime} from "../../lib/enquiries";
import "./contact.css";
export const metadata: Metadata = pageMetadata('/contact');
function ContactIcon({kind}: {kind: "chat" | "phone" | "mail"}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind === "chat" ? <><path d="M20 11.5a8 8 0 0 1-8 8H5l-4 3 1.5-6a8 8 0 1 1 17.5-5Z"/><path d="M7 9h8M7 13h5"/></> : kind === "phone" ? <path d="m7 3 3 5-3 3a16 16 0 0 0 6 6l3-3 5 3v3c0 1-1 2-2 2C9 22 2 15 2 5c0-1 1-2 2-2h3Z"/> : <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></>}</svg>;
}
export default function Page() {
  const onlineDeliveryAvailable = process.env.STAR_ENQUIRY_ENABLED === "true" && !!process.env.RESEND_API_KEY && !!process.env.STAR_ENQUIRY_FROM;
  return <div className="contact-page">
    <section className="contact-hero" aria-labelledby="contact-title"><div className="home-width"><div className="contact-hero-grid"><div><p className="contact-eyebrow">STAR / TAUNTON & WELLINGTON</p><h1 id="contact-title">LET’S TALK<br/>ABOUT HER<br/><span>FOOTBALL.</span></h1><p className="contact-lead">A question about coaching. A skill she wants to improve. A little help choosing where to begin.</p><a className="home-button home-button-red" href="#enquiry">Make an enquiry <span aria-hidden="true">↓</span></a></div><div className="contact-welcome"><p className="contact-eyebrow">START WITH WHAT MATTERS TO HER</p><h2>A conversation.<br/><span>A starting point.</span></h2><p>Tell us what she enjoys, what she finds difficult and what she would like from football. We’ll talk through the coaching and practical arrangements together.</p><div className="contact-response"><span aria-hidden="true">◷</span><p>{enquiryResponseTime}</p></div></div></div>
    <nav className="contact-channels" aria-label="Contact STAR directly"><a href="https://wa.me/447902594064" target="_blank" rel="noopener noreferrer"><ContactIcon kind="chat"/><div><span>WHATSAPP</span><strong>Message STAR</strong><small>07902 594064</small></div><span aria-hidden="true">↗</span></a><a href="tel:+447902594064"><ContactIcon kind="phone"/><div><span>CALL</span><strong>Have a conversation</strong><small>07902 594064</small></div><span aria-hidden="true">↗</span></a><a href="mailto:coachdmp7@gmail.com"><ContactIcon kind="mail"/><div><span>EMAIL</span><strong>Write to STAR</strong><small>coachdmp7@gmail.com</small></div><span aria-hidden="true">↗</span></a></nav></div></section>
    <section className="contact-form-section" id="enquiry" aria-label="Coaching enquiry"><div className="home-width"><Suspense fallback={<p role="status">Loading your enquiry…</p>}><EnquiryForm mode="general" onlineDeliveryAvailable={onlineDeliveryAvailable}/></Suspense></div></section>
  </div>;
}
