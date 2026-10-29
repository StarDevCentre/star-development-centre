"use client";
import Link from "next/link";
import {type FormEvent, useEffect, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import {programmes} from "../lib/siteData";
import {groupSessions, playerAges} from "../lib/programmeOptions";
import {enquiryResponseTime, enquiryText, enquiryWasReceived, initialEnquirySelection, type EnquiryMode} from "../lib/enquiries";
import "./enquiry-form.css";
type Status = "idle" | "sending" | "prepared" | "sent" | "unconfirmed" | "error";
export function EnquiryForm({mode, onlineDeliveryAvailable = true}: {mode: EnquiryMode; onlineDeliveryAvailable?: boolean}) {
  const params = useSearchParams();
  const [initial] = useState(() => initialEnquirySelection(params));
  const [programme, setProgramme] = useState(initial.programme), [age, setAge] = useState(initial.age), [session, setSession] = useState(initial.session);
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [phone, setPhone] = useState(""), [message, setMessage] = useState(""), [website, setWebsite] = useState("");
  const [agree, setAgree] = useState(false), [status, setStatus] = useState<Status>("idle");
  const inFlight = useRef(false), result = useRef<HTMLDivElement>(null);
  const selected = programmes.find(p => p.slug === programme);
  const groups = groupSessions.filter(g => g.slug === programme);
  const chosenGroup = groups.find(g => g.id === session);
  const text = enquiryText({mode, name, email, phone, age, programme, session, message});
  const subject = mode === "booking" ? "STAR session request" : "STAR coaching enquiry";
  const mail = "mailto:coachdmp7@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
  const whatsapp = "https://wa.me/447902594064?text=" + encodeURIComponent(text);
  useEffect(() => {if (["sent", "prepared", "unconfirmed", "error"].includes(status)) result.current?.focus();}, [status]);
  function edit() {if (status !== "idle" && status !== "sending" && status !== "sent") setStatus("idle");}
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agree || inFlight.current || status === "sent") return;
    if (!onlineDeliveryAvailable) {setStatus("prepared"); return;}
    inFlight.current = true; setStatus("sending");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/enquiry", {method: "POST", headers: {"Content-Type": "application/json"}, signal: controller.signal, body: JSON.stringify({mode, name, email, phone, age, programme, message, session, consent: agree, website})});
      const data: unknown = await response.json().catch(() => null);
      if (enquiryWasReceived(response.ok, data)) setStatus("sent");
      else if (response.status === 503) setStatus("prepared");
      else setStatus(response.status === 400 ? "error" : "unconfirmed");
    } catch {setStatus("unconfirmed");}
    finally {window.clearTimeout(timeout); inFlight.current = false;}
  }
  return <div className="star-enquiry-layout"><form className="star-enquiry-form" onSubmit={submit} onChange={edit} aria-label="Coaching enquiry form" aria-busy={status === "sending"}>
    {status === "sent" ? <div className="star-enquiry-received" role="status" tabIndex={-1} ref={result}><span className="star-enquiry-received-icon" aria-hidden="true">✓</span><p className="star-enquiry-eyebrow">THANK YOU FOR GETTING IN TOUCH</p><h2>Enquiry received.</h2><p>STAR has received your enquiry{selected ? " about " + selected.title : ""}. We’ll reply using the contact details you provided.</p><p className="star-enquiry-response">{enquiryResponseTime}</p><p>You can leave this page. Your enquiry does not confirm a booking or commit you to payment.</p><Link className="star-enquiry-link" href="/programmes">Explore the coaching programmes →</Link></div> : <>
      <div className="star-form-heading"><span>YOUR COACHING ENQUIRY</span><h2>{mode === "booking" ? "Ask about a session." : "Tell us a little."}</h2><p>{onlineDeliveryAvailable ? "Send a message to discuss coaching, availability or the right starting point." : "Fill in your details, then choose email or WhatsApp to send your enquiry."}</p><p className="star-enquiry-response">{enquiryResponseTime}</p></div>
      <div className="star-enquiry-selection"><div><span>YOUR ENQUIRY</span><strong>{selected?.title || "Help choosing a programme"}</strong><p>{[age ? "Player aged " + age : "Player age not yet selected", chosenGroup ? "Group ages " + chosenGroup.minAge + "–" + chosenGroup.maxAge + " · " + chosenGroup.schedule : selected?.age.replace("AGES", "Programme ages")].filter(Boolean).join(" · ")}</p></div><button type="button" onClick={() => document.getElementById("programme-choice")?.focus()}>Change selection ↓</button></div>
      <fieldset className="star-enquiry-fields" disabled={status === "sending"}><legend className="star-enquiry-sr-only">Your contact details and coaching preferences</legend><div className="star-field-grid">
        <div className="star-field"><label htmlFor="parent-name">Parent or guardian name <span aria-hidden="true">*</span></label><input id="parent-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/></div>
        <div className="star-field"><label htmlFor="parent-email">Email address <span aria-hidden="true">*</span></label><input id="parent-email" name="email" type="email" autoComplete="email" required maxLength={200} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></div>
        <div className="star-field"><label htmlFor="parent-phone">Phone number <span>(optional)</span></label><input id="parent-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Best contact number"/></div>
        <div className="star-field"><label htmlFor="player-age">Player’s age <span>(optional)</span></label><select id="player-age" name="age" value={age} onChange={e => {setAge(e.target.value); if (chosenGroup && e.target.value && (Number(e.target.value) < chosenGroup.minAge || Number(e.target.value) > chosenGroup.maxAge)) setSession("");}}><option value="">Choose an age</option>{playerAges.map(n => <option key={n} value={n}>{n} years</option>)}</select></div>
        <div className="star-field star-field-wide"><label htmlFor="programme-choice">Programme of interest</label><select id="programme-choice" name="programme" value={programme} onChange={e => {setProgramme(e.target.value); setSession("");}}><option value="">Not sure — please advise</option>{programmes.map(p => <option key={p.slug} value={p.slug}>{p.title} · {p.age}</option>)}</select></div>
        {groups.length > 0 && <div className="star-field star-field-wide"><label htmlFor="enquiry-session">Group session <span>(optional)</span></label><select id="enquiry-session" name="session" value={session} onChange={e => setSession(e.target.value)}><option value="">Please advise on a suitable group</option>{groups.map(g => <option key={g.id} value={g.id}>Ages {g.minAge}–{g.maxAge} · {g.schedule}</option>)}</select></div>}
        <div className="star-field star-field-wide"><label htmlFor="enquiry-message">What would you like to ask? <span>(optional)</span></label><textarea id="enquiry-message" name="message" rows={4} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} aria-describedby="enquiry-privacy" placeholder="Tell us about the coaching you’re looking for, or ask us a question."/><p id="enquiry-privacy" className="star-enquiry-field-note">Please leave out a child’s full name, medical details or other sensitive information. We can discuss support needs privately.</p></div>
      </div><div className="star-enquiry-trap" aria-hidden="true"><label htmlFor="enquiry-website">Leave this field empty</label><input id="enquiry-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></div>
      <label className="star-consent"><input type="checkbox" name="consent" required checked={agree} onChange={e => setAgree(e.target.checked)}/><span>I am a parent or guardian and agree that STAR may use these details to respond to my enquiry. <span aria-hidden="true">*</span></span></label><p className="star-enquiry-field-note">An enquiry does not confirm a place or commit you to payment. Fields marked * are required.</p>
      <button className="button primary star-submit" type="submit">{status === "sending" ? "Sending…" : onlineDeliveryAvailable ? "Send enquiry →" : "Choose how to send →"}</button></fieldset>
      {status === "prepared" && <div className="star-form-alert" role="status" tabIndex={-1} ref={result}><strong>Your enquiry is ready to send.</strong><p>Choose email or WhatsApp below. Your app will open with the details you entered; press send there to contact STAR. Nothing has been sent automatically.</p><div className="star-send-alternatives"><a href={mail}>Open email with my enquiry ↗</a><a href={whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp with my enquiry ↗</a></div></div>}
      {status === "unconfirmed" && <div className="star-form-alert" role="alert" tabIndex={-1} ref={result}><strong>We couldn’t confirm receipt.</strong><p>Please contact STAR directly. Your details are still here, and you can open them in email or WhatsApp below.</p><div className="star-send-alternatives"><a href={mail}>Open email ↗</a><a href={whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp ↗</a></div></div>}
      {status === "error" && <div className="star-form-alert" role="alert" tabIndex={-1} ref={result}><strong>Please check your details.</strong><p>Check your name, email and consent, then try again. You can also contact STAR directly.</p></div>}
    </>}
    </form><aside className="star-enquiry-aside" aria-labelledby="enquiry-next-title"><p className="star-enquiry-eyebrow">A STARTING POINT, CHOSEN TOGETHER</p><h3 id="enquiry-next-title">What happens<br/>next?</h3><ol className="star-enquiry-next"><li><span>01</span><div><strong>We listen.</strong><p>Tell us about the player’s football and what she wants to work on.</p></div></li><li><span>02</span><div><strong>We discuss the options.</strong><p>Talk through suitable coaching, availability and practical arrangements.</p></div></li><li><span>03</span><div><strong>We agree a next step.</strong><p>Choose a starting point together. STAR confirms any session arrangements separately.</p></div></li></ol><p className="star-enquiry-response">{enquiryResponseTime}</p><div className="star-aside-contact"><a href="https://wa.me/447902594064" target="_blank" rel="noopener noreferrer">WHATSAPP STAR <strong>07902 594064 ↗</strong></a><a href="tel:+447902594064">CALL STAR <strong>07902 594064 ↗</strong></a><a href="mailto:coachdmp7@gmail.com">EMAIL STAR <strong>coachdmp7@gmail.com ↗</strong></a></div><p>STAR provides independent coaching alongside the player’s club football.</p></aside>
  </div>;
}
