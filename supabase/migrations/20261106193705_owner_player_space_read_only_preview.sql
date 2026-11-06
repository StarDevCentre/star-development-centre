-- Applied in STAR production as Supabase migration 20261106193705.
-- Owner-only, read-only snapshot of the live Player Space; no impersonation or elevated writes.
CREATE OR REPLACE FUNCTION public.owner_player_space_preview(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare viewer uuid := auth.uid(); account_id uuid; result jsonb;
begin
  if viewer is null
     or not exists(select 1 from public.staff_members where user_id=viewer and active=true and role='owner')
     or not exists(select 1 from public.coaching_players where id=p_player_id)
  then raise exception 'Owner preview unavailable.' using errcode='42501'; end if;
  select user_id into account_id from public.player_account_links where player_id=p_player_id order by created_at limit 1;
  select jsonb_build_object(
    'players',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,first_name,last_name,programme from public.coaching_players where id=p_player_id) x),
    'awards',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,title,description,awarded_on,badge_id from public.player_achievements where player_id=p_player_id order by awarded_on desc) x),
    'assignments',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,goal_id,title,instructions,target,due_date,created_at,week_start,practice_day,suggested_minutes,equipment,is_optional,coaching_points from public.player_training_assignments where player_id=p_player_id order by created_at desc) x),
    'diary',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select d.id,d.assignment_id,d.practice_date,d.minutes,d.reflection,d.created_at,d.confidence,d.enjoyment from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where a.player_id=p_player_id order by d.created_at desc) x),
    'feedback',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select f.diary_id,f.feedback,f.reviewed_at from public.player_training_feedback f join public.player_training_diary d on d.id=f.diary_id join public.player_training_assignments a on a.id=d.assignment_id where a.player_id=p_player_id order by f.reviewed_at desc) x),
    'goals',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,goal,status from public.coaching_development_goals where player_id=p_player_id) x),
    'sessions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,title,starts_at,ends_at,venue,coach_focus,kit_list from public.family_session_schedule where player_id=p_player_id and ends_at>=now() order by starts_at) x),
    'assessments',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,category,rating,assessed_on from public.coaching_idp_assessments where player_id=p_player_id order by assessed_on desc) x),
    'reports',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,review_month,strengths,development_areas,next_steps from public.family_monthly_reports where player_id=p_player_id order by review_month desc) x),
    'profiles',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select * from public.player_space_profiles where player_id=p_player_id) x),
    'personalGoals',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,goal,target_date,status from public.player_personal_goals where player_id=p_player_id order by created_at desc) x),
    'unlocks',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select player_id,cosmetic,unlocked_at from public.player_cosmetic_unlocks where player_id=p_player_id) x),
    'goalEvents',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,source_id,source,kind,goal,occurred_at from public.player_goal_events where player_id=p_player_id order by occurred_at desc) x),
    'squads',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select player_id,name,formation,footballers,captain,updated_at from public.player_squads where player_id=p_player_id) x),
    'preparations',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select session_id,player_id,help_request,checked_kit from public.player_session_preparation where player_id=p_player_id) x),
    'coachNotes',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,week_start,body,updated_at from public.player_coach_notes where player_id=p_player_id order by week_start desc) x),
    'messages',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,sender_id,sender_role,body,created_at from public.player_space_messages where player_id=p_player_id order by created_at) x),
    'matchPlans',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select player_id,match_date,checked_items from public.player_match_plans where player_id=p_player_id) x),
    'matchJournal',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,match_date,opponent,positions,minutes,things_tried,proud_moment,lessons,created_at from public.player_match_journal where player_id=p_player_id order by match_date desc) x),
    'learningProgress',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select player_id,lesson_id,completed_at from public.player_learning_progress where player_id=p_player_id) x),
    'notifications',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select id,player_id,category,title,body,tab,created_at from public.player_notifications where player_id=p_player_id order by created_at desc) x),
    'sharedAwards',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select achievement_id,player_id from public.player_shared_awards where player_id=p_player_id) x),
    'showcases',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select player_id,alias from public.player_showcase_settings where player_id=p_player_id) x),
    'sharingGroups',(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select g.id,g.name, array_agg(m.player_id) as player_ids from public.player_sharing_groups g join public.player_sharing_members m on m.group_id=g.id where exists(select 1 from public.player_sharing_members x where x.group_id=g.id and x.player_id=p_player_id) group by g.id,g.name) x),
    'ballProgress',jsonb_build_array(jsonb_build_object('player_id',p_player_id,'attended_sessions',(select count(*) from public.training_attendance a join public.training_sessions s on s.id=a.session_id where a.player_id=p_player_id and a.status in ('present','late') and s.ends_at<=now()))),
    'celebrated',(select coalesce(jsonb_agg(r.achievement_id),'[]'::jsonb) from public.player_award_receipts r join public.player_achievements a on a.id=r.achievement_id where r.guardian_id=account_id and a.player_id=p_player_id),
    'notificationReads',(select coalesce(jsonb_agg(n.notification_id),'[]'::jsonb) from public.player_notification_reads n join public.player_notifications pn on pn.id=n.notification_id where n.user_id=account_id and pn.player_id=p_player_id),
    'sharingFeed',jsonb_build_object(p_player_id::text,(select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (select a.id as achievement_id,coalesce(s.alias,'STAR player') as alias,a.title,a.badge_id,a.awarded_on from public.player_shared_awards w join public.player_achievements a on a.id=w.achievement_id and a.player_id=w.player_id left join public.player_showcase_settings s on s.player_id=w.player_id where exists(select 1 from public.player_sharing_members mine join public.player_sharing_members teammate on teammate.group_id=mine.group_id where mine.player_id=p_player_id and teammate.player_id=w.player_id) order by w.created_at desc limit 200) x))
  ) into result;
  return result;
end;
$function$

revoke all on function public.owner_player_space_preview(uuid) from public,anon;
grant execute on function public.owner_player_space_preview(uuid) to authenticated;

-- Owner may create expiring signed photo URLs for stored player card photos, never edit them.
drop policy if exists owner_preview_player_card_photo_read on storage.objects;
create policy owner_preview_player_card_photo_read on storage.objects for select to authenticated
using(bucket_id='player-card-photos' and exists(
 select 1 from public.staff_members s
 where s.user_id=(select auth.uid()) and s.active and s.role='owner'
));
