-- Player-owned preferences stay behind approved family links.
create function star_private.can_coach_player(target_player uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
 select star_private.is_staff_manager() or (star_private.is_active_staff() and exists (
 select 1 from public.coaching_assignments a where a.player_id=target_player and a.staff_user_id=(select auth.uid())))
$$;
create function star_private.is_player_family(target_player uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.guardian_player_links l where l.player_id=target_player and l.guardian_id=(select auth.uid()))
$$;
revoke all on function star_private.can_coach_player(uuid),star_private.is_player_family(uuid) from public,anon;
grant execute on function star_private.can_coach_player(uuid),star_private.is_player_family(uuid) to authenticated;

create table public.player_space_profiles (
 player_id uuid primary key references public.coaching_players(id) on delete cascade,
 accent text not null default 'navy' check(accent in ('navy','red','gold')),
 icon text not null default 'train' check(icon in ('train','ball','star')),
 motto text not null default 'Your game. Your journey.' check(length(motto) between 1 and 80),
 shirt_name text not null default '' check(length(shirt_name)<=30),
 shirt_number smallint check(shirt_number between 1 and 99),
 ambition text not null default '' check(length(ambition)<=500),
 photo_path text check(photo_path is null or (photo_path like player_id::text||'/%' and photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$')),
 cabinet_lights boolean not null default true,
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.player_space_profiles enable row level security;
revoke all on public.player_space_profiles from anon,authenticated;
grant select,insert on public.player_space_profiles to authenticated;
grant update(accent,icon,motto,shirt_name,shirt_number,ambition,photo_path,cabinet_lights,updated_by,updated_at) on public.player_space_profiles to authenticated;
create policy profile_read on public.player_space_profiles for select to authenticated using(star_private.is_player_family(player_id));
create policy profile_insert on public.player_space_profiles for insert to authenticated with check(star_private.is_player_family(player_id) and updated_by=(select auth.uid()));
create policy profile_update on public.player_space_profiles for update to authenticated using(star_private.is_player_family(player_id)) with check(star_private.is_player_family(player_id) and updated_by=(select auth.uid()));

create table public.player_personal_goals (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 goal text not null check(length(btrim(goal)) between 3 and 300),
 target_date date,
 status text not null default 'active' check(status in ('active','achieved','archived')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index player_personal_goals_player_idx on public.player_personal_goals(player_id);
alter table public.player_personal_goals enable row level security;
revoke all on public.player_personal_goals from anon,authenticated;
grant select,insert on public.player_personal_goals to authenticated;
grant update(goal,target_date,status,updated_at) on public.player_personal_goals to authenticated;
create policy personal_goal_read on public.player_personal_goals for select to authenticated using(star_private.is_player_family(player_id) or star_private.can_coach_player(player_id));
create policy personal_goal_insert on public.player_personal_goals for insert to authenticated with check(star_private.is_player_family(player_id) and created_by=(select auth.uid()));
create policy personal_goal_update on public.player_personal_goals for update to authenticated using(star_private.is_player_family(player_id)) with check(star_private.is_player_family(player_id));

create table public.player_award_receipts (
 guardian_id uuid not null references auth.users(id) on delete cascade,
 achievement_id uuid not null references public.player_achievements(id) on delete cascade,
 primary key(guardian_id,achievement_id)
);
create index player_award_receipts_award_idx on public.player_award_receipts(achievement_id);
alter table public.player_award_receipts enable row level security;
revoke all on public.player_award_receipts from anon,authenticated;
grant select,insert on public.player_award_receipts to authenticated;
create policy award_receipt_read on public.player_award_receipts for select to authenticated using(guardian_id=(select auth.uid()) and exists(select 1 from public.player_achievements a where a.id=achievement_id and star_private.is_player_family(a.player_id)));
create policy award_receipt_insert on public.player_award_receipts for insert to authenticated with check(guardian_id=(select auth.uid()) and exists(select 1 from public.player_achievements a where a.id=achievement_id and star_private.is_player_family(a.player_id)));

-- Private photographs: linked families can upload/read/delete only their player's folder.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('player-card-photos','player-card-photos',false,1048576,array['image/jpeg']);
create policy player_photo_read on storage.objects for select to authenticated using(bucket_id='player-card-photos' and exists(select 1 from public.guardian_player_links l where l.guardian_id=(select auth.uid()) and l.player_id::text=(storage.foldername(name))[1]));
create policy player_photo_insert on storage.objects for insert to authenticated with check(bucket_id='player-card-photos' and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' and exists(select 1 from public.guardian_player_links l where l.guardian_id=(select auth.uid()) and l.player_id::text=(storage.foldername(name))[1]));
create policy player_photo_delete on storage.objects for delete to authenticated using(bucket_id='player-card-photos' and exists(select 1 from public.guardian_player_links l where l.guardian_id=(select auth.uid()) and l.player_id::text=(storage.foldername(name))[1]));

alter table public.player_training_assignments
 add column week_start date check(week_start is null or extract(isodow from week_start)=1),
 add column practice_day smallint check(practice_day between 0 and 6),
 add column suggested_minutes smallint check(suggested_minutes between 1 and 120),
 add column equipment text check(length(equipment)<=150),
 add column is_optional boolean not null default false,
 add constraint practice_day_requires_week check(practice_day is null or week_start is not null);
grant update(title,instructions,target,due_date,goal_id,week_start,practice_day,suggested_minutes,equipment,is_optional) on public.player_training_assignments to authenticated;
drop policy assignment_read on public.player_training_assignments;
create policy assignment_read on public.player_training_assignments for select to authenticated using(star_private.can_coach_player(player_id) or star_private.is_player_family(player_id));
drop policy assignment_staff_insert on public.player_training_assignments;
create policy assignment_staff_insert on public.player_training_assignments for insert to authenticated with check(star_private.can_coach_player(player_id) and created_by=(select auth.uid()) and (goal_id is null or exists(select 1 from public.coaching_development_goals g where g.id=player_training_assignments.goal_id and g.player_id=player_training_assignments.player_id)));
create policy assignment_staff_update on public.player_training_assignments for update to authenticated using(star_private.can_coach_player(player_id)) with check(star_private.can_coach_player(player_id) and (goal_id is null or exists(select 1 from public.coaching_development_goals g where g.id=player_training_assignments.goal_id and g.player_id=player_training_assignments.player_id)));
drop policy diary_read on public.player_training_diary;
create policy diary_read on public.player_training_diary for select to authenticated using(exists(select 1 from public.player_training_assignments a where a.id=assignment_id and (star_private.can_coach_player(a.player_id) or (guardian_id=(select auth.uid()) and star_private.is_player_family(a.player_id)))));
drop policy feedback_read on public.player_training_feedback;
create policy feedback_read on public.player_training_feedback for select to authenticated using(exists(select 1 from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where d.id=diary_id and (star_private.can_coach_player(a.player_id) or (d.guardian_id=(select auth.uid()) and star_private.is_player_family(a.player_id)))));
drop policy feedback_staff_insert on public.player_training_feedback;
create policy feedback_staff_insert on public.player_training_feedback for insert to authenticated with check(reviewed_by=(select auth.uid()) and exists(select 1 from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where d.id=diary_id and star_private.can_coach_player(a.player_id)));
drop policy feedback_staff_update on public.player_training_feedback;
create policy feedback_staff_update on public.player_training_feedback for update to authenticated using(exists(select 1 from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where d.id=diary_id and star_private.can_coach_player(a.player_id))) with check(reviewed_by=(select auth.uid()) and exists(select 1 from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where d.id=diary_id and star_private.can_coach_player(a.player_id)));
