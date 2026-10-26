-- Player activation requires an invitation from an approved guardian and acceptance
-- by the verified player account. User-editable auth metadata is never authority.
create table public.player_account_links (
 user_id uuid primary key references auth.users(id) on delete cascade,
 player_id uuid not null unique references public.coaching_players(id) on delete cascade,
 approved_by uuid not null references auth.users(id),created_at timestamptz not null default now()
);
create index player_account_links_approver_idx on public.player_account_links(approved_by);
alter table public.player_account_links enable row level security;
revoke all on public.player_account_links from anon,authenticated;
grant select,delete on public.player_account_links to authenticated;
create policy player_account_read on public.player_account_links for select to authenticated using(user_id=(select auth.uid()) or star_private.is_player_family(player_id) or star_private.is_staff_manager());
create policy player_account_revoke on public.player_account_links for delete to authenticated using(star_private.is_player_family(player_id) or star_private.is_staff_manager());

create function star_private.is_player(target_player uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.player_account_links a join public.guardian_player_links l on l.player_id=a.player_id and l.guardian_id=a.approved_by where a.user_id=auth.uid() and a.player_id=target_player)
$$;
revoke all on function star_private.is_player(uuid) from public,anon;
grant execute on function star_private.is_player(uuid) to authenticated;
create function star_private.can_use_player(target_player uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select star_private.is_player_family(target_player) or star_private.is_player(target_player)
$$;
revoke all on function star_private.can_use_player(uuid) from public,anon;
grant execute on function star_private.can_use_player(uuid) to authenticated;

create table public.player_account_invites (
 id uuid primary key default gen_random_uuid(),player_id uuid not null references public.coaching_players(id) on delete cascade,
 player_user_id uuid not null references auth.users(id) on delete cascade,guardian_id uuid not null references auth.users(id),
 status text not null default 'pending' check(status in ('pending','accepted','cancelled')),created_at timestamptz not null default now(),
 check(player_user_id<>guardian_id)
);
create unique index player_invite_pending_idx on public.player_account_invites(player_id,player_user_id) where status='pending';
create index player_invite_user_idx on public.player_account_invites(player_user_id);
create index player_invite_guardian_idx on public.player_account_invites(guardian_id);
alter table public.player_account_invites enable row level security;
revoke all on public.player_account_invites from anon,authenticated;
grant select,insert on public.player_account_invites to authenticated;
grant update(status) on public.player_account_invites to authenticated;
create policy player_invite_read on public.player_account_invites for select to authenticated using(player_user_id=(select auth.uid()) or star_private.is_player_family(player_id));
create policy player_invite_create on public.player_account_invites for insert to authenticated with check(guardian_id=(select auth.uid()) and star_private.is_player_family(player_id) and status='pending' and not exists(select 1 from public.player_account_links a where a.player_id=player_account_invites.player_id));
create policy player_invite_cancel on public.player_account_invites for update to authenticated using(status='pending' and (player_user_id=(select auth.uid()) or star_private.is_player_family(player_id))) with check(status='cancelled');
create function star_private.accept_player_invite(invitation uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v public.player_account_invites; begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Verify your player email first' using errcode='42501'; end if;
 if exists(select 1 from public.staff_members where user_id=auth.uid() and active) or exists(select 1 from public.guardian_player_links where guardian_id=auth.uid()) then raise exception 'Use a separate player account' using errcode='42501'; end if;
 select * into v from public.player_account_invites where id=invitation and player_user_id=auth.uid() and status='pending' for update;
 if v.id is null or not exists(select 1 from public.guardian_player_links where guardian_id=v.guardian_id and player_id=v.player_id) then raise exception 'Invitation is no longer available' using errcode='42501'; end if;
 insert into public.player_account_links(user_id,player_id,approved_by) values(auth.uid(),v.player_id,v.guardian_id);
 update public.player_account_invites set status='accepted' where id=v.id;
 return v.player_id;
end $$;
revoke all on function star_private.accept_player_invite(uuid) from public,anon;
grant execute on function star_private.accept_player_invite(uuid) to authenticated;
create function public.accept_player_invite(invitation uuid) returns uuid language sql security invoker set search_path='' as $$select star_private.accept_player_invite(invitation)$$;
revoke all on function public.accept_player_invite(uuid) from public,anon;
grant execute on function public.accept_player_invite(uuid) to authenticated;

-- Player access is added alongside existing staff/family rules.
create policy own_player_read on public.coaching_players for select to authenticated using(star_private.is_player(id));
create policy player_account_read on public.player_achievements for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.player_training_assignments for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.coaching_development_goals for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.coaching_idp_assessments for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.family_session_schedule for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.family_monthly_reports for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.player_space_profiles for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.player_personal_goals for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.player_cosmetic_unlocks for select to authenticated using(star_private.is_player(player_id));
create policy player_account_read on public.player_goal_events for select to authenticated using(star_private.is_player(player_id));
create policy player_profile_insert on public.player_space_profiles for insert to authenticated with check(star_private.is_player(player_id) and updated_by=(select auth.uid()));
create policy player_profile_update on public.player_space_profiles for update to authenticated using(star_private.is_player(player_id)) with check(star_private.is_player(player_id) and updated_by=(select auth.uid()));
create policy player_goal_insert on public.player_personal_goals for insert to authenticated with check(star_private.is_player(player_id) and created_by=(select auth.uid()));
create policy player_goal_update on public.player_personal_goals for update to authenticated using(star_private.is_player(player_id)) with check(star_private.is_player(player_id));
create policy player_receipt_read on public.player_award_receipts for select to authenticated using(guardian_id=(select auth.uid()) and exists(select 1 from public.player_achievements a where a.id=achievement_id and star_private.is_player(a.player_id)));
create policy player_receipt_insert on public.player_award_receipts for insert to authenticated with check(guardian_id=(select auth.uid()) and exists(select 1 from public.player_achievements a where a.id=achievement_id and star_private.is_player(a.player_id)));
-- guardian_id is the legacy recorder column; it references auth.users and now
-- stores either an approved guardian or the activated player's account ID.
create policy player_diary_insert on public.player_training_diary for insert to authenticated with check(guardian_id=(select auth.uid()) and practice_date<=(now() at time zone 'Europe/London')::date and exists(select 1 from public.player_training_assignments a where a.id=assignment_id and star_private.is_player(a.player_id)));
drop policy diary_read on public.player_training_diary;
create policy diary_read on public.player_training_diary for select to authenticated using(exists(select 1 from public.player_training_assignments a where a.id=assignment_id and (star_private.can_coach_player(a.player_id) or star_private.can_use_player(a.player_id))));
drop policy feedback_read on public.player_training_feedback;
create policy feedback_read on public.player_training_feedback for select to authenticated using(exists(select 1 from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where d.id=diary_id and (star_private.can_coach_player(a.player_id) or star_private.can_use_player(a.player_id))));
create policy player_account_photo_read on storage.objects for select to authenticated using(bucket_id='player-card-photos' and exists(select 1 from public.player_account_links a where a.user_id=(select auth.uid()) and a.player_id::text=(storage.foldername(name))[1] and star_private.is_player(a.player_id)));
create policy player_account_photo_upload on storage.objects for insert to authenticated with check(bucket_id='player-card-photos' and exists(select 1 from public.player_account_links a where a.user_id=(select auth.uid()) and a.player_id::text=(storage.foldername(name))[1] and star_private.is_player(a.player_id)) and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$');
create policy player_account_photo_delete on storage.objects for delete to authenticated using(bucket_id='player-card-photos' and exists(select 1 from public.player_account_links a where a.user_id=(select auth.uid()) and a.player_id::text=(storage.foldername(name))[1] and star_private.is_player(a.player_id)));

alter table public.player_space_profiles
 add column experience text not null default 'junior' check(experience in ('junior','senior')),
 add column preferred_positions text[] not null default '{}' check(cardinality(preferred_positions)<=4 and preferred_positions<@array['Goalkeeper','Defender','Midfielder','Forward']),
 add column stronger_foot text not null default '' check(stronger_foot in ('','Left','Right','Both')),
 add column favourite_footballer text not null default '' check(length(favourite_footballer)<=100),
 add column favourite_team text not null default '' check(length(favourite_team)<=100),
 add column playing_teams text not null default '' check(length(playing_teams)<=200),
 add column school text not null default '' check(length(school)<=100);
grant update(experience,preferred_positions,stronger_foot,favourite_footballer,favourite_team,playing_teams,school) on public.player_space_profiles to authenticated;
alter table public.family_session_schedule add column coach_focus text check(length(coach_focus)<=500),add column kit_list text[] not null default array['Football kit','Boots','Shin pads','Water bottle','Weather-appropriate layers'] check(cardinality(kit_list)<=12 and length(array_to_string(kit_list,''))<=600);
grant update(coach_focus,kit_list) on public.family_session_schedule to authenticated;
create policy coach_schedule_read on public.family_session_schedule for select to authenticated using(star_private.can_coach_player(player_id));
create policy coach_schedule_focus on public.family_session_schedule for update to authenticated using(star_private.can_coach_player(player_id)) with check(star_private.can_coach_player(player_id));
create function star_private.limit_session_focus_edit() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if auth.uid() is not null and not star_private.is_staff_manager() and (to_jsonb(new)-array['coach_focus','kit_list']) is distinct from (to_jsonb(old)-array['coach_focus','kit_list']) then raise exception 'Only managers can change published session details' using errcode='42501'; end if; return new; end $$;
revoke all on function star_private.limit_session_focus_edit() from public,anon,authenticated;
create trigger limit_session_focus before update on public.family_session_schedule for each row execute function star_private.limit_session_focus_edit();

create table public.player_session_preparation (
 session_id uuid primary key references public.family_session_schedule(id) on delete cascade,
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 help_request text not null default '' check(length(help_request)<=500),checked_kit text[] not null default '{}' check(cardinality(checked_kit)<=12),
 updated_by uuid not null references auth.users(id),updated_at timestamptz not null default now()
);
create index session_preparation_player_idx on public.player_session_preparation(player_id);
alter table public.player_session_preparation enable row level security;
revoke all on public.player_session_preparation from anon,authenticated;
grant select,insert on public.player_session_preparation to authenticated;
grant update(help_request,checked_kit,updated_by,updated_at) on public.player_session_preparation to authenticated;
create policy session_preparation_read on public.player_session_preparation for select to authenticated using(star_private.can_use_player(player_id) or star_private.can_coach_player(player_id));
create policy session_preparation_insert on public.player_session_preparation for insert to authenticated with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()) and exists(select 1 from public.family_session_schedule s where s.id=session_id and s.player_id=player_session_preparation.player_id));
create policy session_preparation_update on public.player_session_preparation for update to authenticated using(star_private.can_use_player(player_id)) with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()));

