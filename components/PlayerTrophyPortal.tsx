"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { supabaseBrowser as db } from "../lib/supabaseBrowser";
import type { PlayerAchievement } from "../lib/achievementBadges";
import { TrophyCabinet } from "./TrophyCabinet";

type Player = { id: string; first_name: string; last_name: string; programme: string };

export function PlayerTrophyPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [awards, setAwards] = useState<PlayerAchievement[]>([]);
  const [playerId, setPlayerId] = useState("");
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!db) { setReady(true); return; }
    let active = true;
    void db.auth.getUser().then(({ data, error }) => { if (active) { setUser(error ? null : data.user); setReady(true); } }).catch(() => { if (active) { setReady(true); setError("Could not check your sign-in. Please try again."); } });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => { if (active) { setUser(session?.user || null); setReady(true); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadedUserId(null); setPlayers([]); setAwards([]); setPlayerId(""); setLoadFailed(false); setError("");
    if (!db || !user) return;
    const currentUserId = user.id;
    void (async () => {
      try {
        const links = await db.from("guardian_player_links").select("player_id").eq("guardian_id", currentUserId);
        if (links.error) throw links.error;
        const ids = (links.data || []).map(link => link.player_id);
        if (!ids.length) { if (active) setLoadedUserId(currentUserId); return; }
        const [playerResult, awardResult] = await Promise.all([
          db.from("coaching_players").select("id,first_name,last_name,programme").in("id", ids).order("first_name"),
          db.from("player_achievements").select("id,player_id,title,description,awarded_on,badge_id").in("player_id", ids).order("awarded_on", { ascending: false }).order("created_at", { ascending: false })
        ]);
        if (playerResult.error || awardResult.error) throw playerResult.error || awardResult.error;
        if (active) { setPlayers(playerResult.data || []); setAwards(awardResult.data || []); setPlayerId(playerResult.data?.[0]?.id || ""); setLoadedUserId(currentUserId); }
      } catch { if (active) { setError("We couldn’t load your trophy cabinet. Please try refreshing."); setLoadFailed(true); setLoadedUserId(currentUserId); } }
    })();
    return () => { active = false; };
  }, [user?.id, revision]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); if (!db || busy) return;
    setBusy(true); setError("");
    try { const result = await db.auth.signInWithPassword({ email: email.trim(), password }); if (result.error) setError("Could not sign in. Check your parent account details and try again."); }
    catch { setError("Sign-in is temporarily unavailable. Please try again."); }
    finally { setPassword(""); setBusy(false); }
  }

  if (!ready) return <p role="status">Checking your account…</p>;
  if (!db) return <p>The Player Portal is temporarily unavailable. Please <Link href="/contact">contact STAR</Link>.</p>;
  const player = players.find(value => value.id === playerId);
  return <div className="star-player-portal">
    {error && <p className="star-portal-error" role="alert">{error}</p>}
    {!user ? <div className="star-portal-main"><span className="kicker">YOUR STAR JOURNEY</span><h2>Open your trophy cabinet</h2><p>Players can explore their achievements with a parent or guardian. Sign in using the parent account already approved by STAR.</p>
      <form className="star-portal-form" onSubmit={signIn}><label>Parent / guardian email<input type="email" required autoComplete="email" maxLength={200} value={email} onChange={event => setEmail(event.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)}/></label><button disabled={busy} type="submit">{busy ? "Signing in…" : "Open trophy cabinet"}</button></form>
      <p><Link href="/parent-portal">Create a parent account or reset your password →</Link></p>
    </div> : <>
      <div className="star-player-toolbar"><div><span className="kicker">STAR / PLAYER SPACE</span><h2>Your development. Your achievements.</h2><p>Viewing through your approved family account.</p></div><div><Link href="/parent-portal">Parent dashboard</Link><button type="button" onClick={() => { setError(""); setRevision(value => value + 1); }}>Refresh</button><button type="button" onClick={async () => { if (!db) return; const { error } = await db.auth.signOut(); if (error) setError("Could not sign out. Please try again."); else { setPlayers([]); setAwards([]); setUser(null); setError(""); } }}>Sign out</button></div></div>
      {loadedUserId !== user.id ? <p role="status">Loading your trophy cabinet…</p> : loadFailed ? <p>Use Refresh above to try loading your achievements again.</p> : !players.length ? <div className="star-portal-main"><h3>Your player link is being prepared</h3><p>STAR needs to approve the link between your parent account and player profile before achievements can be shown.</p><Link href="/parent-portal">Go to the Parent Portal →</Link></div> : <>
        <label className="star-player-select">Player<select value={playerId} onChange={event => setPlayerId(event.target.value)}>{players.map(value => <option key={value.id} value={value.id}>{value.first_name} {value.last_name}</option>)}</select></label>
        {player && <TrophyCabinet key={player.id} awards={awards.filter(award => award.player_id === player.id)} playerName={player.first_name}/>}
      </>}
    </>}
  </div>;
}
