"use client";

import {useEffect, useRef, useState} from "react";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";
import {ukDateTime, ukDateTimeInput} from "../lib/sessionOperations";
import "./portal-operations.css";

type Player = {id: string; first_name: string; last_name: string};
type Slot = {starts_at: string; ends_at: string};
export type StaffBookingTarget = {playerId?: string; date?: string; programme?: string};
const individualProgrammes = [
  {id: "1-to-1", title: "One to One Coaching", minutes: 60},
  {id: "Flyers", title: "STAR Flyers", minutes: 60},
  {id: "Prestige", title: "STAR Prestige", minutes: 90},
  {id: "Other", title: "Individual coaching", minutes: 60},
];

export function StaffBookPlayer({target, onClose, onBooked}: {
  target: StaffBookingTarget;
  onClose: () => void;
  onBooked: (playerId: string, sessionId: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const bookingId = useRef<string>("");
  const [playerId, setPlayerId] = useState(target.playerId ?? "");
  const [players, setPlayers] = useState<Player[]>([]);
  const [programme, setProgramme] = useState(target.programme && individualProgrammes.some(option => option.id === target.programme) ? target.programme : "1-to-1");
  const [day, setDay] = useState(target.date ?? ukDateTimeInput(new Date().toISOString()).slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState("");
  const [venue, setVenue] = useState("");
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const selectedProgramme = individualProgrammes.find(option => option.id === programme)!;

  useEffect(() => {
    dialog.current?.showModal();
    let active = true;
    if (!db) setPlayerError("Connection unavailable. Reload the staff portal to try again.");
    else {
      const query = db.from("coaching_players").select("id,first_name,last_name").order("first_name").order("last_name");
      if (target.playerId) query.eq("id", target.playerId);
      void query.then(({data, error}) => {
        if (!active) return;
        if (error || (target.playerId && !data?.length)) setPlayerError("The player record is unavailable.");
        else setPlayers(data ?? []);
      });
    }
    return () => { active = false; };
  }, [target.playerId]);

  useEffect(() => {
    setSlots([]);
    setSlot("");
    if (!db || !playerId || !day) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError("");
    void db.rpc("star_staff_player_slots", {
      p_player: playerId, p_day: day, p_minutes: selectedProgramme.minutes,
    }).then(({data, error}) => {
      if (!active) return;
      if (error) setError(error.message);
      else setSlots(data ?? []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [playerId, day, selectedProgramme.minutes, revision]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!db || busy || !players.some(player => player.id === playerId) || !slot) return;
    setBusy(true);
    setError("");
    if (!bookingId.current) bookingId.current = crypto.randomUUID();
    try {
      const {data, error} = await db.rpc("star_staff_book_player", {
        p_session: bookingId.current, p_player: playerId, p_programme: programme,
        p_starts_at: slot, p_venue: venue.trim(), p_focus: focus.trim(),
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (typeof data !== "string") throw new Error("The booking could not be confirmed. Try saving again.");
      onBooked(playerId, data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Check the connection and try saving again.");
    } finally {
      setBusy(false);
    }
  }

  return <dialog ref={dialog} className="star-operations-dialog" aria-labelledby="staff-book-player-title"
    onCancel={event => {event.preventDefault(); if (!busy) onClose();}}>
    <header className="star-operations-header">
      <h2 id="staff-book-player-title">Book a player session</h2>
      <button type="button" className="star-operations-secondary" disabled={busy} onClick={onClose}>Close</button>
    </header>
    <p>One booking adds the player to the register and shares the session with her family.</p>
    <form className="star-operations-form" onSubmit={save}>
      <label>Player
        <select required value={players.some(player => player.id === playerId) ? playerId : ""} disabled={busy || Boolean(target.playerId)}
          onChange={event => setPlayerId(event.target.value)}>
          <option value="">Choose a player</option>
          {players.map(player => <option key={player.id} value={player.id}>{player.first_name} {player.last_name}</option>)}
        </select>
      </label>
      <div className="star-operations-fields">
        <label>Coaching
          <select value={programme} disabled={busy} onChange={event => setProgramme(event.target.value)}>
            {individualProgrammes.map(option => <option key={option.id} value={option.id}>{option.title} · {option.minutes} min</option>)}
          </select>
        </label>
        <label>Date (UK time)
          <input required type="date" min={ukDateTimeInput(new Date().toISOString()).slice(0, 10)}
            value={day} disabled={busy} onChange={event => setDay(event.target.value)}/>
        </label>
      </div>
      <label>Available start time
        <select required value={slot} disabled={busy || loading || !slots.length} onChange={event => setSlot(event.target.value)}>
          <option value="">{!playerId ? "Choose a player first" : loading ? "Checking availability…" : slots.length ? "Choose a time" : "No available times"}</option>
          {slots.map(option => <option key={option.starts_at} value={option.starts_at}>{ukDateTime(option.starts_at)}</option>)}
        </select>
      </label>
      <label>Venue <input required minLength={2} maxLength={150} value={venue} disabled={busy} onChange={event => setVenue(event.target.value)}/></label>
      <label>Coaching focus to share (optional)
        <input maxLength={500} value={focus} disabled={busy} onChange={event => setFocus(event.target.value)} placeholder="e.g. first touch into space"/>
      </label>
      {(playerError || error) && <p role="alert" className="star-operations-error">{playerError || error}</p>}
      <div className="star-operations-actions">
        <button type="submit" disabled={busy || loading || !slot || Boolean(playerError)}>{busy ? "Booking…" : "Confirm booking"}</button>
        {error && <button type="button" className="star-operations-secondary" disabled={busy} onClick={() => setRevision(value => value + 1)}>Refresh times</button>}
      </div>
    </form>
  </dialog>;
}