create table public.player_coach_notes (
 id uuid primary key default gen_random_uuid(),player_id uuid not null references public.coaching_players(id) on delete cascade,
 week_start date not null check(extract(isodow from week_start)=1),body text not null check(length(btrim(body)) between 1 and 1500),
 published_by uuid not null references auth.users(id),updated_at timestamptz not null default now(),unique(player_id,week_start)
);
create index player_coach_notes_author_idx on public.player_coach_notes(published_by);
alter table public.player_coach_notes enable row level security;
revoke all on public.player_coach_notes from anon,authenticated;
grant select,insert on public.player_coach_notes to authenticated;
grant update(body,published_by,updated_at) on public.player_coach_notes to authenticated;
create policy weekly_note_read on public.player_coach_notes for select to authenticated using(star_private.can_use_player(player_id) or star_private.can_coach_player(player_id));
create policy weekly_note_insert on public.player_coach_notes for insert to authenticated with check(star_private.can_coach_player(player_id) and published_by=(select auth.uid()));
create policy weekly_note_update on public.player_coach_notes for update to authenticated using(star_private.can_coach_player(player_id)) with check(star_private.can_coach_player(player_id) and published_by=(select auth.uid()));

create table public.player_space_messages (
 id uuid primary key default gen_random_uuid(),player_id uuid not null references public.coaching_players(id) on delete cascade,
 sender_id uuid not null references auth.users(id),sender_role text not null check(sender_role in ('player','guardian','coach')),
 body text not null check(length(btrim(body)) between 1 and 1500),created_at timestamptz not null default now()
);
create index player_space_messages_player_time_idx on public.player_space_messages(player_id,created_at);
create index player_space_messages_sender_idx on public.player_space_messages(sender_id);
alter table public.player_space_messages enable row level security;
revoke all on public.player_space_messages from anon,authenticated;
grant select,insert on public.player_space_messages to authenticated;
create policy space_message_read on public.player_space_messages for select to authenticated using(star_private.can_use_player(player_id) or star_private.can_coach_player(player_id));
create policy space_message_insert on public.player_space_messages for insert to authenticated with check(sender_id=(select auth.uid()) and ((sender_role='player' and star_private.is_player(player_id)) or(sender_role='guardian' and star_private.is_player_family(player_id)) or(sender_role='coach' and star_private.can_coach_player(player_id))));

