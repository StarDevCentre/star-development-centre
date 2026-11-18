-- New ordinary correspondence uses the already shared Player Space conversation.
-- Historic parent-only family_messages keep their original audience.
create table star_private.shared_chat_reads (
  message_id uuid not null references public.player_space_messages(id) on delete cascade,
  reader_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default clock_timestamp(),
  primary key(message_id,reader_id)
);
alter table star_private.shared_chat_reads enable row level security;
revoke all on star_private.shared_chat_reads from public,anon,authenticated;

create function star_private.mark_shared_chat_read(p_player uuid,p_messages uuid[])
returns integer language plpgsql security definer set search_path='' as $$
declare
  total integer;
begin
  if auth.uid() is null or not (star_private.can_use_player(p_player) or star_private.can_coach_player(p_player)) then
    raise exception 'You do not have access to this conversation.' using errcode='42501';
  end if;
  if coalesce(cardinality(p_messages),0)>200 then raise exception 'Read up to 200 messages at a time.'; end if;
  insert into star_private.shared_chat_reads(message_id,reader_id)
  select m.id,auth.uid() from public.player_space_messages m
  where m.player_id=p_player and m.id=any(p_messages) and m.sender_id is distinct from auth.uid()
  on conflict do nothing;
  get diagnostics total=row_count;
  return total;
end $$;

create function star_private.count_shared_chat_unread()
returns bigint language sql stable security definer set search_path='' as $$
  select count(*) from public.player_space_messages m
  where (select auth.uid()) is not null and m.sender_id is distinct from (select auth.uid())
    and (star_private.can_use_player(m.player_id) or star_private.can_coach_player(m.player_id))
    and not exists (
      select 1 from star_private.shared_chat_reads r where r.message_id=m.id and r.reader_id=(select auth.uid())
    )
$$;

create function public.star_mark_shared_chat_read(p_player uuid,p_messages uuid[])
returns integer language sql security invoker set search_path='' as $$
  select star_private.mark_shared_chat_read(p_player,p_messages)
$$;
create function public.star_count_shared_chat_unread()
returns bigint language sql stable security invoker set search_path='' as $$
  select star_private.count_shared_chat_unread()
$$;
revoke all on function star_private.mark_shared_chat_read(uuid,uuid[]),star_private.count_shared_chat_unread(),
  public.star_mark_shared_chat_read(uuid,uuid[]),public.star_count_shared_chat_unread() from public,anon;
grant execute on function star_private.mark_shared_chat_read(uuid,uuid[]),star_private.count_shared_chat_unread(),
  public.star_mark_shared_chat_read(uuid,uuid[]),public.star_count_shared_chat_unread() to authenticated;

-- Use the existing opt-in notification queues. The sender never receives a
-- parent notification for their own message.
create or replace function star_private.parent_notification_access(uid uuid,pid uuid,kind text,sid uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.guardian_profiles where user_id=uid) and
  case when kind='programme' then exists(
    select 1 from public.player_registrations r where r.id=sid and r.guardian_id=uid and r.status<>'draft'
  ) else exists(select 1 from public.guardian_player_links g where g.guardian_id=uid and g.player_id=pid)
  and case kind
    when 'message' then exists(
      select 1 from public.family_messages m where m.id=sid and m.guardian_id=uid and m.player_id=pid and m.sender_role='staff'
    ) or exists(
      select 1 from public.player_space_messages m where m.id=sid and m.player_id=pid and m.sender_id is distinct from uid
    )
    when 'report' then exists(select 1 from public.family_monthly_reports r where r.id=sid and r.player_id=pid)
    when 'request' then exists(select 1 from public.family_session_requests r where r.id=sid and r.player_id=pid and r.guardian_id=uid)
    when 'session' then true
    else false
  end end
$$;

create function star_private.notify_shared_family_message()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.parent_notifications(user_id,player_id,category,source_kind,source_id,title)
  select g.guardian_id,new.player_id,'message','message',new.id,'New family conversation message'
  from public.guardian_player_links g
  where g.player_id=new.player_id
    and star_private.parent_notification_access(g.guardian_id,new.player_id,'message',new.id);
  if new.sender_role='guardian' then
    insert into public.player_notifications(player_id,category,title,body,tab,source_key)
    values(new.player_id,'message','New family conversation message','Open Messages to read it.','messages','message:'||new.id)
    on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function star_private.notify_shared_family_message() from public,anon,authenticated;
create trigger notify_shared_family_message after insert on public.player_space_messages
for each row execute function star_private.notify_shared_family_message();

alter table public.player_training_diary add column quick_check_in boolean not null default false;
create unique index diary_one_quick_check_in on public.player_training_diary(assignment_id,guardian_id)
where quick_check_in;

create function star_private.try_home_practice(p_assignment uuid,p_reflection text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  result uuid;
  reflection_text text:=nullif(btrim(p_reflection),'');
begin
  if actor is null or not exists(
    select 1 from public.player_training_assignments a where a.id=p_assignment and star_private.is_player(a.player_id)
  ) then
    raise exception 'You do not have access to this practice.' using errcode='42501';
  end if;
  if length(reflection_text)>1500 then raise exception 'Keep the reflection within 1,500 characters.'; end if;

  insert into public.player_training_diary(assignment_id,guardian_id,practice_date,minutes,reflection,quick_check_in)
  values(p_assignment,actor,(now() at time zone 'Europe/London')::date,0,coalesce(reflection_text,'Tried it'),true)
  on conflict(assignment_id,guardian_id) where quick_check_in do nothing
  returning id into result;
  if result is null then
    select id into result from public.player_training_diary
    where assignment_id=p_assignment and guardian_id=actor and quick_check_in;
    if reflection_text is not null then
      update public.player_training_diary set reflection=reflection_text where id=result;
    end if;
  end if;
  return result;
end $$;

create function public.star_try_home_practice(p_assignment uuid,p_reflection text default null)
returns uuid language sql security invoker set search_path='' as $$
  select star_private.try_home_practice(p_assignment,p_reflection)
$$;
revoke all on function star_private.try_home_practice(uuid,text),public.star_try_home_practice(uuid,text) from public,anon;
grant execute on function star_private.try_home_practice(uuid,text),public.star_try_home_practice(uuid,text) to authenticated;
