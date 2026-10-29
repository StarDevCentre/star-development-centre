"use client";

import {useRef, useState, type FormEvent} from "react";

export default function StaplegrovePathway() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const sending = useRef(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [emailDraft, setEmailDraft] = useState("");

  function open() {
    setStatus("idle");
    setMessage("");
    setEmailDraft("");
    dialog.current?.showModal();
  }
  function close() {
    if (sending.current) return;
    dialog.current?.close();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const data = new FormData(event.currentTarget);
    const details = {name: String(data.get("name") || "").trim(), age: String(data.get("age") || ""), email: String(data.get("email") || "").trim(), phone: String(data.get("phone") || "").trim(), consent: data.get("consent") === "on", website: String(data.get("website") || "")};
    const text = `I would like to refer myself to Staplegrove Ladies FC.\n\nName: ${details.name}\nAge: ${details.age}\nEmail: ${details.email}\nPhone: ${details.phone}\n\nI agree to the club using these details to contact me about this enquiry.`;
    setEmailDraft(`mailto:staplegroveladiesfootballclub@gmail.com?subject=${encodeURIComponent("Staplegrove Ladies FC self-referral")}&body=${encodeURIComponent(text)}`);
    sending.current = true;
    setStatus("sending");
    try {
      const response = await fetch("/api/staplegrove-referral", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(details), signal: AbortSignal.timeout(20000)});
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Your referral could not be sent. Please try again or email the club.");
      setStatus("sent");
    } catch (error) {
      setMessage(error instanceof Error && error.name === "Error" ? error.message : "Delivery could not be confirmed. Please email the club, or try again later.");
      setStatus("error");
    } finally {
      sending.current = false;
    }
  }

  return <section className="staplegrove-pathway pathways-section" id="staplegrove-ladies" aria-labelledby="staplegrove-title">
    <div className="home-width">
      <div className="staplegrove-card">
        <div className="staplegrove-brand"><img src="/images/staplegrove-crest.svg" alt="Staplegrove Football Club crest" width="124" height="124" loading="lazy"/><span>STAPLEGROVE<br/><strong>FOOTBALL CLUB</strong></span><span className="staplegrove-age">ENQUIRIES<br/><strong>15+</strong></span></div>
        <div className="staplegrove-card-content"><div><p className="staplegrove-eyebrow">A LOCAL ROUTE INTO WOMEN’S FOOTBALL</p><h2 id="staplegrove-title">Women’s football.<br/><span>Staplegrove Ladies FC.</span></h2><p>Thinking about women’s football in Taunton? Whether you are planning the move from youth football, returning to the game or looking for a new team, introduce yourself to Staplegrove Ladies.</p><p className="staplegrove-eligibility">Players aged 15 and over can enquire. Open-age matches are for players aged 16 and over; the club will discuss suitable next steps and confirm eligibility and availability.</p></div><div className="staplegrove-card-action"><span>LET’S START WITH A CONVERSATION</span><p>Share your name, age and contact details. Your referral goes to the club so the team can get in touch.</p><button ref={trigger} type="button" onClick={open} aria-haspopup="dialog">Refer myself to the club <span aria-hidden="true">↗</span></button><small>You do not need to be a STAR player.</small></div></div>
      </div>
    </div>
    <dialog ref={dialog} className="staplegrove-dialog" aria-labelledby="staplegrove-referral-title" aria-describedby="staplegrove-referral-description" onCancel={event=>{if(sending.current)event.preventDefault();}} onClose={()=>trigger.current?.focus({preventScroll:true})}>
      <div className="staplegrove-dialog-header"><span>STAPLEGROVE LADIES FC</span><button type="button" onClick={close} disabled={status==="sending"} aria-label="Close referral form">×</button></div>
      {status === "sent" ? <div className="staplegrove-success" role="status"><h2 id="staplegrove-referral-title">Your referral is on its way.</h2><p id="staplegrove-referral-description">Your details have been submitted to Staplegrove Ladies FC. The club can contact you using the email address or phone number you provided.</p><button type="button" className="staplegrove-submit" onClick={close}>Done</button></div> : <form onSubmit={submit}>
        <h2 id="staplegrove-referral-title">Introduce yourself.</h2><p id="staplegrove-referral-description">For players aged 15+. Complete these four details to contact Staplegrove Ladies FC.</p>
        <fieldset disabled={status==="sending"}><legend className="pathways-sr-only">Your referral details</legend>
          <label htmlFor="sg-name">Your name<input id="sg-name" name="name" autoComplete="name" minLength={2} maxLength={100} required/></label>
          <label htmlFor="sg-age">Your age<input id="sg-age" name="age" type="number" inputMode="numeric" min={15} max={100} step={1} required/></label>
          <label htmlFor="sg-email">Email address<input id="sg-email" name="email" type="email" autoComplete="email" maxLength={200} required/></label>
          <label htmlFor="sg-phone">Phone number<input id="sg-phone" name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={40} required/></label>
          <div className="staplegrove-honeypot" aria-hidden="true"><label>Leave this empty<input name="website" autoComplete="off" tabIndex={-1}/></label></div>
          <p className="staplegrove-data-note">STAR will pass these details to <strong>staplegroveladiesfootballclub@gmail.com</strong> through its email provider, Resend, solely for this referral. This form does not create an account or subscribe you to marketing. If you are under 18, please discuss your enquiry with a parent or guardian.</p>
          <label className="staplegrove-consent"><input type="checkbox" name="consent" required/><span>I agree to share these details with Staplegrove Ladies FC and for the club to contact me about my enquiry.</span></label>
          <button className="staplegrove-submit" type="submit">{status==="sending" ? "Sending referral…" : "Send my referral →"}</button>
        </fieldset>
        {status === "error" && <div className="staplegrove-error" role="alert"><p>{message}</p><a href={emailDraft}>Open a referral email instead ↗</a><small>This opens your email app with your details filled in. You must send the email yourself.</small></div>}
        <p className="staplegrove-form-footer"><a href="/privacy">Privacy information</a> · This is an enquiry, not confirmation of a playing place.</p>
      </form>}
    </dialog>
  </section>;
}
