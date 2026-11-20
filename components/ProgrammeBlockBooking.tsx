"use client";

import {useEffect, useRef, useState} from "react";
import {staffNames} from "../lib/staffApp";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";

type Choice = {id: string; name: string};
type Plan = {id: string; title: string};
type Preview = {week: number; issue: string | null};

export function weeklyDates(firstDay: string, time: string, count: number): string[] {
  const date = new Date(firstDay + "T12:00:00Z");
  if (!Number.isFinite(date.getTime()) || !time) return [];
  return Array.from({length: count}, () => {
    const civilTime = date.toISOString().slice(0, 10) + "T" + time;
    date.setUTCDate(date.getUTCDate() + 7);
    return civilTime;
  });
}

export function ProgrammeBlockBooking({playerId, initialDate, initialProgramme, busy, setBusy, onBooked}: {
  playerId: string; initialDate: string; initialProgramme?: string; busy: boolean; setBusy: (value: boolean) => void;
  onBooked: (playerId: string, sessionId: string) => void;
}) {
  const [programme, setProgramme] = useState(initialProgramme === "Prestige" ? "Prestige" : "Flyers");
  const [coaches, setCoaches] = useState<Choice[]>([]);
  const [coach, setCoach] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState("");
  const [venue, setVenue] = useState("");
  const [firstDay, setFirstDay] = useState(initialDate);
  const [time, setTime] = useState("16:00");
  const [dates, setDates] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview[]>([]);
  const [checked, setChecked] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const request = useRef({key: "", id: ""});
  const submitting = useRef(false);
  const count = programme === "Flyers" ? 16 : 24;
  const minutes = programme === "Flyers" ? 60 : 90;

  useEffect(() => {
    let active = true;
    const client = db;
    setLoading(true); setLoadError(""); setCoach(""); setCoaches([]); setPlans([]); setPlan("");
    async function load() {
      try {
        if (!client) throw new Error("Reload the staff portal to connect.");
        const [staff, saved] = await Promise.all([
          client.rpc("star_programme_coaches", {p_player: playerId}),
          client.from("staff_session_plans").select("id,title").order("updated_at", {ascending: false}),
        ]);
        if (staff.error || saved.error) throw new Error((staff.error || saved.error)!.message);
        if (!active) return;
        const available: Choice[] = staff.data ?? [];
        setCoaches(available);
        if (available.length === 1) setCoach(available[0].id);
        setPlans(saved.data ?? []);
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Couldn’t load the coaches and plans.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [playerId, retry]);

  function resetDates() { setDates([]); setPreview([]); setChecked(""); setError(""); }

  const checkedDates = JSON.stringify([playerId, coach, programme, dates]);
  const issues = preview.filter(row => row.issue);
  const confirmed = checked === checkedDates && preview.length === count && issues.length === 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!db || busy || submitting.current || !coach || !venue.trim()) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      const weeks = dates.length ? dates : weeklyDates(firstDay, time, count);
      const args = {p_player: playerId, p_coach: coach, p_programme: programme, p_dates: weeks};
      if (!confirmed) {
        setDates(weeks);
        const {data, error} = await db.rpc("star_preview_programme_block", args);
        if (error) throw new Error(error.message);
        if (!Array.isArray(data) || data.length !== count) throw new Error("The complete programme could not be checked.");
        setPreview(data); setChecked(JSON.stringify([playerId, coach, programme, weeks]));
      } else {
        const key = JSON.stringify([checkedDates, venue.trim(), plan]);
        if (request.current.key !== key) request.current = {key, id: crypto.randomUUID()};
        const {data, error} = await db.rpc("star_book_programme_block", {
          ...args, p_request: request.current.id, p_venue: venue.trim(), p_plan: plan || null,
        });
        if (error) {
          if (/week [0-9]+|already booked|clash/i.test(error.message)) setChecked("");
          throw new Error(error.message);
        }
        if (typeof data !== "string") throw new Error("The booking response was incomplete. Retry with the same dates.");
        onBooked(playerId, data);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Check the connection and try again.");
    } finally { submitting.current = false; setBusy(false); }
  }

  return <form className="star-operations-form" onSubmit={submit}>
    <div className="star-operations-fields">
      <label>Programme<select value={programme} disabled={busy} onChange={e => { setProgramme(e.target.value); resetDates(); }}>
        <option value="Flyers">Flyers · 16 × 60 minutes</option><option value="Prestige">Prestige · 24 × 90 minutes</option>
      </select></label>
      <label>Coach<select value={coach} required disabled={busy || loading} onChange={e => { setCoach(e.target.value); setPreview([]); setChecked(""); }}>
        <option value="">{loading ? "Loading coaches…" : "Choose a coach"}</option>
        {coaches.map(c => <option key={c.id} value={c.id}>{staffNames[c.id] || c.name}</option>)}
      </select></label>
    </div>
    {coaches.length < 2 && !loading && !loadError && <small>To add another coach, use Assigned coaches on the player’s profile.</small>}
    {loadError && <p className="star-operations-error" role="alert">{loadError} <button type="button" onClick={() => setRetry(v => v + 1)}>Retry</button></p>}
    <label>Venue for all weeks<input required minLength={2} maxLength={150} value={venue} disabled={busy} onChange={e => setVenue(e.target.value)}/></label>
    <div className="star-operations-fields">
      <label>First date<input type="date" required value={firstDay} disabled={busy} onChange={e => { setFirstDay(e.target.value); resetDates(); }}/></label>
      <label>Weekly start (UK time)<input type="time" required value={time} disabled={busy} onChange={e => { setTime(e.target.value); resetDates(); }}/></label>
    </div>
    <label>Saved plan for all weeks<select value={plan} disabled={busy || loading} onChange={e => setPlan(e.target.value)}>
      <option value="">Choose plans later</option>{plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
    </select></label>
    {dates.length > 0 && <fieldset className="star-programme-weeks"><legend>Review the {count} dates</legend>
      <p>Each session lasts {minutes} minutes. You can change individual dates before booking.</p>
      {dates.map((date, index) => {
        const issue = preview.find(row => row.week === index + 1)?.issue;
        return <label key={index}>Week {index + 1}<input type="datetime-local" value={date} required disabled={busy} aria-invalid={!!issue}
          onChange={e => { const value = e.target.value; setDates(old => old.map((item, i) => i === index ? value : item)); setChecked(""); setPreview(old => old.filter(row => row.week !== index + 1)); }}/>
          {issue && <small className="star-operations-error">{issue}</small>}</label>;
      })}
    </fieldset>}
    {checked === checkedDates && <p role="status">{issues.length ? `${issues.length} dates need attention.` : `All ${count} dates are available.`}</p>}
    {error && <p role="alert" className="star-operations-error">{error}</p>}
    <button type="submit" disabled={loading || busy || !coach || !!loadError}>
      {busy ? "Checking calendar…" : confirmed ? `Confirm all ${count} bookings` : dates.length ? "Recheck dates" : "Preview weekly dates"}
    </button>
  </form>;
}
