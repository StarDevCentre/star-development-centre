"use client";

import {useEffect, useState} from "react";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";
import {ukDateTime} from "../lib/sessionOperations";

type Membership = {
  service_id: string;
  upcoming: {id: string; starts_at: string; venue: string; absent: boolean}[];
  issues: {starts_at: string; reason: string}[];
};

export function SparksWeeklyPlace({playerId, revision, onChanged, onUpdated}: {
  playerId: string;
  revision: number;
  onChanged?: (active: boolean) => void;
  onUpdated?: () => void;
}) {
  const [data, setData] = useState<Membership | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let alive = true;
    void db?.rpc("star_sparks_membership", {p_player: playerId, p_action: "read"}).then(result => {
      if (!alive) return;
      if (result.error) setError("Could not check her weekly Sparks place.");
      else {setData(result.data);onChanged?.(Boolean(result.data));}
    });
    return () => { alive = false; };
  }, [playerId, revision]);

  async function update(action: "absence" | "end", session?: string) {
    if (!db || busy) return;
    if (action === "end" && !window.confirm("End her weekly Sparks place and cancel her future Sparks dates?")) return;
    setBusy(true);
    setError("");
    try {
      const {data, error} = await db.rpc("star_sparks_membership", {p_player: playerId, p_action: action, p_session: session ?? null});
      if (error) throw new Error(error.message);
      setData(data);
      setNotice(action === "absence" ? "Absence recorded for this date. Her weekly place is reserved." : "Her weekly Sparks place has ended.");
      onChanged?.(Boolean(data));
      onUpdated?.();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update the Sparks place. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!data && !notice && !error) return null;
  return <section className="star-hub-panel" aria-label="Weekly Sparks place">
    <h4>Weekly Sparks place</h4>
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
    {data && <>
      <p>Ages {data.service_id === "sparks_5_7" ? "5–7" : "8–10"} · Monday, 3:45–4:45 pm UK time</p>
      {data.upcoming.length ? <ul>{data.upcoming.map(session => <li key={session.id}>
        {ukDateTime(session.starts_at)} · {session.venue} {session.absent
          ? <strong>Absence recorded</strong>
          : <button type="button" disabled={busy} onClick={() => void update("absence", session.id)}>Report this date absent</button>}
      </li>)}</ul> : <p>New dates appear here as STAR releases them.</p>}
      {data.issues.length > 0 && <ul>{data.issues.map(issue => <li key={issue.starts_at}>{ukDateTime(issue.starts_at)} · {issue.reason} Please contact STAR.</li>)}</ul>}
      <button type="button" disabled={busy} onClick={() => void update("end")}>End weekly place</button>
    </>}
  </section>;
}
