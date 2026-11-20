"use client";

import {useEffect, useState} from "react";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";
import {ukDate, ukDateTimeInput} from "../lib/sessionOperations";
import "./portal-operations.css";

const fields = [
  ["strengths", "What went well"], ["development_areas", "What we’re working on"], ["next_steps", "What to try next"],
] as const;
type Field = typeof fields[number][0];
type Draft = Record<Field, string>;
type Observation = {
  id: string; recorded_at: string; category: string; observation: string; next_action: string | null;
  training_sessions: {starts_at: string} | {starts_at: string}[] | null;
};
type Reflection = {
  id: string; practice_date: string; reflection: string;
  player_training_assignments: {title: string} | {title: string}[] | null;
};
const empty: Draft = {strengths: "", development_areas: "", next_steps: ""};
const joined = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] : value;

export function MonthlyCoachingDraft({playerId, userId, onPublished}: {
  playerId: string; userId: string; onPublished: () => void;
}) {
  const [month, setMonth] = useState(ukDateTimeInput(new Date().toISOString()).slice(0, 7));
  const [draft, setDraft] = useState<Draft>(empty);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [approved, setApproved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const reportDate = month + "-01";

  useEffect(() => {
    if (!db || !month) return;
    let alive = true;
    setLoading(true);
    setError("");
    setNotice("");
    setApproved(false);
    setDirty(false);
    setDraft(empty);
    setObservations([]);
    setReflections([]);
    void Promise.all([
      db.from("staff_monthly_drafts").select("strengths,development_areas,next_steps").eq("player_id", playerId).eq("review_month", reportDate).maybeSingle(),
      db.from("family_monthly_reports").select("strengths,development_areas,next_steps").eq("player_id", playerId).eq("review_month", reportDate).maybeSingle(),
      db.rpc("star_monthly_evidence", {p_player: playerId, p_month: reportDate}),
    ]).then(([saved, published, evidence]) => {
      if (!alive) return;
      if (saved.error || published.error || evidence.error) setError("Some evidence or saved text could not be loaded.");
      setDraft(saved.data ?? published.data ?? empty);
      setObservations(evidence.data?.observations ?? []);
      setReflections(evidence.data?.reflections ?? []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [playerId, month, reportDate]);

  function change(field: Field, value: string) {
    setDraft(current => ({...current, [field]: value}));
    setApproved(false);
    setDirty(true);
  }

  async function save(publish: boolean) {
    if (!db || busy || loading || (publish && (!approved || fields.some(([key]) => !draft[key].trim())))) return;
    setBusy(true);
    setError("");
    setNotice("");
    const row = {player_id: playerId, review_month: reportDate, ...draft};
    try {
      const saved = await db.from("staff_monthly_drafts").upsert({...row, updated_at: new Date().toISOString()}, {onConflict: "player_id,review_month"});
      if (saved.error) throw new Error(saved.error.message);
      setDirty(false);
      if (publish) {
        const result = await db.from("family_monthly_reports").upsert({...row, published_by: userId, published_at: new Date().toISOString()}, {onConflict: "player_id,review_month"});
        if (result.error) throw new Error("Draft saved. Publishing failed: "+result.error.message);
        setApproved(false);
        setNotice("Monthly report shared with the family.");
        onPublished();
      } else {
        setNotice("Private report draft saved.");
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save your report. Your edits are still here.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="star-hub-panel star-operations-form" aria-label="Draft a monthly report">
    <h4>Draft a monthly report</h4>
    <label>Review month
      <input type="month" required value={month} disabled={busy} onChange={event => {
        if (event.target.value && (!dirty || window.confirm("Leave this unsaved report draft?"))) setMonth(event.target.value);
      }}/>
    </label>
    {loading ? <p role="status">Loading the report and coaching evidence…</p> : <>
      <details>
        <summary>Private coaching evidence · {observations.length} observations and {reflections.length} practice reflections</summary>
        {observations.map(note => <article key={note.id}>
          <strong>{ukDate(joined(note.training_sessions)?.starts_at ?? note.recorded_at)} · {note.category}</strong>
          <p>{note.observation}</p>
          {note.next_action && <p>Next action · {note.next_action} <button type="button" disabled={busy}
            onClick={() => change("next_steps", [draft.next_steps, note.next_action].filter(Boolean).join("\n").slice(0,2000))}>Add to draft next steps</button></p>}
        </article>)}
        {reflections.map(entry => <article key={entry.id}><strong>{entry.practice_date} · {joined(entry.player_training_assignments)?.title}</strong><p>{entry.reflection}</p></article>)}
      </details>
      {fields.map(([key, label]) => <label key={key}>{label}<textarea value={draft[key]} rows={3} maxLength={2000} disabled={busy}
        onChange={event => change(key, event.target.value)}/></label>)}
      <label className="star-report-approval"><input type="checkbox" checked={approved} disabled={busy}
        onChange={event => setApproved(event.target.checked)}/> I’ve reviewed the text and approve it for the family.</label>
      <div className="star-operations-actions">
        <button type="button" disabled={busy} onClick={() => void save(false)}>Save private draft</button>
        <button type="button" className="star-operations-button" disabled={busy || !approved || fields.some(([key]) => !draft[key].trim())}
          onClick={() => void save(true)}>Publish monthly report</button>
      </div>
    </>}
    {error && <p role="alert" className="star-operations-error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
