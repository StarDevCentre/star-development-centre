"use client";

import {useEffect, useRef, useState} from "react";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";
import {ukDateTime, ukDateTimeInput} from "../lib/sessionOperations";
import type {FamilySession} from "../lib/parentDashboard";
import "./portal-operations.css";

export function useMovableBookings(playerId: string, active: boolean, revision: unknown) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds([]);
    if (!db || !active || !playerId) return;
    let alive = true;
    void db.rpc("star_movable_player_bookings", {p_player: playerId}).then(({data, error}) => {
      if (alive && !error) setIds(data ?? []);
    });
    return () => { alive = false; };
  }, [playerId, active, revision]);
  return ids;
}

export function MoveFamilySession({session, onClose, onMoved}: {
  session: FamilySession;
  onClose: () => void;
  onMoved: (startsAt: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [day, setDay] = useState(ukDateTimeInput(session.starts_at).slice(0, 10));
  const [slots, setSlots] = useState<{starts_at: string}[]>([]);
  const [start, setStart] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {dialog.current?.showModal();}, []);
  useEffect(() => {
    setSlots([]);
    setStart("");
    if (!db || !day) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    void db.rpc("star_player_move_slots", {p_booking: session.id, p_day: day}).then(({data, error}) => {
      if (!alive) return;
      if (error) setError(error.message);
      else setSlots(data ?? []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [session.id, day, retry]);

  async function move(event: React.FormEvent) {
    event.preventDefault();
    if (!db || busy || !start) return;
    setBusy(true);
    setError("");
    try {
      const {data, error} = await db.rpc("star_move_player_booking", {
        p_booking: session.id, p_expected_start: session.starts_at, p_new_start: start,
      });
      if (error) {
        setError(error.message);
        setRetry(value => value + 1);
      } else if (typeof data === "string") {
        onMoved(data);
      } else {
        setError("The move could not be confirmed. Refresh your sessions before trying again.");
      }
    } catch {
      setError("The connection dropped. You can retry this move or refresh your sessions.");
    } finally {
      setBusy(false);
    }
  }

  return <dialog ref={dialog} className="star-operations-dialog" aria-labelledby="star-move-booking-title"
    onCancel={event => {event.preventDefault(); if (!busy) onClose();}}>
    <header className="star-operations-header">
      <h2 id="star-move-booking-title">Move session</h2>
      <button className="star-operations-secondary" type="button" disabled={busy} onClick={onClose}>Close</button>
    </header>
    <p><strong>Current booking</strong><br/>{ukDateTime(session.starts_at)} · {session.venue}</p>
    <form className="star-operations-form" onSubmit={move}>
      <label>New date (UK time)
        <input type="date" required value={day} min={ukDateTimeInput(new Date().toISOString()).slice(0, 10)}
          disabled={busy} onChange={event => {setError(""); setDay(event.target.value);}}/>
      </label>
      <label>Available start time
        <select required value={start} disabled={busy || loading || !slots.length} onChange={event => setStart(event.target.value)}>
          <option value="">{loading ? "Checking availability…" : slots.length ? "Choose a time" : "No times available on this date"}</option>
          {slots.map(option => <option key={option.starts_at} value={option.starts_at}>{ukDateTime(option.starts_at)}</option>)}
        </select>
      </label>
      {error && <p role="alert" className="star-operations-error">{error}</p>}
      <div className="star-operations-actions"><button type="submit" disabled={busy || loading || !start}>{busy ? "Moving…" : "Confirm new time"}</button></div>
    </form>
  </dialog>;
}

export function OpenFamilyVenue({session, onClose}: {session: FamilySession; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
    let alive = true;
    if (db && session.venue_version) {
      const booking = session.id;
      const version = session.venue_version;
      void db.rpc("star_open_player_venue", {p_booking: booking, p_version: version}).then(result => {
        if (alive && result.error) setError("STAR could not record that you opened these directions. Refresh your sessions if the venue changed.");
      });
    }
    return () => { alive = false; };
  }, [session.id, session.venue_version]);
  return <dialog ref={dialog} className="star-operations-dialog" onCancel={event => {event.preventDefault(); onClose();}}
    aria-labelledby="star-venue-title">
    <header className="star-operations-header">
      <h2 id="star-venue-title">Session venue</h2>
      <button type="button" className="star-operations-secondary" onClick={onClose}>Close</button>
    </header>
    <p>{session.title} · {ukDateTime(session.starts_at)}</p>
    <p className="star-operations-venue">{session.venue}</p>
    {error && <p role="status">{error}</p>}
    <a target="_blank" rel="noopener noreferrer" href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(session.venue)}>Open directions ↗</a>
  </dialog>;
}

export function StaffVenueOpenings({sessionId, revision}: {sessionId: string; revision: string}) {
  const [rows, setRows] = useState<{family_session_id: string; guardian_name: string; opened_at: string | null}[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!db) return;
    let alive = true;
    setStatus("loading");
    void db.rpc("star_session_venue_openings", {p_session: sessionId}).then(({data, error}) => {
      if (!alive) return;
      if (error) setStatus("error");
      else {setRows(data ?? []);setStatus("ready");}
    });
    return () => { alive = false; };
  }, [sessionId, revision, retry]);
  return <details className="star-hub-panel">
    <summary>Who has opened the venue?</summary>
    {status === "loading" ? <p role="status">Checking venue opens…</p> :
      status === "error" ? <p role="alert">Could not load venue opens.</p> :
      rows.length ? <ul>{rows.map((row, index) => <li key={row.family_session_id+":"+index}>
        <strong>{row.guardian_name}</strong> · {row.opened_at ? ukDateTime(row.opened_at) : "Awaiting venue open"}
      </li>)}</ul> : <p>No linked guardians have this booking.</p>}
    <button type="button" onClick={() => setRetry(value => value + 1)}>Refresh</button>
  </details>;
}
