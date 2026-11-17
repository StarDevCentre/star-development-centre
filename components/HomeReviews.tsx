"use client";

import {useEffect, useRef, useState} from "react";
import Image from "next/image";

const themes = [
  "Coaching built around her",
  "Learning through Player Space",
  "A comfortable place to develop",
  "Technical work that makes a difference",
  "A clearer picture on the ball",
  "Confidence to speak up",
  "Enjoying every session",
  "Calmer decisions. Clear progress.",
  "Support for her club football",
  "Small adjustments. A big difference.",
  "Support beyond the session",
  "First touch and growing confidence",
  "Growing at her own pace",
  "Learning she wants to come back to"
];

const reviews: {name: string; quote: string; role?: string}[] = [
  {
    name: "Lisa & Craig",
    quote: "Really pleased with how the sessions have been going. It's nice to have someone actually look at what she needs to work on rather than just doing the same drills every week. She really enjoys going too, which is the main thing for us."
  },
  {
    name: "Mia, 13",
    role: "Player",
    quote: "The sessions are good and I really like the player space as there is games but you are still learning"
  },
  {
    name: "Eloise",
    quote: "My girl is autistic and we were nervous about starting something new. They were really good about it — asked what helps her and just got on with it without making a big deal. She’s settled in well and is actually looking forward to the sessions. That’s a big win!"
  },
  {
    name: "Kenneth",
    quote: "My daughter is 15 and was already in the county pathway but felt she needed more detailed technical work. STAR filled that gap properly. The coach identified the small things holding her back and worked on them consistently. She’s now progressed into a regional talent group."
  },
  {
    name: "Leah, 11",
    role: "Player",
    quote: "I used to take ages on the ball and lose it a lot. We’ve been working on scanning and receiving properly and it’s starting to click. Still mess up sometimes but less than before. Like that I can ask questions without everyone watching."
  },
  {
    name: "James & Harper",
    quote: "Honestly the best thing has been how they treat her as an individual. She’s not the loudest kid and sometimes gets a bit lost in big groups. Here she gets proper attention and it’s helped her confidence loads. She’s even started speaking up more at club."
  },
  {
    name: "Lucy",
    quote: "Couldn't be happier with STAR!"
  },
  {
    name: "Bryan",
    quote: "Honestly didn’t know what to expect but it’s been solid. The one-to-one time has helped her a lot with decision making. She used to panic on the ball a bit and now she’s calmer. Progress reports are useful too so we know what she’s working on. Happy with it so far."
  },
  {
    name: "Rosie, 15",
    role: "Player",
    quote: "Sessions are solid and it definitely helps me with my club football."
  },
  {
    name: "Roberta",
    quote: "My daughter is sensitive to certain fabrics and noisy group settings. STAR were practical about it — let her wear her preferred base layer and kept the sessions focused rather than chaotic. She’s more comfortable and actually looking forward to going."
  },
  {
    name: "Luke",
    quote: "She’s been with STAR for about six months. The one-to-one sessions have helped her confidence massively, and she actually looks forward to logging into Player Space to see what she’s working on next. It’s a small thing but it keeps her engaged between sessions. Progress has been gradual but consistent, which is what we wanted."
  },
  {
    name: "Luca & Matilda",
    quote: "We tried a couple of other places and they just felt a bit generic. STAR’s different. He really watches her and then works on the bits that are holding her back. Her first touch is so much better and she’s more confident in games. Worth the drive for us."
  },
  {
    name: "Ella",
    quote: "My daughter is autistic and can find new environments tricky. STAR handled it really well. They checked what helps her and stuck to it. She’s built confidence gradually without being pushed too hard."
  },
  {
    name: "Anonymous",
    quote: "Player Space is a hit with her — she actually opens it without being asked. Coaching has helped her first touch and she’s less hesitant in games. Solid all round."
  }
];

