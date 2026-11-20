create table star_private.member_pack_team (
  staff_id uuid primary key references public.staff_members(user_id) on delete cascade
);
-- The same two staff accounts used by the player directory manage pack handovers.
insert into star_private.member_pack_team select user_id from public.staff_members where active
  and user_id in ('f877ee5c-68cf-403a-b334-53f1805a2963','39e31152-8e06-40ac-a723-284f6bde5f09');
create table star_private.member_packs (
  player_id uuid primary key references public.coaching_players(id) on delete cascade,
  joined_programme text check(joined_programme in ('Flyers','Prestige')),
  owner_id uuid references public.staff_members(user_id) on delete set null,
  status text not null default 'due' check(status in ('due','ready','handed')),
  confirmed_size text check(length(confirmed_size) between 1 and 80),
  version integer not null default 0,
  ready_at timestamptz,
  handed_at timestamptz
);
alter table star_private.member_pack_team enable row level security;
alter table star_private.member_packs enable row level security;
revoke all on star_private.member_pack_team,star_private.member_packs from public,anon,authenticated;

create function star_private.record_pack_enrolment() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  player uuid;
  programme_name text;
begin
  if tg_table_name='coaching_players' then player:=new.id; programme_name:=new.programme;
  elsif tg_table_name='player_registrations' then
    player:=new.enrolled_player_id; programme_name:=initcap(coalesce(new.recommended_programme,new.programme));
  else player:=new.player_id; programme_name:=new.programme;
  end if;
  if player is not null and programme_name in ('Flyers','Prestige') then
    insert into star_private.member_packs as m(player_id,joined_programme) values(player,programme_name)
    on conflict(player_id) do update set joined_programme=excluded.joined_programme where m.joined_programme is null;
  end if;
  return new;
end $$;
revoke all on function star_private.record_pack_enrolment() from public,anon,authenticated;
create trigger record_pack_enrolment after insert or update of programme on public.coaching_players
  for each row when(new.programme in ('Flyers','Prestige')) execute function star_private.record_pack_enrolment();
create trigger record_pack_enrolment after insert or update of status,enrolled_player_id,programme,recommended_programme on public.player_registrations
  for each row when(new.status='enrolled' and new.enrolled_player_id is not null) execute function star_private.record_pack_enrolment();
create trigger record_pack_enrolment after insert on star_private.player_programme_blocks
  for each row execute function star_private.record_pack_enrolment();
insert into star_private.member_packs(player_id,joined_programme)
  select id,programme from public.coaching_players where programme in ('Flyers','Prestige');
insert into star_private.member_packs(player_id,joined_programme)
  select distinct on (enrolled_player_id) enrolled_player_id,initcap(coalesce(recommended_programme,programme))
  from public.player_registrations where status='enrolled' and enrolled_player_id is not null
    and coalesce(recommended_programme,programme) in ('prestige','flyers')
  order by enrolled_player_id,decision_at nulls last,id on conflict do nothing;
insert into star_private.member_packs(player_id,joined_programme)
  select distinct on (player_id) player_id,programme from star_private.player_programme_blocks
  order by player_id,created_at,id on conflict do nothing;

create function star_private.pack_staff(p_staff uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.staff_members s where s.user_id=p_staff and s.active and
    (s.role in ('owner','manager') or exists(select 1 from star_private.member_pack_team t where t.staff_id=s.user_id)))
$$;

create function star_private.pack_size(value text) returns text
language sql immutable set search_path='' as $$
  select case when length(btrim(value)) between 1 and 80 and btrim(value) !~* '^(need help|unsure|unknown|not sure|not known|tbc|tbd|to be confirmed|to be measured|size needed|n/a|not yet)' then btrim(value) end
$$;
revoke all on function star_private.pack_size(text) from public,anon,authenticated;

-- A player can qualify at enrolment or through five distinct attended individual sessions.
create function star_private.pack_tasks(p_player uuid default null)
returns table(player_id uuid,player_name text,reason text,shirt_size text,owner_id uuid,status text,version int,ready_at timestamptz,handed_at timestamptz)
language sql stable security definer set search_path='' as $$
  with ad_hoc as (
    select a.player_id from public.training_attendance a
    join public.training_session_participants r on r.session_id=a.session_id and r.player_id=a.player_id
    join public.training_sessions s on s.id=r.session_id
    where (p_player is null or a.player_id=p_player) and a.status in ('present','late')
      and s.programme='1-to-1' and s.organisation_id is null and s.cancelled_at is null and s.starts_at<=now()
    group by a.player_id having count(distinct s.id)>=5
  )
  select p.id,concat_ws(' ',p.first_name,p.last_name),coalesce(m.joined_programme,'Five attended one-to-ones'),
    coalesce(m.confirmed_size,i.shirt_size),m.owner_id,coalesce(m.status,'due'),coalesce(m.version,0),m.ready_at,m.handed_at
  from public.coaching_players p left join star_private.member_packs m on m.player_id=p.id
  left join ad_hoc a on a.player_id=p.id
  left join lateral (
    select star_private.pack_size(intake.details->>'training_top_size') as shirt_size from public.player_intakes intake
    where intake.portal_player_id=p.id and nullif(btrim(intake.details->>'training_top_size'),'') is not null
    order by intake.guardian_reviewed_at desc nulls last,intake.updated_at desc,intake.id limit 1
  ) i on true
  where (p_player is null or p.id=p_player) and (m.joined_programme is not null or a.player_id is not null or m.status in ('ready','handed'))
