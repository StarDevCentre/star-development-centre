"use client";

import {useEffect, useState} from "react";
import {staffNames} from "../lib/staffApp";
import {supabaseBrowser as db} from "../lib/supabaseBrowser";

type PackStatus = "due" | "ready" | "handed";
type FamilyPack = {status: PackStatus; ready_at: string | null; handed_at: string | null};
type Pack = FamilyPack & {player_id: string; player_name: string; reason: string; shirt_size: string | null; owner_id: string | null; version: number};
type Owner = {id: string; name: string};
type Queue = {tasks: Pack[]; owners: Owner[]};
const statusLabel: Record<PackStatus, string> = {due: "To prepare", ready: "Ready for collection", handed: "Handed over"};

export function StaffMemberPacks({active, refreshKey}: {active: boolean; refreshKey: number}) {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!active || !db) return;
    const client = db;
    let live = true;
    let latest = 0;
    async function load() {
      const attempt = ++latest;
      try {
        const {data, error} = await client.rpc("star_member_pack_queue");
        if (live && attempt === latest) { setError(!!error); if (!error) setQueue(data); }
      } catch { if (live && attempt === latest) setError(true); }
    }
    void load();
    window.addEventListener("focus", load);
    return () => { live = false; window.removeEventListener("focus", load); };
  }, [active, refreshKey, revision]);

  const reload = () => setRevision(value => value + 1);
  if (!queue && !error) return null;
  const open = queue?.tasks.filter(task => task.status !== "handed") ?? [];
  const completed = queue?.tasks.filter(task => task.status === "handed") ?? [];
  return <section className="star-member-packs" aria-label="Members packs"><details>
    <summary>Members packs <span>{open.length} open</span></summary>
    {error && <p role="alert">Couldn’t refresh the pack list. <button type="button" onClick={reload}>Retry</button></p>}
    {queue && <>
      {open.length ? open.map(task => <PackTask key={task.player_id + ":" + task.version} task={task} owners={queue.owners} onRefresh={reload}/>) : <p>No packs are waiting for handover.</p>}
      {completed.length > 0 && <details><summary>Handed over ({completed.length})</summary><ul>{completed.map(task =>
        <li key={task.player_id}>{task.player_name} · {task.handed_at && ukDay(task.handed_at)}</li>)}</ul></details>}
    </>}
  </details></section>;
}

function ukDay(stamp: string) {
  return new Date(stamp).toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London"});
}

function PackTask({task, owners, onRefresh}: {task: Pack; owners: Owner[]; onRefresh: () => void}) {
  const [owner, setOwner] = useState(task.owner_id ?? "");
  const [size, setSize] = useState(task.shirt_size ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(status: PackStatus) {
    if (!db || busy) return;
    setBusy(true); setError("");
    try {
      const {error} = await db.rpc("star_manage_member_pack", {p_player: task.player_id, p_expected: task.version,
        p_status: status, p_owner: owner || null, p_size: size.trim() || null});
      if (error) throw new Error(error.message);
      onRefresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t save the pack. Retry when connected."); }
    finally { setBusy(false); }
  }
  const next = task.status === "due" ? "ready" : "handed";
  return <article className="star-pack-task">
    <h3>{task.player_name}</h3><p>{task.reason} · {statusLabel[task.status]}</p>
    <div className="star-operations-form"><div className="star-operations-fields">
      <label>Owner<select disabled={busy} value={owner} onChange={e => setOwner(e.target.value)}><option value="">Unassigned</option>
        {owners.map(member => <option key={member.id} value={member.id}>{staffNames[member.id] || member.name}</option>)}</select></label>
      <label>Training top size<input maxLength={80} disabled={busy} value={size} placeholder="Size needed" onChange={e => setSize(e.target.value)}/></label>
    </div>
    {!size.trim() && <span>Confirm the player’s size to prepare the pack.</span>}
    <div className="star-operations-actions">
      <button type="button" disabled={busy || (owner === (task.owner_id ?? "") && size.trim() === (task.shirt_size ?? ""))} onClick={() => void save(task.status)}>Save details</button>
      <button type="button" className="star-operations-button" disabled={busy || !size.trim()} onClick={() => void save(next)}>{next === "ready" ? "Mark ready" : "Mark handed over"}</button>
    </div></div>
    {error && <p role="alert">{error} <button type="button" onClick={onRefresh}>Refresh</button></p>}
  </article>;
}

export function FamilyMemberPack({playerId, firstName, refreshKey}: {playerId: string; firstName: string; refreshKey: boolean}) {
  const [pack, setPack] = useState<FamilyPack | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!db || refreshKey) return;
    const client = db;
    let live = true;
    let latest = 0;
    async function load() {
      const attempt = ++latest;
      try {
        const {data, error} = await client.rpc("star_family_member_pack", {p_player: playerId});
        if (live && attempt === latest) { setError(!!error); if (!error) setPack(data); }
      } catch { if (live && attempt === latest) setError(true); }
    }
    void load();
    window.addEventListener("focus", load);
    return () => { live = false; window.removeEventListener("focus", load); };
  }, [playerId, refreshKey, retry]);
  if (!pack && !error) return null;
  return <article className="ppx-card star-family-pack"><h2>{firstName}’s members pack</h2>
    {pack && <p>{pack.status === "due" ? "Your pack is due. STAR will mark it here when it’s ready for collection."
      : pack.status === "ready" ? "Ready for collection. Ask your coach for your pack at your next session."
      : "Handed over" + (pack.handed_at ? " on " + ukDay(pack.handed_at) : "") + "."}</p>}
    {error && <p role="alert">Couldn’t refresh the pack status. <button type="button" className="ppx-text-btn" onClick={() => setRetry(v => v + 1)}>Retry</button></p>}
  </article>;
}
