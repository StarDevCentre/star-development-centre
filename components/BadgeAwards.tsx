"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { achievementBadges, badgeById, todayInLondon, type PlayerAchievement } from "../lib/achievementBadges";
import { supabaseBrowser as db } from "../lib/supabaseBrowser";
import { TrophyCabinet } from "./TrophyCabinet";

type Player = { id: string; first_name: string; last_name: string };
const collections = [...new Set(achievementBadges.map(badge => badge.collection))];

export function BadgeAwards({ userId, initialPlayerId = "" }: { userId: string; initialPlayerId?: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState(initialPlayerId);
  const [awards, setAwards] = useState<PlayerAchievement[]>([]);
  const [badgeId, setBadgeId] = useState("");
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("");
  const [description, setDescription] = useState("");
  const [awardedOn, setAwardedOn] = useState(todayInLondon);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [awardsLoading, setAwardsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    if (!db) { setLoading(false); return; }
    void (async () => {
      try {
        const result = await db.from("coaching_players").select("id,first_name,last_name").order("first_name").limit(1000);
        if (!active) return;
        if (result.error) throw result.error;
        setPlayers(result.data || []);
      } catch { if (active) setError("Could not load your player roster. Please refresh and try again."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    let active = true;
    setAwards([]);
    if (!db || !playerId) { setAwardsLoading(false); return; }
    setAwardsLoading(true);
    void (async () => {
      try {
        const result = await db.from("player_achievements").select("id,player_id,title,description,awarded_on,badge_id").eq("player_id", playerId).order("awarded_on", { ascending: false }).order("created_at", { ascending: false });
        if (!active) return;
        if (result.error) throw result.error;
        setAwards(result.data || []);
      } catch { if (active) setError("Could not load this player’s achievements. Please try again."); }
      finally { if (active) setAwardsLoading(false); }
    })();
    return () => { active = false; };
  }, [playerId, revision, userId]);

  const badge = badgeById.get(badgeId);
  const player = players.find(value => value.id === playerId);
  const filtered = achievementBadges.filter(value => (!collection || value.collection === collection) && value.title.toLowerCase().includes(query.trim().toLowerCase()));

  async function awardBadge(event: React.FormEvent) {
    event.preventDefault();
    if (!db || !player || !badge || saving.current || !description.trim()) return;
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await db.from("player_achievements").insert({ player_id: player.id, badge_id: badge.id, title: badge.title, description: description.trim(), awarded_on: awardedOn, awarded_by: userId });
      if (result.error) {
        setError(result.error.code === "23505" ? "This badge has already been awarded to this player on that date. Choose another date for a new achievement." : "The badge could not be awarded. Check your player access and try again.");
        return;
      }
      setNotice(`${badge.title} awarded to ${player.first_name}. It is now in their trophy cabinet.`);
      setDescription(""); setBadgeId(""); setRevision(value => value + 1);
    } catch { setError("The badge could not be awarded. Please try again."); }
    finally { saving.current = false; setBusy(false); }
  }

  if (!db) return <p>Badge awards are temporarily unavailable.</p>;
  return <section className="star-badge-workspace">
    <div><span className="kicker">STAR / COACH RECOGNITION</span><h3>Award achievement badges</h3><p>Choose a player, pick one of STAR’s {achievementBadges.length} badges, and tell them what made you proud.</p></div>
    {error && <p className="star-portal-error" role="alert">{error}</p>}{notice && <p className="star-portal-notice" role="status">{notice}</p>}
    {loading ? <p role="status">Loading your players…</p> : !players.length ? <p>No players are assigned to you yet. An owner or manager can update your coaching assignments.</p> : <>
      <label>Player<select value={playerId} disabled={busy} onChange={event => { setPlayerId(event.target.value); setError(""); setNotice(""); setDescription(""); }}><option value="">Select a player</option>{players.map(value => <option key={value.id} value={value.id}>{value.first_name} {value.last_name}</option>)}</select></label>
      {player && <form onSubmit={awardBadge}>
        <fieldset disabled={busy} className="star-badge-fieldset"><legend>Choose an achievement badge</legend>
          <div className="star-badge-filters"><label>Find a badge<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search badge names" maxLength={100}/></label><label>Collection / tier<select value={collection} onChange={event => setCollection(event.target.value)}><option value="">All badges</option>{collections.map(value => <option key={value}>{value}</option>)}</select></label></div>
          <p className="star-badge-results" aria-live="polite">{filtered.length} {filtered.length === 1 ? "badge" : "badges"} shown{badge ? ` · Selected: ${badge.title} (${badge.collection})` : ""}</p>
          <div className="star-badge-picker" role="group" aria-label="Achievement badges">{filtered.map(value => <button key={value.id} type="button" className="star-badge-option" aria-pressed={value.id === badgeId} onClick={() => setBadgeId(value.id)}><Image src={value.image} alt="" width={128} height={128} sizes="128px"/><strong>{value.title}</strong><small>{value.collection}</small>{value.id === badgeId && <span>✓ Selected</span>}</button>)}{!filtered.length && <p>No badges match. Try a different name or collection.</p>}</div>
          {badge && <div className="star-badge-selection"><Image src={badge.image} alt={`${badge.title} badge`} width={96} height={96}/><div><strong>{badge.title}</strong><p>{badge.collection} · For {player.first_name} {player.last_name}</p></div></div>}
          <label>Why are you awarding this badge?<textarea required minLength={1} maxLength={1000} rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder="Describe the effort, progress or achievement you noticed."/></label>
          <label>Award date<input type="date" required max={todayInLondon()} value={awardedOn} onChange={event => setAwardedOn(event.target.value)}/></label>
          <button className="star-badge-submit" type="submit" disabled={!badge || !description.trim() || busy}>{busy ? "Awarding badge…" : "Award badge"}</button>
        </fieldset>
      </form>}
      {player && (awardsLoading ? <p role="status">Loading trophy cabinet…</p> : <TrophyCabinet awards={awards} playerName={player.first_name}/>)}
    </>}
  </section>;
}