create table public.player_match_plans (
 player_id uuid not null references public.coaching_players(id) on delete cascade,match_date date not null,
 checked_items text[] not null default '{}' check(checked_items<@array['kit','boots','shin-pads','water','layers','travel']),
 updated_by uuid not null references auth.users(id),primary key(player_id,match_date)
);
alter table public.player_match_plans enable row level security;
revoke all on public.player_match_plans from anon,authenticated;
grant select,insert on public.player_match_plans to authenticated;
grant update(checked_items,updated_by) on public.player_match_plans to authenticated;
create policy match_plan_read on public.player_match_plans for select to authenticated using(star_private.can_use_player(player_id));
create policy match_plan_insert on public.player_match_plans for insert to authenticated with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()));
create policy match_plan_update on public.player_match_plans for update to authenticated using(star_private.can_use_player(player_id)) with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()));
create table public.player_match_journal (
 id uuid primary key default gen_random_uuid(),player_id uuid not null references public.coaching_players(id) on delete cascade,
 match_date date not null check(match_date<=(now() at time zone 'Europe/London')::date),opponent text not null default '' check(length(opponent)<=80),
 positions text[] not null default '{}' check(cardinality(positions)<=4 and positions<@array['Goalkeeper','Defender','Midfielder','Forward']),
 minutes smallint not null check(minutes between 0 and 150),things_tried text not null default '' check(length(things_tried)<=1000),
 proud_moment text not null default '' check(length(proud_moment)<=1000),lessons text not null default '' check(length(lessons)<=1000),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index player_match_journal_player_date_idx on public.player_match_journal(player_id,match_date desc);
alter table public.player_match_journal enable row level security;
revoke all on public.player_match_journal from anon,authenticated;
grant select,insert on public.player_match_journal to authenticated;
grant update(match_date,opponent,positions,minutes,things_tried,proud_moment,lessons,updated_at) on public.player_match_journal to authenticated;
create policy match_journal_read on public.player_match_journal for select to authenticated using(star_private.can_use_player(player_id) or star_private.can_coach_player(player_id));
create policy match_journal_insert on public.player_match_journal for insert to authenticated with check(star_private.can_use_player(player_id) and created_by=(select auth.uid()));
create policy match_journal_update on public.player_match_journal for update to authenticated using(star_private.can_use_player(player_id)) with check(star_private.can_use_player(player_id));

create table public.player_learning_progress (
 player_id uuid not null references public.coaching_players(id) on delete cascade,lesson_id text not null check(length(lesson_id) between 1 and 100),
 completed_by uuid not null references auth.users(id),completed_at timestamptz not null default now(),primary key(player_id,lesson_id)
);
alter table public.player_learning_progress enable row level security;
revoke all on public.player_learning_progress from anon,authenticated;
grant select,insert,delete on public.player_learning_progress to authenticated;
create policy learning_read on public.player_learning_progress for select to authenticated using(star_private.can_use_player(player_id));
create policy learning_insert on public.player_learning_progress for insert to authenticated with check(star_private.can_use_player(player_id) and completed_by=(select auth.uid()));
create policy learning_reset on public.player_learning_progress for delete to authenticated using(star_private.can_use_player(player_id));

-- Sharing is limited to explicitly managed teammate groups and chosen awards.
create table public.player_sharing_groups(id uuid primary key default gen_random_uuid(),name text not null check(length(btrim(name)) between 1 and 80),created_by uuid not null references auth.users(id));
create table public.player_sharing_members(group_id uuid references public.player_sharing_groups(id) on delete cascade,player_id uuid references public.coaching_players(id) on delete cascade,primary key(group_id,player_id));
create index player_sharing_members_player_idx on public.player_sharing_members(player_id);
create table public.player_showcase_settings(player_id uuid primary key references public.coaching_players(id) on delete cascade,alias text not null default 'STAR player' check(length(btrim(alias)) between 1 and 30),updated_by uuid not null references auth.users(id));
create table public.player_shared_awards(achievement_id uuid primary key references public.player_achievements(id) on delete cascade,player_id uuid not null references public.coaching_players(id) on delete cascade,shared_by uuid not null references auth.users(id),created_at timestamptz not null default now());
create index player_shared_awards_player_idx on public.player_shared_awards(player_id);
alter table public.player_sharing_groups enable row level security;
revoke all on public.player_sharing_groups from anon,authenticated;
alter table public.player_sharing_members enable row level security;
revoke all on public.player_sharing_members from anon,authenticated;
alter table public.player_showcase_settings enable row level security;
revoke all on public.player_showcase_settings from anon,authenticated;
alter table public.player_shared_awards enable row level security;
revoke all on public.player_shared_awards from anon,authenticated;
grant select,insert,delete on public.player_sharing_groups,public.player_sharing_members to authenticated;
create policy sharing_group_read on public.player_sharing_groups for select to authenticated using(star_private.is_staff_manager() or exists(select 1 from public.player_sharing_members m where m.group_id=id and star_private.can_use_player(m.player_id)));
create policy sharing_group_insert on public.player_sharing_groups for insert to authenticated with check(star_private.is_staff_manager() and created_by=(select auth.uid()));
create policy sharing_group_delete on public.player_sharing_groups for delete to authenticated using(star_private.is_staff_manager());
create policy sharing_members_read on public.player_sharing_members for select to authenticated using(star_private.is_staff_manager() or star_private.can_use_player(player_id));
create policy sharing_members_insert on public.player_sharing_members for insert to authenticated with check(star_private.is_staff_manager());
create policy sharing_members_delete on public.player_sharing_members for delete to authenticated using(star_private.is_staff_manager());
grant select,insert on public.player_showcase_settings to authenticated;
grant update(alias,updated_by) on public.player_showcase_settings to authenticated;
create policy showcase_read on public.player_showcase_settings for select to authenticated using(star_private.can_use_player(player_id));
create policy showcase_insert on public.player_showcase_settings for insert to authenticated with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()));
create policy showcase_update on public.player_showcase_settings for update to authenticated using(star_private.can_use_player(player_id)) with check(star_private.can_use_player(player_id) and updated_by=(select auth.uid()));
grant select,insert,delete on public.player_shared_awards to authenticated;
create policy shared_award_read on public.player_shared_awards for select to authenticated using(star_private.can_use_player(player_id));
create policy shared_award_insert on public.player_shared_awards for insert to authenticated with check(star_private.can_use_player(player_id) and shared_by=(select auth.uid()) and exists(select 1 from public.player_achievements a where a.id=achievement_id and a.player_id=player_shared_awards.player_id));
create policy shared_award_delete on public.player_shared_awards for delete to authenticated using(star_private.can_use_player(player_id));
create function star_private.shared_trophy_feed(viewer uuid) returns table(achievement_id uuid,alias text,title text,badge_id text,awarded_on date) language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not star_private.can_use_player(viewer) then raise exception 'No player access' using errcode='42501'; end if;
 return query select a.id,coalesce(s.alias,'STAR player'),a.title,a.badge_id,a.awarded_on from public.player_shared_awards w join public.player_achievements a on a.id=w.achievement_id and a.player_id=w.player_id left join public.player_showcase_settings s on s.player_id=w.player_id where exists(select 1 from public.player_sharing_members mine join public.player_sharing_members teammate on teammate.group_id=mine.group_id where mine.player_id=viewer and teammate.player_id=w.player_id) order by w.created_at desc limit 200;
