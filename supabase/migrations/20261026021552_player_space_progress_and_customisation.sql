-- Existing diary rows remain unrated; both check-ins are optional.
alter table public.player_training_diary
 add column confidence smallint check(confidence between 1 and 5),
 add column enjoyment smallint check(enjoyment between 1 and 5);
alter table public.player_training_assignments add column coaching_points text check(length(coaching_points)<=1500);
grant update(coaching_points) on public.player_training_assignments to authenticated;
alter table public.player_space_profiles
 drop constraint player_space_profiles_icon_check,
 add constraint player_space_profiles_icon_check check(icon in ('train','ball','star','captain','comet','shield')),
 add column theme text not null default 'midnight' check(theme in ('midnight','stadium','scrapbook')),
 add column decoration text not null default 'none' check(decoration in ('none','lightning','laurel','starburst'));
grant update(theme,decoration) on public.player_space_profiles to authenticated;

-- Clients can read earned cosmetics, but only trusted milestone triggers can award them.
create table public.player_cosmetic_unlocks (
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 cosmetic text not null check(cosmetic in ('avatar-captain','avatar-comet','avatar-shield','decoration-lightning','decoration-laurel','decoration-starburst')),
 unlocked_at timestamptz not null default now(),
 primary key(player_id,cosmetic)
);
alter table public.player_cosmetic_unlocks enable row level security;
revoke all on public.player_cosmetic_unlocks from anon,authenticated;
grant select on public.player_cosmetic_unlocks to authenticated;
create policy cosmetics_family_read on public.player_cosmetic_unlocks for select to authenticated using(star_private.is_player_family(player_id));

create function star_private.refresh_player_cosmetics(target_player uuid) returns void
language plpgsql security definer set search_path='' as $$
declare days_count integer; badges_count integer; goals_count integer;
begin
 if auth.uid() is not null and not (star_private.is_player_family(target_player) or star_private.can_coach_player(target_player)) then raise exception 'Unlinked cosmetic source' using errcode='42501'; end if;
 select count(distinct d.practice_date) into days_count from public.player_training_diary d join public.player_training_assignments a on a.id=d.assignment_id where a.player_id=target_player and d.minutes>0;
 select count(*) into badges_count from public.player_achievements where player_id=target_player and badge_id is not null;
 select count(*) into goals_count from public.player_personal_goals where player_id=target_player and status='achieved';
 insert into public.player_cosmetic_unlocks(player_id,cosmetic)
 select target_player,reward from (values
 ('avatar-captain',badges_count>=1),('avatar-comet',days_count>=3),('avatar-shield',goals_count>=1),
 ('decoration-lightning',days_count>=3),('decoration-laurel',badges_count>=3),('decoration-starburst',goals_count>=1)
 ) rewards(reward,earned) where earned on conflict do nothing;
end $$;
-- This helper and the trigger functions cannot be invoked by API clients.
revoke all on function star_private.refresh_player_cosmetics(uuid) from public,anon,authenticated;
create function star_private.award_player_cosmetics() returns trigger
language plpgsql security definer set search_path='' as $$
declare target_player uuid;
begin
 if tg_table_schema<>'public' then raise exception 'Unsupported cosmetic source'; end if;
 if tg_table_name='player_training_diary' then
  select player_id into target_player from public.player_training_assignments where id=new.assignment_id;
 elsif tg_table_name in ('player_achievements','player_personal_goals') then target_player:=new.player_id;
 else raise exception 'Unsupported cosmetic source'; end if;
 if auth.uid() is not null and not (star_private.is_player_family(target_player) or star_private.can_coach_player(target_player)) then raise exception 'Unlinked cosmetic source' using errcode='42501'; end if;
 perform star_private.refresh_player_cosmetics(target_player);
 return new;
