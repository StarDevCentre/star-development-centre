"use client";

import {useState} from "react";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";

export function QuickPracticeCheckIn({assignmentId, saved, onSaved}: {
  assignmentId: string;
  saved: boolean;
  onSaved: () => void;
}) {
  const [done, setDone] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function save(addReflection: boolean) {
    if (!db || busy || (addReflection && !reflection.trim())) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const {data, error} = await db.rpc("star_try_home_practice", {
        p_assignment: assignmentId, p_reflection: addReflection ? reflection.trim() : null,
      });
      if (error) throw new Error(error.message);
      if (typeof data !== "string") throw new Error("The check-in could not be confirmed.");
      setDone(true);
      setReflecting(false);
      setReflection("");
      setNotice(addReflection ? "Reflection sent to your coach." : "Saved. Your coach can see that you tried it.");
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="ps-practice-checkin">
    {saved || done ? <p><strong>✓ Tried it</strong> <button type="button" className="ps-text-link" aria-expanded={reflecting}
      onClick={() => setReflecting(value => !value)}>{reflecting ? "Close reflection" : "Add a reflection"}</button></p>
      : <button className="ps-action" type="button" disabled={busy} onClick={() => void save(false)}>{busy ? "Saving…" : "Tried it"}</button>}
    {reflecting && <form className="ps-practice-form" onSubmit={event => {event.preventDefault(); void save(true);}}>
      <label>What did you notice?
        <textarea rows={3} maxLength={1500} value={reflection} disabled={busy} onChange={event => setReflection(event.target.value)}/>
      </label>
      <button className="ps-action" type="submit" disabled={busy || !reflection.trim()}>{busy ? "Saving…" : "Save reflection"}</button>
    </form>}
    {notice && <p role="status" className="ps-notice">{notice}</p>}
    {error && <p role="alert" className="ps-error">{error}</p>}
  </div>;
}
