"use client";

import Image from "next/image";
import { achievementDate, badgeById, type PlayerAchievement } from "../lib/achievementBadges";

export function TrophyCabinet({ awards, playerName }: { awards: PlayerAchievement[]; playerName?: string }) {
  const badges = awards.filter(award => award.badge_id && badgeById.has(award.badge_id));
  const unique = new Set(badges.map(award => award.badge_id)).size;

  return <section className="star-trophy-cabinet" aria-label="Trophy cabinet">
    <div className="star-trophy-heading">
      <div><span className="star-trophy-kicker">STAR / YOUR ACHIEVEMENTS</span><h3>Trophy cabinet</h3><p>{playerName ? `${playerName}’s hard work, celebrated.` : "Your hard work, celebrated."}</p></div>
      <div className="star-trophy-total"><strong>{badges.length}</strong><span>{badges.length === 1 ? "badge awarded" : "badges awarded"}</span><small>{unique} different {unique === 1 ? "badge" : "badges"}</small></div>
    </div>
    {awards.length ? <div className="star-trophy-shelves">{awards.map(award => {
      const badge = award.badge_id ? badgeById.get(award.badge_id) : undefined;
      return <article key={award.id} className="star-trophy-card">
        <div className="star-trophy-art">{badge ? <Image src={badge.image} alt={`${badge.title} — ${badge.collection} badge`} width={200} height={200} sizes="(max-width: 600px) 140px, 200px" /> : <span className="star-trophy-medal" role="img" aria-label="Achievement medal">🏅</span>}</div>
        <div className="star-trophy-card-copy"><span className="star-trophy-collection">{badge?.collection || "Coach recognition"}</span><h4>{award.title}</h4><time dateTime={award.awarded_on}>{achievementDate(award.awarded_on)}</time><p>{award.description}</p></div>
      </article>;
    })}</div> : <div className="star-trophy-empty"><span aria-hidden="true">☆</span><h4>Your story starts here</h4><p>As your coach awards badges, they’ll take pride of place in your trophy cabinet. Keep learning, keep playing, keep being you.</p></div>}
  </section>;
}
