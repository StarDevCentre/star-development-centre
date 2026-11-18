"use client";

import {useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import {ukDateTime} from "../lib/sessionOperations";
import type {SessionFlowPlayer, SessionFlowSession} from "./StaffSessionFlow";
import "./portal-operations.css";

const statuses = [
  ["present", "Present"], ["late", "Late"], ["absent", "Absent"], ["excused", "Excused"],
] as const;
const categories = ["Technical", "Tactical", "Physical", "Psychological", "Social"];
type Mark = typeof statuses[number][0];
type Note = {category: string; observation: string; next_action: string};
const blankNote: Note = {category: "Technical", observation: "", next_action: ""};

export function FinishTrainingSession({client, session, roster, marks, onCompleted}: {
  client: SupabaseClient | null;
  session: SessionFlowSession;
  roster: SessionFlowPlayer[];
  marks: {player_id: string; status: string}[];
  onCompleted: (stamp: string) => void;
}) {
  const [register, setRegister] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sessionOver = Date.parse(session.ends_at) <= Date.now();
  const mark = (id: string) => register[id] ?? marks.find(row => row.player_id === id)?.status ?? "";
  const completeRegister = roster.every(player => statuses.some(([value]) => value === mark(player.id)));

  function changeNote(id: string, field: keyof Note, value: string) {
    setNotes(current => ({...current, [id]: {...(current[id] ?? blankNote), [field]: value}}));
  }

  async function finish(event: React.FormEvent) {
    event.preventDefault();
    if (!client || busy || !sessionOver || !completeRegister) return;
    const writeUp = roster.flatMap(player => {
      const note = notes[player.id];
      return mode === "full" && (note?.observation.trim() || note?.next_action.trim()) ?
        [{player_id: player.id, ...note}] : [];
    });
    if (writeUp.some(note => note.observation.trim().length < 5)) {
      setError("Add a short observation for each player with a written next step.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const {data, error} = await client.rpc("star_complete_training_session", {
        p_session: session.id, p_register: roster.map(player => ({player_id: player.id, status: mark(player.id) as Mark})),
        p_notes: writeUp,
      });
      if (error) setError(error.message);
      else if (typeof data === "string") onCompleted(data);
      else setError("The completion could not be confirmed. Try again.");
    } catch {
      setError("The connection dropped. Your register and write-up are still here.");
    } finally {
      setBusy(false);
    }
  }

  if (session.completed_at) return <div className="star-flow-wrapup-status" data-ready="true" role="status">
    <strong>Session completed</strong><p>{ukDateTime(session.completed_at)} · Add further observations in Coaching.</p>
  </div>;
  if (session.organisation_id) return <p>Complete organisation delivery in Schools & clubs.</p>;
  if (!sessionOver) return <p>The register can be prepared now. Finish the session once it ends at {ukDateTime(session.ends_at)}.</p>;
  if (!roster.length) return <p>Add the booked players in Attendance to finish the session.</p>;
  return <form className="star-operations-form star-flow-card" onSubmit={finish}>
    <div className="star-session-actions" role="group" aria-label="How would you like to finish?">
      <button type="button" aria-pressed={mode === "quick"} disabled={busy} onClick={() => setMode("quick")}>Quick finish</button>
      <button type="button" aria-pressed={mode === "full"} disabled={busy} onClick={() => setMode("full")}>Full write-up</button>
    </div>
    {roster.map(player => {
      const note = notes[player.id] ?? blankNote;
      return <fieldset key={player.id} className="star-finish-player">
        <legend>{player.first_name} {player.last_name}</legend>
        <label>Attendance
          <select required value={mark(player.id)} disabled={busy}
            onChange={event => setRegister(current => ({...current, [player.id]: event.target.value}))}>
            <option value="">Choose attendance</option>
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {mode === "full" && <>
          <label>Category <select disabled={busy} value={note.category} onChange={event => changeNote(player.id, "category", event.target.value)}>
            {categories.map(category => <option key={category}>{category}</option>)}
          </select></label>
          <label>Private coaching observation (optional)
            <textarea rows={3} maxLength={1500} value={note.observation} disabled={busy}
              onChange={event => changeNote(player.id, "observation", event.target.value)}/>
          </label>
          <label>Next coaching action (optional)
            <textarea rows={2} maxLength={500} value={note.next_action} disabled={busy}
              onChange={event => changeNote(player.id, "next_action", event.target.value)}/>
          </label>
        </>}
      </fieldset>;
    })}
    {error && <p role="alert" className="star-operations-error">{error}</p>}
    <div className="star-operations-actions"><button type="submit" className="star-operations-button"
      disabled={busy || !completeRegister}>{busy ? "Finishing…" : mode === "quick" ? "Save register and finish" : "Save write-up and finish"}</button></div>
  </form>;
}
