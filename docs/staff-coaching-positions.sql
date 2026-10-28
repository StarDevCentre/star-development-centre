-- Additive schema for staff drafts and explicit family snapshots.
-- Applied through Supabase migrations; no existing coaching data is rewritten.
create function star_private.position_profile_valid(game_format integer, shape text, main_role text, developing_role text)
returns boolean language sql immutable security invoker set search_path = '' as $$
 select coalesce(exists(select 1 from (values
    (9, '2-4-2', array['keeper','centreBack','leftWide','centralMidfield','rightWide','forward']::text[]),
    (9, '3-3-2', array['keeper','centreBack','leftWide','centralMidfield','rightWide','forward']::text[]),
    (9, '3-2-3', array['keeper','centreBack','centralMidfield','leftWide','forward','rightWide']::text[]),
    (11, '4-3-3', array['keeper','fullBack','centreBack','holdingMidfield','centralMidfield','leftWide','forward','rightWide']::text[]),
    (11, '4-4-2', array['keeper','fullBack','centreBack','leftWide','centralMidfield','rightWide','forward']::text[]),
    (11, '4-2-3-1', array['keeper','fullBack','centreBack','holdingMidfield','leftWide','attackingMidfield','rightWide','forward']::text[]),
    (11, '3-5-2', array['keeper','centreBack','holdingMidfield','wingBack','centralMidfield','forward']::text[]),
    (11, '4-5-1', array['keeper','fullBack','centreBack','leftWide','centralMidfield','rightWide','forward']::text[]),
    (11, '3-1-4-2', array['keeper','centreBack','holdingMidfield','leftWide','centralMidfield','rightWide','forward']::text[])
 ) as f(format, formation, roles) where f.format=game_format and f.formation=shape
 and main_role=any(f.roles) and (developing_role is null or (developing_role=any(f.roles) and developing_role<>main_role))),false)
$$;
revoke all on function star_private.position_profile_valid(integer,text,text,text) from public,anon;
grant execute on function star_private.position_profile_valid(integer,text,text,text) to authenticated;

create table public.coaching_position_profiles (
 player_id uuid primary key references public.coaching_players(id) on delete cascade,
 format integer not null,
 formation text not null,
 main_position text not null,
 secondary_position text,
 coach_focus text not null default '' check (length(coach_focus)<=500),
 revision bigint not null default 1 check (revision>0),
 updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id),
 check (star_private.position_profile_valid(format,formation,main_position,secondary_position))
);
create table public.family_position_profiles (
 player_id uuid primary key references public.coaching_players(id) on delete cascade,
 format integer not null,
 formation text not null,
 main_position text not null,
 secondary_position text,
 coach_focus text not null default '' check (length(coach_focus)<=500),
 source_revision bigint not null check (source_revision>0),
 published_at timestamptz not null default now(),
 published_by uuid not null references auth.users(id),
 check (star_private.position_profile_valid(format,formation,main_position,secondary_position))
);
alter table public.coaching_position_profiles enable row level security;
alter table public.family_position_profiles enable row level security;
revoke all on public.coaching_position_profiles,public.family_position_profiles from public,anon,authenticated;
grant select,insert on public.coaching_position_profiles to authenticated;
grant update(format,formation,main_position,secondary_position,coach_focus,updated_by) on public.coaching_position_profiles to authenticated;
grant select,insert,delete on public.family_position_profiles to authenticated;
grant update(format,formation,main_position,secondary_position,coach_focus,source_revision,published_at,published_by) on public.family_position_profiles to authenticated;

create function star_private.stamp_coaching_position_profile() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.updated_at:=now();
 if tg_op='INSERT' then new.revision:=1; else new.revision:=old.revision+1; end if;
 return new;
end $$;
revoke all on function star_private.stamp_coaching_position_profile() from public,anon;
create trigger stamp_position_profile before insert or update on public.coaching_position_profiles
for each row execute function star_private.stamp_coaching_position_profile();

create policy staff_position_read on public.coaching_position_profiles for select to authenticated using (
 (select star_private.is_staff_manager()) or ((select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=coaching_position_profiles.player_id and a.staff_user_id=(select auth.uid())))
);
create policy staff_position_insert on public.coaching_position_profiles for insert to authenticated with check (
 updated_by=(select auth.uid()) and ((select star_private.is_staff_manager()) or ((select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=coaching_position_profiles.player_id and a.staff_user_id=(select auth.uid()))))
);
create policy staff_position_update on public.coaching_position_profiles for update to authenticated using (
 (select star_private.is_staff_manager()) or ((select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=coaching_position_profiles.player_id and a.staff_user_id=(select auth.uid())))
) with check (
 updated_by=(select auth.uid()) and ((select star_private.is_staff_manager()) or ((select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=coaching_position_profiles.player_id and a.staff_user_id=(select auth.uid()))))
);
create policy family_position_read on public.family_position_profiles for select to authenticated using (
 (select star_private.is_staff_manager())
 or ((select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=family_position_profiles.player_id and a.staff_user_id=(select auth.uid())))
 or exists(select 1 from public.guardian_player_links l where l.player_id=family_position_profiles.player_id and l.guardian_id=(select auth.uid()))
);
create policy family_position_insert on public.family_position_profiles for insert to authenticated with check ((select star_private.is_staff_manager()) and published_by=(select auth.uid()));
create policy family_position_update on public.family_position_profiles for update to authenticated using ((select star_private.is_staff_manager())) with check ((select star_private.is_staff_manager()) and published_by=(select auth.uid()));
create policy family_position_delete on public.family_position_profiles for delete to authenticated using ((select star_private.is_staff_manager()));

-- Invoker permissions and the existing manager check both apply. Locking the
-- reviewed draft prevents publishing a stale revision while another coach saves.
create function public.publish_coaching_position_profile(target_player uuid, expected_revision bigint)
returns setof public.family_position_profiles language plpgsql security invoker set search_path='' as $$
declare draft public.coaching_position_profiles%rowtype;
begin
 if auth.uid() is null or not star_private.is_staff_manager() then raise exception 'Manager access required' using errcode='42501'; end if;
 select * into draft from public.coaching_position_profiles where player_id=target_player for share;
 if not found or expected_revision is null or draft.revision<>expected_revision then raise exception 'Position profile changed. Reload and review.' using errcode='40001'; end if;
 return query insert into public.family_position_profiles as published(player_id,format,formation,main_position,secondary_position,coach_focus,source_revision,published_at,published_by)
 values(draft.player_id,draft.format,draft.formation,draft.main_position,draft.secondary_position,draft.coach_focus,draft.revision,now(),auth.uid())
 on conflict(player_id) do update set format=excluded.format,formation=excluded.formation,main_position=excluded.main_position,secondary_position=excluded.secondary_position,coach_focus=excluded.coach_focus,source_revision=excluded.source_revision,published_at=excluded.published_at,published_by=excluded.published_by
 returning published.*;
end $$;
revoke all on function public.publish_coaching_position_profile(uuid,bigint) from public,anon;
grant execute on function public.publish_coaching_position_profile(uuid,bigint) to authenticated;
comment on table public.coaching_position_profiles is 'Internal coaching drafts. Managers and assigned active coaches only.';
comment on table public.family_position_profiles is 'Explicit position snapshots for approved linked guardians. Draft changes never auto-publish.';