end $$;
revoke all on function star_private.shared_trophy_feed(uuid) from public,anon;
grant execute on function star_private.shared_trophy_feed(uuid) to authenticated;
create function public.shared_trophy_feed(viewer uuid) returns table(achievement_id uuid,alias text,title text,badge_id text,awarded_on date) language sql security invoker set search_path='' as $$select * from star_private.shared_trophy_feed(viewer)$$;
revoke all on function public.shared_trophy_feed(uuid) from public,anon;
grant execute on function public.shared_trophy_feed(uuid) to authenticated;
CREATE OR REPLACE FUNCTION star_private.refresh_player_cosmetics(target_player uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare days_count integer; badges_count integer; goals_count integer;
begin
 if auth.uid() is not null and not (star_private.can_use_player(target_player) or star_private.can_coach_player(target_player)) then raise exception 'Unlinked cosmetic source' using errcode='42501'; end if;
 select count(distinct d.practice_date) into days_count from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where a.player_id=target_player and d.minutes>0;
 select count(*) into badges_count from public.player_achievements where player_id=target_player and badge_id is not null;
 select count(*) into goals_count from public.player_personal_goals where player_id=target_player and status='achieved';
 insert into public.player_cosmetic_unlocks(player_id,cosmetic)
 select target_player,reward from (values
 ('avatar-captain',badges_count>=1),('avatar-comet',days_count>=3),('avatar-shield',goals_count>=1),
 ('decoration-lightning',days_count>=3),('decoration-laurel',badges_count>=3),('decoration-starburst',goals_count>=1)
 ) rewards(reward,earned) where earned on conflict do nothing;
end $function$
;
CREATE OR REPLACE FUNCTION star_private.award_player_cosmetics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare target_player uuid;
begin
 if tg_table_schema<>'public' then raise exception 'Unsupported cosmetic source'; end if;
 if tg_table_name='player_training_diary' then
  select player_id into target_player from public.player_training_assignments where id=new.assignment_id;
 elsif tg_table_name in ('player_achievements','player_personal_goals') then target_player:=new.player_id;
 else raise exception 'Unsupported cosmetic source'; end if;
 if auth.uid() is not null and not (star_private.can_use_player(target_player) or star_private.can_coach_player(target_player)) then raise exception 'Unlinked cosmetic source' using errcode='42501'; end if;
 perform star_private.refresh_player_cosmetics(target_player);
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION star_private.record_player_goal_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare event_kind text; origin text;
begin
 if tg_table_schema<>'public' or tg_table_name not in ('player_personal_goals','coaching_development_goals') then raise exception 'Unsupported goal source'; end if;
 if auth.uid() is not null and not (star_private.can_use_player(new.player_id) or star_private.can_coach_player(new.player_id)) then raise exception 'Unlinked goal source' using errcode='42501'; end if;
 origin:=case when tg_table_name='player_personal_goals' then 'personal' else 'coach' end;
 if tg_op='INSERT' then event_kind:='set';
 elsif new.status is not distinct from old.status and new.goal is not distinct from old.goal then return new;
 elsif new.status is distinct from old.status then
  event_kind:=case when new.status='achieved' then 'achieved' when new.status='archived' then 'archived' when old.status in ('achieved','archived') then 'reopened' else 'updated' end;
 else event_kind:='updated'; end if;
 insert into public.player_goal_events(player_id,source_id,source,kind,goal) values(new.player_id,new.id,origin,event_kind,new.goal);
 return new;
end $function$
;

create table public.player_notifications (
 id uuid primary key default gen_random_uuid(),player_id uuid not null references public.coaching_players(id) on delete cascade,
 category text not null check(category in ('message','practice','session','goal','badge','cosmetic')),title text not null check(length(title)<=200),
 body text not null,tab text not null check(tab in ('home','training','journey','trophies','messages','learn')),
 source_key text not null,created_at timestamptz not null default now(),unique(player_id,source_key)
);
create index player_notifications_player_time_idx on public.player_notifications(player_id,created_at desc);
alter table public.player_notifications enable row level security;
revoke all on public.player_notifications from anon,authenticated;
grant select on public.player_notifications to authenticated;
create policy notification_read on public.player_notifications for select to authenticated using(star_private.can_use_player(player_id));
create table public.player_notification_reads (
 user_id uuid not null references auth.users(id) on delete cascade,notification_id uuid not null references public.player_notifications(id) on delete cascade,
 read_at timestamptz not null default now(),primary key(user_id,notification_id)
);
create index player_notification_reads_notification_idx on public.player_notification_reads(notification_id);
alter table public.player_notification_reads enable row level security;
revoke all on public.player_notification_reads from anon,authenticated;
grant select,insert on public.player_notification_reads to authenticated;
create policy notification_receipt_read on public.player_notification_reads for select to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.player_notifications n where n.id=notification_id and star_private.can_use_player(n.player_id)));
create policy notification_receipt_insert on public.player_notification_reads for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.player_notifications n where n.id=notification_id and star_private.can_use_player(n.player_id)));
create function star_private.notify_player_update() returns trigger language plpgsql security definer set search_path='' as $$
declare pid uuid; category_name text; heading text; detail text; destination text; source text;
begin
 if tg_table_schema<>'public' then raise exception 'Unsupported notification source'; end if;
 if tg_table_name='player_training_feedback' then
  select a.player_id into pid from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where d.id=new.diary_id;
  category_name:='message';heading:='Your coach left practice feedback';detail:='Open your practice diary to read it.';destination:='training';source:='feedback:'||new.diary_id::text||':'||md5(new.feedback);
 elsif tg_table_name='player_space_messages' then
  if new.sender_role<>'coach' then return new; end if;
  pid:=new.player_id;category_name:='message';heading:='A new message from your coach';detail:='Your linked parent or guardian can read the conversation too.';destination:='messages';source:='message:'||new.id;
 elsif tg_table_name='player_coach_notes' then
  pid:=new.player_id;category_name:='message';heading:='Your weekly coach message is ready';detail:='Open your inbox to read this week’s encouragement and focus.';destination:='messages';source:='note:'||new.id||':'||md5(new.body);
 elsif tg_table_name='player_training_assignments' then
  pid:=new.player_id;category_name:='practice';heading:=case when tg_op='INSERT' then 'New coach-assigned practice' else 'Your practice plan was updated' end;detail:=new.title;destination:='training';source:='practice:'||new.id||':'||md5(to_jsonb(new)::text);
 elsif tg_table_name='family_session_schedule' then
  pid:=new.player_id;category_name:='session';heading:=case when tg_op='INSERT' then 'Your next session is ready' else 'Your session details changed' end;detail:=new.title;destination:='home';source:='session:'||new.id||':'||md5(to_jsonb(new)::text);
 elsif tg_table_name='player_goal_events' then
  pid:=new.player_id;category_name:='goal';heading:=case when new.kind='achieved' then 'A goal worth celebrating' else 'Your goals have an update' end;detail:=new.goal;destination:='journey';source:='goal:'||new.id;
 elsif tg_table_name='player_achievements' then
  pid:=new.player_id;category_name:='badge';heading:='Your coach recognised your progress';detail:=new.title;destination:='trophies';source:='award:'||new.id;
 elsif tg_table_name='player_cosmetic_unlocks' then
  pid:=new.player_id;category_name:='cosmetic';heading:='You unlocked a new extra';detail:='Find your new avatar or decoration in Style my space.';destination:='home';source:='cosmetic:'||pid||':'||new.cosmetic;
 else raise exception 'Unsupported notification source'; end if;
 if auth.uid() is not null and not (star_private.can_use_player(pid) or star_private.can_coach_player(pid)) then raise exception 'No notification source access' using errcode='42501'; end if;
 insert into public.player_notifications(player_id,category,title,body,tab,source_key) values(pid,category_name,heading,detail,destination,source) on conflict do nothing;
 return new;