export function HomeReviews() {
  const sectionRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{x: number; y: number} | null>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const review = reviews[active];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      if (media.matches) setPlaying(false);
    };
    media.addEventListener("change", syncMotionPreference);
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {threshold: 0.5}
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      media.removeEventListener("change", syncMotionPreference);
      observer.disconnect();
    };
  }, []);

  function goTo(index: number) {
    setActive((index + reviews.length) % reviews.length);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || !inView || hovered || focused) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % reviews.length), 10000);
    return () => window.clearInterval(timer);
  }, [playing, inView, hovered, focused]);

  return (
    <section ref={sectionRef} id="home-reviews" className="home-reviews" aria-labelledby="home-reviews-title">
      <div className="home-width">
        <div className="home-reviews-heading">
          <div>
            <p className="home-eyebrow">FAMILIES & PLAYERS / THE STAR EXPERIENCE</p>
            <h2 id="home-reviews-title">Their <span>words.</span></h2>
          </div>
          <span className="home-reviews-seal" aria-hidden="true">✦</span>
        </div>
        <div className="home-reviews-stage">
          <div
            className="home-reviews-track"
            role="region"
            aria-roledescription="carousel"
            aria-label="STAR family and player reviews. Swipe horizontally or use the previous and next review buttons."
            tabIndex={0}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onTouchStart={event => {
              const touch = event.touches[0];
              touchStart.current = {x: touch.clientX, y: touch.clientY};
              setPlaying(false);
            }}
            onTouchCancel={() => {touchStart.current = null;}}
            onTouchEnd={event => {
              const start = touchStart.current;
              touchStart.current = null;
              const touch = event.changedTouches[0];
              if (!start || !touch) return;
              const dx = touch.clientX - start.x;
              const dy = touch.clientY - start.y;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                goTo(active + (dx < 0 ? 1 : -1));
              }
            }}
            onKeyDown={event => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                goTo(active + (event.key === "ArrowRight" ? 1 : -1));
              }
              if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                goTo(event.key === "Home" ? 0 : reviews.length - 1);
              }
            }}
          >
            <figure key={review.name} className="home-review-card" aria-label={`Review ${active + 1} of ${reviews.length}`} aria-roledescription="slide">
              <p className="home-review-topic">{themes[active]}</p>
              <span className="home-review-quotation" aria-hidden="true">“</span>
              <blockquote>{review.quote}</blockquote>
              <figcaption>
                <span aria-hidden="true" className="home-review-avatar">{review.name === "Anonymous" ? "S" : review.name.split(" & ").map(name => name[0]).join("")}</span>
                <span><strong>{review.name}</strong><small>{review.role ?? "Parent / carer"}</small></span>
                <Image className="home-review-signature" src="/images/star-colour-transparent.webp" alt="STAR Development Centre" width={152} height={76} sizes="76px" loading="lazy"/>
              </figcaption>
            </figure>
          </div>
          <div className="home-reviews-footer">
            <span className="home-reviews-counter" aria-live={playing ? "off" : "polite"} aria-atomic="true" aria-label={`Review ${active + 1} of ${reviews.length}`}><strong>{String(active + 1).padStart(2, "0")}</strong><span> / {String(reviews.length).padStart(2, "0")}</span></span>
            <span className="home-reviews-hint" aria-hidden="true">SWIPE TO EXPLORE</span>
            <div className="home-reviews-controls" aria-label="Review carousel controls">
              <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous review"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg></button>
              <button className="home-reviews-play" type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? "Pause automatic reviews" : "Play automatic reviews"} aria-pressed={playing}><svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">{playing ? <path d="M3 2h4v12H3zm6 0h4v12H9z"/> : <path d="M4 2v12l10-6z"/>}</svg></button>
              <button type="button" onClick={() => goTo(active + 1)} aria-label="Next review"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9.5 5 7 7-7 7"/></svg></button>
            </div>
          </div>
          <div className="home-reviews-progress" aria-hidden="true"><span style={{width: `${((active + 1) / reviews.length) * 100}%`}}/></div>
        </div>
      </div>
    </section>
  );
}
