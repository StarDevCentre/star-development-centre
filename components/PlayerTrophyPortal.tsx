"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { supabaseBrowser as db } from "../lib/supabaseBrowser";
import { assignmentFields, diaryFields, defaultProfile, emptySpaceData, type PracticeInput, type SpaceActions, type SpaceData, type SpaceProfile } from "../lib/playerSpace";
import { PlayerSpace, PlayerSpaceHeader, PlayerSpaceHero } from "./PlayerSpace";
import { PlayerAccess } from "./PlayerAccountSetup";
import { loadPortalFeatures, sessionFields } from "../lib/playerPortalData";
import type { PortalFeatureActions, MatchJournal } from "../lib/playerPortalFeatures";
import { SpaceIcon } from "./PlayerSpaceIcons";
import {removeDevicePush} from "../lib/playerPush";

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
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [failed, setFailed] = useState(false);
  const authRevision = useRef(0);
  const profileWrites = useRef(0);
  const identity = useRef<string|null>(null);
  const [actorRole,setActorRole] = useState<"player"|"guardian">("guardian");
  const [recovering,setRecovering] = useState(false);

  useEffect(() => {
    if (!db) { setReady(true); return; }
    let active = true;
    const initialRevision = authRevision.current;
    void db.auth.getUser().then(({ data: result, error }) => {
      if (active && authRevision.current === initialRevision) { setUser(error ? null : result.user); setReady(true); }
    }).catch(() => { if (active) { setReady(true); setError("Could not check your sign-in. Please try again."); } });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      if (active) { if(_event==="PASSWORD_RECOVERY")setRecovering(true);if(!session)setRecovering(false); authRevision.current++; setUser(session?.user || null); setReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    const changed=identity.current!==(user?.id||null);
    if(changed||!data.players.length){setLoadedUserId(null);setData(emptySpaceData);}
    identity.current=user?.id||null; setFailed(false); setError("");
    if (!db || !user) return;
    const currentUserId = user.id;
    const profileVersion = profileWrites.current;
    void (async () => {
      try {
        const [links,accounts]=await Promise.all([db.from("guardian_player_links").select("player_id").eq("guardian_id",currentUserId),db.from("player_account_links").select("player_id").eq("user_id",currentUserId)]);
        if(links.error||accounts.error)throw new Error("Could not check player access");
        const candidateIds=[...new Set([...(links.data||[]).map(l=>l.player_id),...(accounts.data||[]).map(a=>a.player_id)])];
        const allowed=candidateIds.length?await db.from("coaching_players").select("id,first_name,last_name,programme").in("id",candidateIds).order("first_name"):{data:[],error:null};
        if(allowed.error)throw allowed.error;
        const ids=(allowed.data||[]).map(p=>p.id);
        if(active)setActorRole(accounts.data?.length?'player':'guardian');
        if(!ids.length){if(active){setData(emptySpaceData);setLoadedUserId(currentUserId);}return;}
        await Promise.all(ids.map(id=>db!.rpc('refresh_session_reminders',{target_player:id})));
        const ballProgress=await Promise.all(ids.map(async player_id=>{const r=await db!.rpc('player_ball_progress',{target_player:player_id});if(r.error||!Number.isSafeInteger(r.data))throw new Error('Could not load ball rewards');return{player_id,attended_sessions:r.data as number};}));
        const results = await Promise.all([
          Promise.resolve(allowed),
          db.from("player_achievements").select("id,player_id,title,description,awarded_on,badge_id").in("player_id", ids).order("awarded_on", { ascending: false }).order("created_at", { ascending: false }),
          db.from("player_training_assignments").select(assignmentFields).in("player_id", ids).order("created_at", { ascending: false }),
          db.from("coaching_development_goals").select("id,player_id,goal,status").in("player_id", ids),
          db.from("family_session_schedule").select(sessionFields).in("player_id", ids).gte("ends_at", new Date().toISOString()).order("starts_at"),
          db.from("coaching_idp_assessments").select("id,player_id,category,rating,assessed_on").in("player_id", ids).order("assessed_on", { ascending: false }),
          db.from("family_monthly_reports").select("id,player_id,review_month,strengths,development_areas,next_steps").in("player_id", ids).order("review_month", { ascending: false }),
          db.from("player_space_profiles").select("*").in("player_id", ids),
          db.from("player_personal_goals").select("id,player_id,goal,target_date,status").in("player_id", ids).order("created_at", { ascending: false }),
          db.from("player_award_receipts").select("achievement_id").eq("guardian_id", currentUserId),
          db.from("player_cosmetic_unlocks").select("player_id,cosmetic,unlocked_at").in("player_id",ids),
          readHistoryPages((from,to)=>db!.from("player_goal_events").select("id,player_id,source_id,source,kind,goal,occurred_at").in("player_id",ids).order("occurred_at",{ascending:false}).order("id").range(from,to)),
          loadPortalFeatures(ids,currentUserId).then(data=>({data,error:null}))
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
          setData(current => ({ ...results[12].data, ballProgress, players: results[0].data || [], awards: results[1].data || [], assignments: results[2].data || [], goals: results[3].data || [], sessions: results[4].data || [], assessments: results[5].data || [], reports: results[6].data || [], profiles:profileVersion===profileWrites.current?profiles:current.profiles, personalGoals: results[8].data || [], celebrated: (results[9].data || []).map(value => value.achievement_id), unlocks:results[10].data || [], goalEvents:results[11].data || [], diary: diaryRows, feedback: feedbackRows } as SpaceData));
          setLoadedUserId(currentUserId);
        }
      } catch { if (active) { setError("We couldn’t load your player space. Please try again."); setFailed(!data.players.length); setLoadedUserId(currentUserId); } }
    })();
    return () => { active = false; };
  }, [user?.id, revision]);

  useEffect(()=>{
    if(!user)return;
    const refresh=()=>{if(document.visibilityState==='visible')setRevision(v=>v+1);};
    const timer=data.players.length?window.setInterval(refresh,45000):null;window.addEventListener('focus',refresh);
    return()=>{if(timer!==null)window.clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[user?.id,data.players.length]);

  useEffect(() => {
    if (!db || !user) return;
    let active=true;
    const timer = window.setInterval(() => {
      void Promise.all(data.profiles.filter(p=>p.photo_path).map(async profile => {
        const result = await db!.storage.from("player-card-photos").createSignedUrl(profile.photo_path!, 3600);
        if(active && result.data) setData(current=>({...current,profiles:current.profiles.map(p=>p.player_id===profile.player_id&&p.photo_path===profile.photo_path?{...p,photo_url:result.data.signedUrl}:p)}));
      })).catch(()=>{});
    }, 30 * 60 * 1000);
    return () => { active=false; window.clearInterval(timer); };
  }, [user?.id, data.profiles]);

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
      profileWrites.current++;
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

  function assertPlayer(playerId:string){if(!db||!user||loadedUserId!==user.id||!data.players.some(p=>p.id===playerId))throw new Error("Please refresh your player access.");}
  async function refreshFeatures(){if(!db||!user)return;const extra=await loadPortalFeatures(data.players.map(p=>p.id),user.id);setData(current=>({...current,...extra}));}
  const featureActions:PortalFeatureActions={
    onSavePreparation:async(playerId,sessionId,help,kit)=>{assertPlayer(playerId);const session=data.sessions.find(s=>s.id===sessionId&&s.player_id===playerId);if(!session||kit.some(k=>!session.kit_list.includes(k)))throw new Error("Check this session's kit list.");const value={help_request:help,checked_kit:kit,updated_by:user!.id,updated_at:new Date().toISOString()};const old=data.preparations.some(p=>p.session_id===sessionId);const r=old?await db!.from('player_session_preparation').update(value).eq('session_id',sessionId).eq('player_id',playerId):await db!.from('player_session_preparation').insert({...value,session_id:sessionId,player_id:playerId});if(r.error)throw new Error("Preparation couldn’t be saved.");await refreshFeatures().catch(()=>{});},
    onSendMessage:async(playerId,body)=>{assertPlayer(playerId);const r=await db!.from('player_space_messages').insert({player_id:playerId,sender_id:user!.id,sender_role:actorRole,body});if(r.error)throw new Error("Your message couldn’t be sent.");await refreshFeatures().catch(()=>{});},
    onSaveMatchPlan:async(playerId,date,items)=>{assertPlayer(playerId);const fields={checked_items:items,updated_by:user!.id};const old=data.matchPlans.some(p=>p.player_id===playerId&&p.match_date===date);const r=old?await db!.from('player_match_plans').update(fields).eq('player_id',playerId).eq('match_date',date):await db!.from('player_match_plans').insert({...fields,player_id:playerId,match_date:date});if(r.error)throw new Error("Checklist couldn’t be saved.");await refreshFeatures().catch(()=>{});},
    onSaveMatch:async(playerId,value,id)=>{assertPlayer(playerId);const fields={match_date:value.match_date,opponent:value.opponent.trim(),positions:value.positions,minutes:value.minutes,things_tried:value.things_tried.trim(),proud_moment:value.proud_moment.trim(),lessons:value.lessons.trim(),updated_at:new Date().toISOString()};const r=id?await db!.from('player_match_journal').update(fields).eq('id',id).eq('player_id',playerId):await db!.from('player_match_journal').insert({...fields,player_id:playerId,created_by:user!.id});if(r.error)throw new Error("Match reflection couldn’t be saved.");await refreshFeatures().catch(()=>{});},
    onLearningProgress:async(playerId,lessonId,complete)=>{assertPlayer(playerId);const r=complete?await db!.from('player_learning_progress').upsert({player_id:playerId,lesson_id:lessonId,completed_by:user!.id},{onConflict:'player_id,lesson_id',ignoreDuplicates:true}):await db!.from('player_learning_progress').delete().eq('player_id',playerId).eq('lesson_id',lessonId);if(r.error)throw new Error("Learning progress couldn’t be saved.");await refreshFeatures().catch(()=>{});},
    onReadNotifications:async ids=>{if(!db||!user||ids.some(id=>!data.notifications.some(n=>n.id===id)))throw new Error("Please refresh updates.");const r=await db.from('player_notification_reads').upsert(ids.map(id=>({user_id:user.id,notification_id:id})),{onConflict:'user_id,notification_id',ignoreDuplicates:true});if(r.error)throw new Error("Could not mark updates as read.");setData(current=>({...current,notificationReads:[...new Set([...current.notificationReads,...ids])]}));},
    onShareAward:async(playerId,awardId,share)=>{assertPlayer(playerId);if(!data.awards.some(a=>a.id===awardId&&a.player_id===playerId))throw new Error("Choose one of your own awards.");const r=share?await db!.from('player_shared_awards').upsert({achievement_id:awardId,player_id:playerId,shared_by:user!.id},{onConflict:'achievement_id',ignoreDuplicates:true}):await db!.from('player_shared_awards').delete().eq('achievement_id',awardId).eq('player_id',playerId);if(r.error)throw new Error("Sharing choice couldn’t be saved.");await refreshFeatures().catch(()=>{});},
    onSaveAlias:async(playerId,alias)=>{assertPlayer(playerId);const fields={alias,updated_by:user!.id};const old=data.showcases.some(s=>s.player_id===playerId);const r=old?await db!.from('player_showcase_settings').update(fields).eq('player_id',playerId):await db!.from('player_showcase_settings').insert({...fields,player_id:playerId});if(r.error)throw new Error("Sharing name couldn’t be saved.");await refreshFeatures().catch(()=>{});}
  };

  async function signOut() {
    if (!db) return;
    if(user)await removeDevicePush(user.id);
    const result = await db.auth.signOut();
    if (result.error) throw result.error;
    setData(emptySpaceData); setUser(null); setError("");
  }

  if (!recovering && ready && user && loadedUserId === user.id && !failed && data.players.length) return <PlayerSpace {...featureActions} actorRole={actorRole} syncError={error} key={user.id} userKey={user.id} data={data} onSavePractice={savePractice} onUpdateProfile={updateProfile} onSaveGoal={saveGoal} onCelebrate={celebrate} onRefresh={() => setRevision(value => value + 1)} onSignOut={signOut}/>;

  return <div className="player-space-shell"><div className="ps-shell-inner"><PlayerSpaceHeader/><div className="ps-welcome-grid"><PlayerSpaceHero compact/><section className="ps-welcome-panel ps-paper">
    {!ready?<p role="status">Checking your account…</p>:!db?<><h2>Your space is taking a breather.</h2><p>Please try again soon.</p></>:<PlayerAccess key={revision+":"+(user?.id||"signed-out")} user={user} recovering={recovering} onRecovered={()=>setRecovering(false)} onRefresh={()=>setRevision(v=>v+1)} onSignOut={signOut} error={error} failed={failed} loading={!!user&&loadedUserId!==user.id}/>}

  </section></div><footer className="ps-footer"><span>DEVELOP. BELIEVE. ACHIEVE.</span><Link href="/privacy">Privacy & support ↗</Link></footer></div></div>;
}

