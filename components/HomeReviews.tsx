"use client";

import {useEffect, useRef, useState} from "react";

const reviews = [
  {
    name: "Lisa & Craig",
    quote: "Really pleased with how the sessions have been going. It's nice to have someone actually look at what she needs to work on rather than just doing the same drills every week. She really enjoys going too, which is the main thing for us."
  },
  {
    name: "Luca & Matilda",
    quote: "We tried a couple of other places and they just felt a bit generic. STAR’s different. He really watches her and then works on the bits that are holding her back. Her first touch is so much better and she’s more confident in games. Worth the drive for us."
  },
  {
    name: "Bryan",
    quote: "Honestly didn’t know what to expect but it’s been solid. The one-to-one time has helped her a lot with decision making. She used to panic on the ball a bit and now she’s calmer. Progress reports are useful too so we know what she’s working on. Happy with it so far."
  },
  {
    name: "Eloise",
    quote: "My girl is autistic and we were nervous about starting something new. They were really good about it — asked what helps her and just got on with it without making a big deal. She’s settled in well and is actually looking forward to the sessions. That’s a big win!"
  },
  {
    name: "James & Harper",
    quote: "Honestly the best thing has been how they treat her as an individual. She’s not the loudest kid and sometimes gets a bit lost in big groups. Here she gets proper attention and it’s helped her confidence loads. She’s even started speaking up more at club."
  },
  {
    name: "Luke",
    quote: "She’s been with STAR for about six months. The one-to-one sessions have helped her confidence massively, and she actually looks forward to logging into Player Space to see what she’s working on next. It’s a small thing but it keeps her engaged between sessions. Progress has been gradual but consistent, which is what we wanted."
  },
  {
    name: "Anonymous",
    quote: "Player Space is a hit with her — she actually opens it without being asked. Coaching has helped her first touch and she’s less hesitant in games. Solid all round."
  },
  {
    name: "Ella",
    quote: "My daughter is autistic and can find new environments tricky. STAR handled it really well. They checked what helps her and stuck to it. She’s built confidence gradually without being pushed too hard."
  },
  {
    name: "Roberta",
    quote: "My daughter is sensitive to certain fabrics and noisy group settings. STAR were practical about it — let her wear her preferred base layer and kept the sessions focused rather than chaotic. She’s more comfortable and actually looking forward to going."
  }
];

export function HomeReviews() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPlaying(!media.matches);
    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {threshold: 0.15}
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      media.removeEventListener("change", syncMotionPreference);
      observer.disconnect();
    };
  }, []);

  function goTo(index: number, pause = false) {
    const next = (index + reviews.length) % reviews.length;
    const viewport = scrollRef.current;
    const first = viewport?.querySelector<HTMLElement>("[data-review-index='0']");
    const target = viewport?.querySelector<HTMLElement>(`[data-review-index='${next}']`);
    if (viewport && first && target) {
      viewport.scrollTo({
        left: target.offsetLeft - first.offsetLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    }
    setActive(next);
    if (pause) setPlaying(false);
  }

  function syncActive() {
    const viewport = scrollRef.current;
    if (!viewport) return;
    const cards = viewport.querySelectorAll<HTMLElement>("[data-review-index]");
    const first = cards[0];
    if (!first) return;
    const left = viewport.scrollLeft + first.offsetLeft;
    let closest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const delta = Math.abs(card.offsetLeft - left);
      if (delta < distance) {
        distance = delta;
        closest = index;
      }
    });
    setActive(current => current === closest ? current : closest);
  }

  useEffect(() => {
    if (!playing || !inView || hovered || focused) return;
    const timer = window.setInterval(() => goTo(active + 1), 7500);
    return () => window.clearInterval(timer);
  }, [active, playing, inView, hovered, focused]);

  return (
    <section ref={sectionRef} id="home-reviews" className="home-reviews home-section" aria-labelledby="home-reviews-title">
      <div className="home-width">
        <div className="home-reviews-heading">
          <div>
            <p className="home-eyebrow">PARENTS & CARERS / THEIR EXPERIENCE</p>
            <h2 id="home-reviews-title">Her progress.<br/><span>Their words.</span></h2>
          </div>
          <p>Every player has her own journey. Here’s what families have said about their experiences with STAR.</p>
        </div>
        <div className="home-reviews-toolbar">
          <span className="home-reviews-counter" aria-label={`Review ${active + 1} of ${reviews.length}`}>
            <strong>{String(active + 1).padStart(2, "0")}</strong> / {String(reviews.length).padStart(2, "0")}
          </span>
          <div className="home-reviews-controls" aria-label="Review carousel controls">
            <button type="button" onClick={() => goTo(active - 1, true)} aria-label="Previous review">←</button>
            <button type="button" onClick={() => goTo(active + 1, true)} aria-label="Next review">→</button>
            <button className="home-reviews-play" type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? "Pause automatic review scrolling" : "Resume automatic review scrolling"} aria-pressed={!playing}>
              {playing ? "Pause" : "Play"}
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="home-reviews-track"
          role="region"
          aria-roledescription="carousel"
          aria-label="STAR parent reviews. Swipe horizontally or use the previous and next review buttons."
          tabIndex={0}
          onScroll={syncActive}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPointerDown={() => setPlaying(false)}
          onKeyDown={event => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              goTo(active + (event.key === "ArrowRight" ? 1 : -1), true);
            }
          }}
        >
          {reviews.map((review, index) => (
            <figure key={review.name} className="home-review-card" data-review-index={index}>
              <span className="home-review-quotation" aria-hidden="true">“</span>
              <blockquote>{review.quote}</blockquote>
              <figcaption><span aria-hidden="true" className="home-review-line"/><strong>{review.name}</strong></figcaption>
            </figure>
          ))}
        </div>
        <p className="home-reviews-hint">Swipe to explore more experiences <span aria-hidden="true">↔</span></p>
      </div>
    </section>
  );
}
