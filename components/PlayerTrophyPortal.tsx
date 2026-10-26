"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { supabaseBrowser as db } from "../lib/supabaseBrowser";
import { assignmentFields, diaryFields, defaultProfile, emptySpaceData, type PracticeInput, type SpaceActions, type SpaceData, type SpaceProfile } from "../lib/playerSpace";
import { PlayerSpace, PlayerSpaceHeader, PlayerSpaceHero } from "./PlayerSpace";
import { SpaceIcon } from "./PlayerSpaceIcons";

// History can outgrow the Data API's default row limit.
async function readHistoryPages<T extends {id:string}>(request:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>) {
  const rows=new Map<string,T>();
  for(let from=0;;from+=500){
    const result=await request(from,from+499);
    if(result.error)throw result.error;
    for(const row of result.data||[])rows.set(row.id,row);
    if((result.data||[]).length<500)return {data:[...rows.values()],error:null};
  }
}

function historyBatches<T>(values:T[]) {
  const batches:T[][]=[];
  for(let i=0;i<values.length;i+=100)batches.push(values.slice(i,i+100));
  return batches;
}

export function PlayerTrophyPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<SpaceData>(emptySpaceData);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [failed, setFailed] = useState(false);
  const authRevision = useRef(0);

  useEffect(() => {
    if (!db) { setReady(true); return; }
    let active = true;
    const initialRevision = authRevision.current;
    void db.auth.getUser().then(({ data: result, error }) => {
      if (active && authRevision.current === initialRevision) { setUser(error ? null : result.user); setReady(true); }
    }).catch(() => { if (active) { setReady(true); setError("Could not check your sign-in. Please try again."); } });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      if (active) { authRevision.current++; setUser(session?.user || null); setReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadedUserId(null); setData(emptySpaceData); setFailed(false); setError("");
    if (!db || !user) return;
    const currentUserId = user.id;
    void (async () => {
      try {
        const links = await db.from("guardian_player_links").select("player_id").eq("guardian_id", currentUserId);
        if (links.error) throw links.error;
        const ids = (links.data || []).map(link => link.player_id);
        if (!ids.length) { if (active) setLoadedUserId(currentUserId); return; }
        const results = await Promise.all([
          db.from("coaching_players").select("id,first_name,last_name,programme").in("id", ids).order("first_name"),
          db.from("player_achievements").select("id,player_id,title,description,awarded_on,badge_id").in("player_id", ids).order("awarded_on", { ascending: false }).order("created_at", { ascending: false }),
          db.from("player_training_assignments").select(assignmentFields).in("player_id", ids).order("created_at", { ascending: false }),
          db.from("coaching_development_goals").select("id,player_id,goal,status").in("player_id", ids),
          db.from("family_session_schedule").select("id,player_id,title,starts_at,ends_at,venue").in("player_id", ids).gte("ends_at", new Date().toISOString()).order("starts_at"),
          db.from("coaching_idp_assessments").select("id,player_id,category,rating,assessed_on").in("player_id", ids).order("assessed_on", { ascending: false }),
          db.from("family_monthly_reports").select("id,player_id,review_month,strengths,development_areas,next_steps").in("player_id", ids).order("review_month", { ascending: false }),
          db.from("player_space_profiles").select("*").in("player_id", ids),
          db.from("player_personal_goals").select("id,player_id,goal,target_date,status").in("player_id", ids).order("created_at", { ascending: false }),
          db.from("player_award_receipts").select("achievement_id").eq("guardian_id", currentUserId),
          db.from("player_cosmetic_unlocks").select("player_id,cosmetic,unlocked_at").in("player_id",ids),
          readHistoryPages((from,to)=>db!.from("player_goal_events").select("id,player_id,source_id,source,kind,goal,occurred_at").in("player_id",ids).order("occurred_at",{ascending:false}).order("id").range(from,to))
        ]);
        if (results.some(result => result.error)) throw new Error("Unable to load player data");
        const assignmentIds = (results[2].data || []).map(value => value.id);
        const diaryPages=await Promise.all(historyBatches(assignmentIds).map(batch=>readHistoryPages((from,to)=>db!.from("player_training_diary").select(diaryFields).in("assignment_id",batch).order("created_at",{ascending:false}).order("id").range(from,to))));
        const diaryRows=diaryPages.flatMap(page=>page.data).sort((a,b)=>b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id));
        const diaryIds=diaryRows.map(value=>value.id);
        const feedbackPages=await Promise.all(historyBatches(diaryIds).map(async batch=>{
          const result=await db!.from("player_training_feedback").select("diary_id,feedback,reviewed_at").in("diary_id",batch);
          if(result.error)throw result.error;
          return result.data||[];
        }));
        const feedbackRows=feedbackPages.flat().sort((a,b)=>b.reviewed_at.localeCompare(a.reviewed_at));
        const profiles = await Promise.all((results[7].data || []).map(async value => {
          const profile = value as unknown as SpaceProfile;
          if (!profile.photo_path) return profile;
          const photo = await db!.storage.from("player-card-photos").createSignedUrl(profile.photo_path, 3600);
          return { ...profile, photo_url: photo.data?.signedUrl };
        }));
        if (active) {
          setData({ players: results[0].data || [], awards: results[1].data || [], assignments: results[2].data || [], goals: results[3].data || [], sessions: results[4].data || [], assessments: results[5].data || [], reports: results[6].data || [], profiles, personalGoals: results[8].data || [], celebrated: (results[9].data || []).map(value => value.achievement_id), unlocks:results[10].data || [], goalEvents:results[11].data || [], diary: diaryRows, feedback: feedbackRows } as SpaceData);
          setLoadedUserId(currentUserId);
        }
      } catch { if (active) { setError("We couldn’t load your player space. Please try again."); setFailed(true); setLoadedUserId(currentUserId); } }
    })();
    return () => { active = false; };
  }, [user?.id, revision]);

  useEffect(() => {
    if (!db || !user) return;
    let active=true;
    const timer = window.setInterval(() => {
      void Promise.all(data.profiles.filter(p=>p.photo_path).map(async profile => {
        const result = await db!.storage.from("player-card-photos").createSignedUrl(profile.photo_path!, 3600);
        if(active && result.data) setData(current=>({...current,profiles:current.profiles.map(p=>p.player_id===profile.player_id?{...p,photo_url:result.data.signedUrl}:p)}));
      })).catch(()=>{});
    }, 30 * 60 * 1000);
    return () => { active=false; window.clearInterval(timer); };
  }, [user?.id, data.profiles]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); if (!db || busy) return;
    setBusy(true); setError("");
    try { const result = await db.auth.signInWithPassword({ email: email.trim(), password }); if (result.error) setError("Could not sign in. Check your parent account details and try again."); }
    catch { setError("Sign-in is temporarily unavailable. Please try again."); }
    finally { setPassword(""); setBusy(false); }
  }
  async function refreshProgress(playerId:string) {
    if(!db)return;
    const [unlocks,events]=await Promise.all([
      db.from("player_cosmetic_unlocks").select("player_id,cosmetic,unlocked_at").eq("player_id",playerId),
      readHistoryPages((from,to)=>db!.from("player_goal_events").select("id,player_id,source_id,source,kind,goal,occurred_at").eq("player_id",playerId).order("occurred_at",{ascending:false}).order("id").range(from,to))
    ]);
    if(!unlocks.error&&!events.error) setData(current=>({...current,unlocks:[...current.unlocks.filter(u=>u.player_id!==playerId),...unlocks.data],goalEvents:[...current.goalEvents.filter(e=>e.player_id!==playerId),...events.data]}));
  }
  async function savePractice(value: PracticeInput) {
    if (!db || !user || loadedUserId !== user.id || !data.assignments.some(item => item.id === value.assignment_id)) throw new Error("Please sign in again to record practice.");
    if ([value.confidence,value.enjoyment].some(r=>r!=null&&(!Number.isInteger(r)||r<1||r>5))) throw new Error("Choose a rating from 1 to 5, or leave it blank.");
    if (!Number.isInteger(value.minutes) || value.minutes < 0 || value.minutes > 360 || !value.reflection.trim()) throw new Error("Check your practice details and try again.");
    const result = await db.from("player_training_diary").insert({ ...value, guardian_id: user.id }).select(diaryFields).single();
    if (result.error || !result.data) throw new Error("Your practice couldn’t be saved. Check your connection and try again.");
    setData(current => ({ ...current, diary: [result.data, ...current.diary] }));
    await refreshProgress(data.assignments.find(a=>a.id===value.assignment_id)!.player_id).catch(()=>{});
  }
  const updateProfile: SpaceActions['onUpdateProfile'] = async (playerId, patch, photo) => {
    if (!db || !user || loadedUserId !== user.id || !data.players.some(p=>p.id===playerId)) throw new Error("Please sign in again to save your card.");
    const old = data.profiles.find(p=>p.player_id===playerId);
    let initial = { ...defaultProfile };
    if(!old) try {
      const legacy=JSON.parse(localStorage.getItem(`star-player-card-v1:${user.id}:${playerId}`)||"null");
      const accent=({lilac:"gold",blue:"navy",coral:"red"} as Record<string,string>)[legacy?.accent]||legacy?.accent;
      if(["navy","red","gold"].includes(accent)&&["train","ball","star"].includes(legacy?.icon)&&["Your game. Your journey.","Small steps. Big dreams.","Be brave. Be you."].includes(legacy?.motto)) initial={...initial,accent,icon:legacy.icon,motto:legacy.motto};
    } catch { /* A legacy device preference is optional. */ }
    let newPath: string | undefined;
    let photoUrl = old?.photo_url;
    try {
      if (photo) {
        if(photo.type!=="image/jpeg" || photo.size>1048576) throw new Error("Choose a smaller photo and try again.");
        newPath = `${playerId}/${crypto.randomUUID()}.jpg`;
        const upload = await db.storage.from("player-card-photos").upload(newPath, photo, { contentType: "image/jpeg", upsert: false, cacheControl: "3600" });
        if(upload.error) throw new Error("Your photo couldn’t be uploaded. Check your connection and try again.");
        const signed = await db.storage.from("player-card-photos").createSignedUrl(newPath, 3600);
        if(signed.error) throw new Error("Your photo couldn’t be opened. Please try again.");
        photoUrl = signed.data.signedUrl;
      }
      const change = { ...patch, ...(photo !== undefined ? {photo_path: newPath || null} : {}), updated_by: user.id, updated_at: new Date().toISOString() };
      let result = old ? await db.from("player_space_profiles").update(change).eq("player_id",playerId).select().single() : await db.from("player_space_profiles").insert({...initial,...change,player_id:playerId}).select().single();
      // Another family device may have created the first preferences row meanwhile.
      if (!old && result.error?.code==="23505") result = await db.from("player_space_profiles").update(change).eq("player_id",playerId).select().single();
      if(result.error || !result.data) throw new Error("Your card couldn’t be saved. Please try again.");
      const saved = { ...result.data, photo_url: photo===null ? undefined : photoUrl } as SpaceProfile;
      setData(current=>({...current,profiles:[...current.profiles.filter(p=>p.player_id!==playerId),saved]}));
    } catch(value) {
      if(newPath) await db.storage.from("player-card-photos").remove([newPath]);
      throw value;
    }
    if(photo!==undefined && old?.photo_path) await db.storage.from("player-card-photos").remove([old.photo_path]).catch(()=>{});
  };
  const saveGoal: SpaceActions['onSaveGoal'] = async (playerId,value,goalId) => {
    if(!db||!user||loadedUserId!==user.id||!data.players.some(p=>p.id===playerId)) throw new Error("Please sign in again to save goals.");
    if(value.goal.trim().length<3||value.goal.length>300) throw new Error("Write a goal between 3 and 300 characters.");
    const fields={goal:value.goal.trim(),target_date:value.target_date,status:value.status};
    const result=goalId ? await db.from("player_personal_goals").update({...fields,updated_at:new Date().toISOString()}).eq("id",goalId).eq("player_id",playerId).select("id,player_id,goal,target_date,status").single() : await db.from("player_personal_goals").insert({...fields,player_id:playerId,created_by:user.id}).select("id,player_id,goal,target_date,status").single();
    if(result.error||!result.data) throw new Error("Your goal couldn’t be saved. Please try again.");
    setData(current=>({...current,personalGoals:[result.data,...current.personalGoals.filter(g=>g.id!==result.data.id)]}));
    await refreshProgress(playerId).catch(()=>{});
  };
  const celebrate: SpaceActions['onCelebrate'] = async awardIds => {
    if(!db||!user||loadedUserId!==user.id||awardIds.some(id=>!data.awards.some(a=>a.id===id))) throw new Error("Please refresh your player space.");
    const result=await db.from("player_award_receipts").upsert(awardIds.map(id=>({guardian_id:user.id,achievement_id:id})),{onConflict:"guardian_id,achievement_id",ignoreDuplicates:true});
    if(result.error) throw new Error("Couldn’t save the celebration. Please try again.");
    setData(current=>({...current,celebrated:[...new Set([...current.celebrated,...awardIds])]}));
  };

  async function signOut() {
    if (!db) return;
    const result = await db.auth.signOut();
    if (result.error) throw result.error;
    setData(emptySpaceData); setUser(null); setError("");
  }

  if (ready && user && loadedUserId === user.id && !failed && data.players.length) return <PlayerSpace key={user.id} userKey={user.id} data={data} onSavePractice={savePractice} onUpdateProfile={updateProfile} onSaveGoal={saveGoal} onCelebrate={celebrate} onRefresh={() => setRevision(value => value + 1)} onSignOut={signOut}/>;

  return <div className="player-space-shell"><div className="ps-shell-inner"><PlayerSpaceHeader/><div className="ps-welcome-grid"><PlayerSpaceHero compact/><section className="ps-welcome-panel ps-paper">
    {!ready ? <p role="status">Checking your account…</p> : !db ? <><h2>Your space is taking a breather.</h2><p>Please try again soon or <Link href="/contact">contact STAR</Link>.</p><Link className="ps-action" href="/player-portal/preview">EXPLORE A SAMPLE <SpaceIcon name="arrow"/></Link></> : !user ? <><span className="ps-tape">READY WHEN YOU ARE.</span><h2>MAKE YOURSELF<br/><em>AT HOME.</em></h2><p>Training, goals and your very own trophy cabinet. Open your player space together with a parent or guardian.</p><form className="ps-login-form" onSubmit={signIn}><label>Parent / guardian email<input type="email" required autoComplete="email" maxLength={200} value={email} onChange={event => setEmail(event.target.value)}/></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)}/></label><button className="ps-action" disabled={busy} type="submit">{busy ? "OPENING YOUR SPACE…" : "LET’S GO"}<SpaceIcon name="arrow"/></button></form><Link className="ps-auth-help" href="/parent-portal">Create a parent account / forgot password?</Link><Link className="ps-sample-link" href="/player-portal/preview">Take a look around a sample space <SpaceIcon name="arrow"/></Link></> : loadedUserId !== user.id ? <p role="status">Getting your player space ready…</p> : failed ? <><h2>Let’s try that again.</h2><p>Your player space couldn’t be loaded.</p><button className="ps-action" onClick={() => setRevision(value => value + 1)}>TRY AGAIN <SpaceIcon name="refresh"/></button></> : <><span className="ps-tape">YOU’RE IN THE RIGHT PLACE.</span><h2>Your space<br/>is on its way.</h2><p>STAR needs to approve the link between your parent account and player profile. Your training and badges will appear here once it’s ready.</p><Link className="ps-action" href="/parent-portal">PARENT DASHBOARD <SpaceIcon name="arrow"/></Link><Link className="ps-sample-link" href="/player-portal/preview">Explore a sample space →</Link></>}
    {error && <p className="ps-error" role="alert">{error}</p>}{user && <button className="ps-auth-help" onClick={() => void signOut().catch(() => setError("Could not sign out. Please try again."))}>Sign out</button>}
  </section></div><footer className="ps-footer"><span>DEVELOP. BELIEVE. ACHIEVE.</span><Link href="/privacy">Privacy & support ↗</Link></footer></div></div>;
}
