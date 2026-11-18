"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";
import type {PortalMessage} from "../lib/playerPortalFeatures";
import type {FamilySession} from "../lib/parentDashboard";
import {ukDateTime} from "../lib/sessionOperations";
import {MoveFamilySession, useMovableBookings} from "./FamilySessionActions";
import {SparksWeeklyPlace} from "./SparksWeeklyPlace";
import "./portal-operations.css";

export type FamilyChatActions = {
  onBookPlayer?: (id: string) => void;
  onFeedback?: (id: string) => void;
  onPractice?: (id: string) => void;
};
type Player = {id: string; first_name: string; last_name: string};
const from = {coach: "STAR coach", guardian: "Parent or guardian", player: "Player"};

export function SharedFamilyInbox({userId, role, active, initialPlayerId, onBookPlayer, onFeedback, onPractice}: {
  userId: string; role: "staff" | "guardian"; active: boolean; initialPlayerId?: string;
} & FamilyChatActions) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState(initialPlayerId ?? "");
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [sessions, setSessions] = useState<FamilySession[]>([]);
  const [moving, setMoving] = useState<FamilySession>();
  const [actionStatus, setActionStatus] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const sequence = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  const sentId = useRef<string>("");
  const available = useMovableBookings(playerId, active && role === "staff" && showBookings, sessions);
  const player = players.find(candidate => candidate.id === playerId);
  const thread = messages.filter(message => message.player_id === playerId);
  const lastId = thread.at(-1)?.id;

  useEffect(() => {
    if (!active || !db) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      const query = db!.from("guardian_player_links").select("player_id");
      if (role === "guardian") query.eq("guardian_id", userId);
      const links = await query.limit(1000);
      if (!alive) return;
      if (links.error) {
        setError("Family conversations could not be opened.");
        setLoading(false);
        return;
      }
      const ids = [...new Set((links.data ?? []).map(link => link.player_id as string))];
      if (role === "staff" && initialPlayerId && !ids.includes(initialPlayerId)) ids.push(initialPlayerId);
      const result = ids.length ? await db!.from("coaching_players").select("id,first_name,last_name").in("id", ids)
        .order("first_name").order("last_name") : {data: [], error: null};
      if (!alive) return;
      if (result.error) setError("Player names could not be loaded.");
      else {
        setPlayers(result.data ?? []);
        setPlayerId(current => {
          const list = result.data ?? [];
          if (list.some(candidate => candidate.id === initialPlayerId)) return initialPlayerId!;
          if (list.some(candidate => candidate.id === current)) return current;
          return role === "guardian" ? list[0]?.id ?? "" : "";
        });
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [active, initialPlayerId, role, userId]);

  const refresh = useCallback(async () => {
    if (!db || !active || !playerId) return;
    const request = ++sequence.current;
    const {data, error} = await db.from("player_space_messages").select("id,player_id,sender_id,sender_role,body,created_at")
      .eq("player_id", playerId).order("created_at", {ascending: false}).order("id", {ascending: false}).limit(100);
    if (sequence.current !== request) return;
    if (error) setError("Messages could not be loaded. Try refreshing.");
    else setMessages((data ?? []).reverse() as PortalMessage[]);
  }, [active, playerId]);

  const loadBookings = useCallback(async () => {
    if (!db || !playerId || !active || !showBookings) return;
    const {data, error} = await db.from("family_session_schedule").select("id,player_id,title,starts_at,ends_at,venue")
      .eq("player_id", playerId).gt("starts_at", new Date().toISOString()).order("starts_at");
    if (error) setActionStatus("Could not load upcoming bookings.");
    else setSessions(data ?? []);
  }, [active, playerId, showBookings]);

  useEffect(() => {
    if (!active) return;
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      ++sequence.current;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [active, refresh]);

  useEffect(() => {void loadBookings();}, [loadBookings]);

  useEffect(() => {
    if (!active || !db || !lastId) return;
    const loadedIds = messages.filter(message => message.player_id === playerId && message.sender_id !== userId).map(message => message.id);
    if (!loadedIds.length) return;
    void db.rpc("star_mark_shared_chat_read", {p_player: playerId, p_messages: loadedIds}).then(({data, error}) => {
      if (!error && data) window.dispatchEvent(new Event("star:family-messages-updated"));
    });
  }, [active, messages, lastId, playerId, userId]);

  useEffect(() => {
    if (active && lastId) {
      const container = bottom.current?.parentElement;
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [active, lastId]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = drafts[playerId]?.trim();
    if (!db || !player || !body || sending) return;
    setSending(true);
    setError("");
    const messageId = sentId.current || (sentId.current = crypto.randomUUID());
    try {
      const {error} = await db.from("player_space_messages").insert({
        id: messageId, player_id: playerId, sender_id: userId, sender_role: role === "staff" ? "coach" : "guardian", body,
      });
      if (error) {
        const saved = error.code === "23505" && (await db.from("player_space_messages").select("id")
          .eq("id", messageId).eq("player_id", playerId).eq("sender_id", userId).eq("body", body).maybeSingle()).data?.id;
        if (!saved) throw new Error(error.message);
      }
      sentId.current = "";
      setDrafts(current => ({...current, [playerId]: ""}));
      await refresh();
      window.dispatchEvent(new Event("star:family-messages-updated"));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Message could not be sent. Your draft is still here.");
    } finally {
      setSending(false);
    }
  }

  return <section className="star-family-comms star-shared-chat" aria-label="Family conversation">
    <h3>{role === "staff" ? "Family inbox" : "Messages with STAR"}</h3>
    <p>Messages here are visible to the player, her linked guardians and her STAR coaches.</p>
    {loading ? <p role="status">Loading conversations…</p> :
      players.length ? <label>Player
        <select value={playerId} disabled={sending} onChange={event => {
          setPlayerId(event.target.value); setError(""); setShowBookings(false); setMoving(undefined); setActionStatus(""); sentId.current = "";
        }}>
          <option value="">Choose a player</option>
          {players.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.first_name} {candidate.last_name}</option>)}
        </select>
      </label> : <p>There are no linked family conversations yet.</p>}
    {error && <p className="star-operations-error" role="alert">{error}</p>}
    {player && <>
      {role === "staff" && <div className="star-session-actions">
        {onBookPlayer && <button type="button" onClick={() => onBookPlayer(player.id)}>Book session</button>}
        <button type="button" aria-expanded={showBookings} onClick={() => setShowBookings(value => !value)}>Move session</button>
        {onFeedback && <button type="button" onClick={() => onFeedback(player.id)}>Share coaching feedback</button>}
        {onPractice && <button type="button" onClick={() => onPractice(player.id)}>Assign home practice</button>}
      </div>}
      {actionStatus && <p role="status">{actionStatus}</p>}
      {showBookings && <div className="star-hub-panel">
        <SparksWeeklyPlace key={playerId} playerId={playerId} revision={0} onUpdated={()=>{void loadBookings();window.dispatchEvent(new Event("star:staff-refresh"));}}/>
        <strong>Upcoming one-to-one bookings</strong>
        {sessions.filter(session => session.player_id === playerId && available.includes(session.id)).map(session => <p key={session.id}>
          {ukDateTime(session.starts_at)} · {session.venue} <button type="button" onClick={() => setMoving(session)}>Choose a new time</button>
        </p>)}
        {!sessions.some(session => session.player_id === playerId && available.includes(session.id)) && <p>No individual booking can be moved here.</p>}
      </div>}
      <div className="star-family-thread" aria-label="Recent messages" tabIndex={0}>
        {thread.length ? thread.map(message => <article key={message.id} className="star-family-message" data-own={message.sender_id === userId}>
          <div><strong>{message.sender_id === userId ? "You" : from[message.sender_role]}</strong><small>{ukDateTime(message.created_at)}</small></div>
          <p>{message.body}</p>
        </article>) : <p>No shared messages yet.</p>}
        <div ref={bottom}/>
      </div>
      <form className="star-family-message-form" onSubmit={send}>
        <label>Message <textarea required maxLength={2000} rows={3} value={drafts[playerId] ?? ""} disabled={sending}
          onChange={event => {sentId.current = ""; setDrafts(current => ({...current, [playerId]: event.target.value}));}}/></label>
        <div className="star-session-actions">
          <button type="submit" disabled={sending || !drafts[playerId]?.trim()}>{sending ? "Sending…" : "Send message"}</button>
          <button type="button" onClick={() => void refresh()}>Refresh messages</button>
        </div>
      </form>
      {moving&&<MoveFamilySession session={moving} onClose={()=>setMoving(undefined)} onMoved={start=>{
        setMoving(undefined);
        setActionStatus("Session moved to "+ukDateTime(start)+".");
        void loadBookings();
        window.dispatchEvent(new Event("star:staff-refresh"));
      }}/>}
    </>}
  </section>;
}