end $$;
revoke all on function star_private.notify_player_update() from public,anon,authenticated;
create trigger notify_player_update after insert or update on public.player_training_feedback for each row execute function star_private.notify_player_update();
create trigger notify_player_update after insert on public.player_space_messages for each row execute function star_private.notify_player_update();
create trigger notify_player_update after insert or update on public.player_coach_notes for each row execute function star_private.notify_player_update();
create trigger notify_player_update after insert or update on public.player_training_assignments for each row execute function star_private.notify_player_update();
create trigger notify_player_update after insert or update on public.family_session_schedule for each row execute function star_private.notify_player_update();
create trigger notify_player_update after insert on public.player_goal_events for each row execute function star_private.notify_player_update();
create trigger notify_player_update after insert on public.player_achievements for each row execute function star_private.notify_player_update();
create trigger notify_player_update after insert on public.player_cosmetic_unlocks for each row execute function star_private.notify_player_update();
create function star_private.refresh_session_reminders(target_player uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null or not star_private.can_use_player(target_player) then raise exception 'No player access' using errcode='42501'; end if;
 insert into public.player_notifications(player_id,category,title,body,tab,source_key)
 select player_id,'session','Your session is coming up',title||' · '||to_char(starts_at at time zone 'Europe/London','Dy DD Mon HH24:MI'),'home','reminder:'||id||':'||starts_at::text from public.family_session_schedule where player_id=target_player and starts_at>=now() and starts_at<=now()+interval '24 hours' on conflict do nothing;
end $$;
revoke all on function star_private.refresh_session_reminders(uuid) from public,anon;
grant execute on function star_private.refresh_session_reminders(uuid) to authenticated;
create function public.refresh_session_reminders(target_player uuid) returns void language sql security invoker set search_path='' as $$select star_private.refresh_session_reminders(target_player)$$;
revoke all on function public.refresh_session_reminders(uuid) from public,anon;
grant execute on function public.refresh_session_reminders(uuid) to authenticated;