$$;
revoke all on function star_private.pack_staff(uuid),star_private.pack_tasks(uuid) from public,anon,authenticated;

create function star_private.member_pack_queue() returns jsonb
language sql stable security definer set search_path='' as $$
  select case when star_private.pack_staff(auth.uid()) then jsonb_build_object(
    'tasks',coalesce((select jsonb_agg(to_jsonb(t) order by t.player_name,t.player_id) from star_private.pack_tasks() t),'[]'::jsonb),
    'owners',coalesce((select jsonb_agg(jsonb_build_object('id',s.user_id,'name',coalesce(nullif(c.coach_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),u.email,'STAR staff')) order by s.role,s.user_id)
      from public.staff_members s join auth.users u on u.id=s.user_id left join star_private.booking_coaches c on c.coach_id=s.user_id
      where star_private.pack_staff(s.user_id)),'[]'::jsonb)
  ) end
$$;
create function star_private.manage_member_pack(p_player uuid,p_expected integer,p_status text,p_owner uuid,p_size text) returns integer
language plpgsql security definer set search_path='' as $$
declare
  task record;
  size_text text:=star_private.pack_size(p_size);
  next_version integer;
begin
  if not star_private.pack_staff(auth.uid()) then raise exception 'Pack team access required.' using errcode='42501'; end if;
  perform 1 from public.coaching_players where id=p_player for update;
  select * into task from star_private.pack_tasks(p_player);
  if not found then raise exception 'This player does not currently have a pack due.'; end if;
  if p_owner is not null and not star_private.pack_staff(p_owner) then raise exception 'Choose an active pack team member.'; end if;
  if p_status is null or p_status not in ('due','ready','handed') or length(btrim(p_size))>80 then raise exception 'Check the pack details.'; end if;
  if p_status=task.status and p_owner is not distinct from task.owner_id and size_text is not distinct from task.shirt_size then return task.version; end if;
  if p_expected is distinct from task.version then raise exception 'Another staff member updated this pack. Refresh and try again.'; end if;
  if task.status='handed' or (task.status='ready' and p_status='due') or (task.status='due' and p_status='handed') then
    raise exception 'Mark the pack ready before recording handover.'; end if;
  if p_status<>'due' and size_text is null then raise exception 'Confirm the training top size first.'; end if;
  insert into star_private.member_packs as m(player_id,owner_id,status,confirmed_size,version,ready_at,handed_at)
    values(p_player,p_owner,p_status,size_text,task.version+1,
      case when p_status in ('ready','handed') then coalesce(task.ready_at,now()) end,
      case when p_status='handed' then now() end)
  on conflict(player_id) do update set owner_id=excluded.owner_id,status=excluded.status,confirmed_size=excluded.confirmed_size,
    version=excluded.version,ready_at=excluded.ready_at,handed_at=excluded.handed_at returning m.version into next_version;
  return next_version;
end $$;
create function star_private.family_member_pack(p_player uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select case when star_private.is_player_family(p_player) then (
    select jsonb_build_object('status',t.status,'ready_at',t.ready_at,'handed_at',t.handed_at) from star_private.pack_tasks(p_player) t
  ) end
$$;
create function public.star_member_pack_queue() returns jsonb language sql stable security invoker set search_path='' as $$select star_private.member_pack_queue()$$;
create function public.star_manage_member_pack(p_player uuid,p_expected integer,p_status text,p_owner uuid,p_size text) returns integer
language sql security invoker set search_path='' as $$select star_private.manage_member_pack(p_player,p_expected,p_status,p_owner,p_size)$$;
create function public.star_family_member_pack(p_player uuid) returns jsonb language sql stable security invoker set search_path='' as $$select star_private.family_member_pack(p_player)$$;
revoke all on function star_private.member_pack_queue(),star_private.manage_member_pack(uuid,integer,text,uuid,text),star_private.family_member_pack(uuid),
  public.star_member_pack_queue(),public.star_manage_member_pack(uuid,integer,text,uuid,text),public.star_family_member_pack(uuid) from public,anon;
grant execute on function star_private.member_pack_queue(),star_private.manage_member_pack(uuid,integer,text,uuid,text),star_private.family_member_pack(uuid),
  public.star_member_pack_queue(),public.star_manage_member_pack(uuid,integer,text,uuid,text),public.star_family_member_pack(uuid) to authenticated;