end $$;
revoke all on function star_private.award_player_cosmetics() from public,anon,authenticated;
create trigger practice_cosmetics after insert on public.player_training_diary for each row execute function star_private.award_player_cosmetics();
create trigger badge_cosmetics after insert on public.player_achievements for each row execute function star_private.award_player_cosmetics();
create trigger goal_cosmetics after insert or update of status on public.player_personal_goals for each row execute function star_private.award_player_cosmetics();
select star_private.refresh_player_cosmetics(id) from public.coaching_players;

create function star_private.validate_player_cosmetics() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.icon in ('captain','comet','shield') and (tg_op='INSERT' or new.icon is distinct from old.icon) then
  if not exists(select 1 from public.player_cosmetic_unlocks u where u.player_id=new.player_id and u.cosmetic='avatar-'||new.icon) then raise exception 'This avatar has not been unlocked yet' using errcode='23514'; end if;
 end if;
 if new.decoration<>'none' and (tg_op='INSERT' or new.decoration is distinct from old.decoration) then
  if not exists(select 1 from public.player_cosmetic_unlocks u where u.player_id=new.player_id and u.cosmetic='decoration-'||new.decoration) then raise exception 'This decoration has not been unlocked yet' using errcode='23514'; end if;
 end if;
 return new;
end $$;
revoke all on function star_private.validate_player_cosmetics() from public,anon,authenticated;
create trigger validate_player_cosmetics before insert or update of icon,decoration on public.player_space_profiles for each row execute function star_private.validate_player_cosmetics();

-- Preserve real goal changes so reopening a goal never erases an achievement.
create table public.player_goal_events (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 source_id uuid not null,
 source text not null check(source in ('personal','coach')),
 kind text not null check(kind in ('set','achieved','reopened','archived','updated')),
 goal text not null,
 occurred_at timestamptz not null default now()
);
create index player_goal_events_player_time_idx on public.player_goal_events(player_id,occurred_at desc);
alter table public.player_goal_events enable row level security;
revoke all on public.player_goal_events from anon,authenticated;
grant select on public.player_goal_events to authenticated;
create policy goal_events_family_read on public.player_goal_events for select to authenticated using(star_private.is_player_family(player_id));
-- Historical creation timestamps exist; earlier completion timestamps were never recorded.
insert into public.player_goal_events(player_id,source_id,source,kind,goal,occurred_at)
 select player_id,id,'personal','set',goal,created_at from public.player_personal_goals
 union all select player_id,id,'coach','set',goal,created_at from public.coaching_development_goals;
create function star_private.record_player_goal_event() returns trigger
language plpgsql security definer set search_path='' as $$
declare event_kind text; origin text;
begin
 if tg_table_schema<>'public' or tg_table_name not in ('player_personal_goals','coaching_development_goals') then raise exception 'Unsupported goal source'; end if;
 if auth.uid() is not null and not (star_private.is_player_family(new.player_id) or star_private.can_coach_player(new.player_id)) then raise exception 'Unlinked goal source' using errcode='42501'; end if;
 origin:=case when tg_table_name='player_personal_goals' then 'personal' else 'coach' end;
 if tg_op='INSERT' then event_kind:='set';
 elsif new.status is not distinct from old.status and new.goal is not distinct from old.goal then return new;
 elsif new.status is distinct from old.status then
  event_kind:=case when new.status='achieved' then 'achieved' when new.status='archived' then 'archived' when old.status in ('achieved','archived') then 'reopened' else 'updated' end;
 else event_kind:='updated'; end if;
 insert into public.player_goal_events(player_id,source_id,source,kind,goal) values(new.player_id,new.id,origin,event_kind,new.goal);
 return new;
end $$;
revoke all on function star_private.record_player_goal_event() from public,anon,authenticated;
create trigger personal_goal_history after insert or update of goal,status on public.player_personal_goals for each row execute function star_private.record_player_goal_event();
create trigger coach_goal_history after insert or update of goal,status on public.coaching_development_goals for each row execute function star_private.record_player_goal_event();
