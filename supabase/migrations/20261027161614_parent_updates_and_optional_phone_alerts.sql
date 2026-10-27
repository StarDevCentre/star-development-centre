-- Parent updates are generated only by published family activity. No backfill.
create table public.parent_notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 player_id uuid references public.coaching_players(id) on delete cascade,
 category text not null check(category in ('message','report','session','programme')),
 source_kind text not null check(source_kind in ('message','report','session','request','programme')),
 source_id uuid not null,title text not null check(length(title)<=120),
 created_at timestamptz not null default now(),read_at timestamptz
);
create index parent_notifications_user_date_idx on public.parent_notifications(user_id,created_at desc);
create index parent_notifications_player_idx on public.parent_notifications(player_id);
alter table public.parent_notifications enable row level security;
revoke all on public.parent_notifications from public,anon,authenticated;
grant select,update(read_at) on public.parent_notifications to authenticated;

create function star_private.parent_notification_access(uid uuid,pid uuid,kind text,sid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.guardian_profiles where user_id=uid) and
 case when kind='programme' then exists(select 1 from public.player_registrations r where r.id=sid and r.guardian_id=uid and r.status<>'draft')
 else exists(select 1 from public.guardian_player_links g where g.guardian_id=uid and g.player_id=pid) and
 case when kind='message' then exists(select 1 from public.family_messages m where m.id=sid and m.guardian_id=uid and m.player_id=pid and m.sender_role='staff')
 when kind='report' then exists(select 1 from public.family_monthly_reports r where r.id=sid and r.player_id=pid)
 when kind='request' then exists(select 1 from public.family_session_requests r where r.id=sid and r.player_id=pid and r.guardian_id=uid)
 when kind='session' then true else false end end
$$;
revoke all on function star_private.parent_notification_access(uuid,uuid,text,uuid) from public,anon;
grant execute on function star_private.parent_notification_access(uuid,uuid,text,uuid) to authenticated;
create policy parent_notification_read on public.parent_notifications for select to authenticated
 using(user_id=(select auth.uid()) and star_private.parent_notification_access((select auth.uid()),player_id,source_kind,source_id));
create policy parent_notification_mark_read on public.parent_notifications for update to authenticated
 using(user_id=(select auth.uid()) and star_private.parent_notification_access((select auth.uid()),player_id,source_kind,source_id))
 with check(user_id=(select auth.uid()) and star_private.parent_notification_access((select auth.uid()),player_id,source_kind,source_id));

create function star_private.has_parent_portal(target_user uuid) returns boolean
language sql stable security definer set search_path='' as $$select exists(select 1 from public.guardian_profiles where user_id=target_user)$$;
revoke all on function star_private.has_parent_portal(uuid) from public,anon;
grant execute on function star_private.has_parent_portal(uuid) to authenticated;
create table public.parent_push_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 categories text[] not null default array['message','report','session','programme']::text[]
  check(cardinality(categories) between 0 and 4 and categories <@ array['message','report','session','programme']::text[]),
 quiet_hours boolean not null default true,
 consented_at timestamptz, updated_at timestamptz not null default now()
);
alter table public.parent_push_preferences enable row level security;
revoke all on public.parent_push_preferences from public,anon,authenticated;
grant select,insert,update on public.parent_push_preferences to authenticated;
create policy push_preferences_read on public.parent_push_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy push_preferences_insert on public.parent_push_preferences for insert to authenticated
 with check(user_id=(select auth.uid()) and (not enabled or (consented_at is not null and star_private.has_parent_portal((select auth.uid())))));
create policy push_preferences_update on public.parent_push_preferences for update to authenticated using(user_id=(select auth.uid()))
 with check(user_id=(select auth.uid()) and (not enabled or (consented_at is not null and star_private.has_parent_portal((select auth.uid())))));

create table public.parent_push_subscriptions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null check(length(endpoint) between 20 and 4096),
 endpoint_hash text generated always as (md5(endpoint)) stored unique,
 p256dh text not null,auth text not null,created_at timestamptz not null default now(),last_seen_at timestamptz not null default now()
);
create index parent_push_subscriptions_user_idx on public.parent_push_subscriptions(user_id);
alter table public.parent_push_subscriptions enable row level security;
revoke all on public.parent_push_subscriptions from public,anon,authenticated;
grant select,delete on public.parent_push_subscriptions to authenticated;
create policy push_subscription_read on public.parent_push_subscriptions for select to authenticated using(user_id=(select auth.uid()));
create policy push_subscription_delete on public.parent_push_subscriptions for delete to authenticated using(user_id=(select auth.uid()));

-- Validate both here and in the sender; subscriptions cannot turn the worker
-- into an arbitrary HTTP client. No local, custom-port or redirect endpoints.
create function star_private.register_parent_push_subscription(subscription jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result uuid; existing_user uuid; ep text:=subscription->>'endpoint';
 k text:=subscription->'keys'->>'p256dh'; a text:=subscription->'keys'->>'auth';
begin
 if uid is null or not star_private.has_parent_portal(uid) or not exists(select 1 from public.parent_push_preferences where user_id=uid and enabled) then
  raise exception 'Enable alerts on your linked account first' using errcode='42501'; end if;
 if ep is null or not star_private.valid_push_endpoint(ep) or k is null or k !~ '^[A-Za-z0-9_-]{87}$' or a is null or a !~ '^[A-Za-z0-9_-]{22}$' then
  raise exception 'Unsupported push subscription' using errcode='22023'; end if;
 -- Serialise a user's registrations so concurrent requests cannot exceed the cap.
 perform 1 from public.parent_push_preferences where user_id=uid for update;
 select user_id into existing_user from public.parent_push_subscriptions where endpoint_hash=md5(ep);
 if existing_user is not null and existing_user<>uid then raise exception 'Re-enable alerts for this device' using errcode='42501'; end if;
 if existing_user is null and (select count(*) from public.parent_push_subscriptions where user_id=uid)>=5 then
  raise exception 'Five devices are already enabled. Turn off an old device first.' using errcode='22023'; end if;
 insert into public.parent_push_subscriptions(user_id,endpoint,p256dh,auth) values(uid,ep,k,a)
 on conflict(endpoint_hash) do update set p256dh=excluded.p256dh,auth=excluded.auth,last_seen_at=now()
 where parent_push_subscriptions.user_id=uid returning id into result;
 if result is null then raise exception 'Re-enable alerts for this device' using errcode='42501'; end if;
 return result;
end $$;
revoke all on function star_private.register_parent_push_subscription(jsonb) from public,anon;
grant execute on function star_private.register_parent_push_subscription(jsonb) to authenticated;

create function public.register_parent_push_subscription(subscription jsonb) returns uuid language sql security invoker set search_path='' as $$select star_private.register_parent_push_subscription(subscription)$$;
revoke all on function public.register_parent_push_subscription(jsonb) from public,anon;
grant execute on function public.register_parent_push_subscription(jsonb) to authenticated;
create function star_private.parent_push_public_key() returns text
language plpgsql stable security definer set search_path='' as $$begin
 if not star_private.has_parent_portal(auth.uid()) then raise exception 'Parent account required' using errcode='42501';end if;
 return (select public_key from star_private.player_push_config where singleton);
end $$;
revoke all on function star_private.parent_push_public_key() from public,anon;
grant execute on function star_private.parent_push_public_key() to authenticated;
create function public.parent_push_public_key() returns text language sql stable security invoker set search_path='' as $$select star_private.parent_push_public_key()$$;
revoke all on function public.parent_push_public_key() from public,anon;
grant execute on function public.parent_push_public_key() to authenticated;
create table star_private.parent_push_deliveries (
 id bigint generated always as identity primary key,
 notification_id uuid not null references public.parent_notifications(id) on delete cascade,
 subscription_id uuid not null references public.parent_push_subscriptions(id) on delete cascade,
 status text not null default 'queued' check(status in ('queued','sending','sent','failed','skipped')),
 attempts smallint not null default 0,available_at timestamptz not null default now(),
 claim_token uuid,claimed_at timestamptz,updated_at timestamptz not null default now(),
 last_status smallint,unique(notification_id,subscription_id)
);
create index parent_push_delivery_due_idx on star_private.parent_push_deliveries(available_at) where status='queued';
create index parent_push_delivery_subscription_idx on star_private.parent_push_deliveries(subscription_id);
alter table star_private.parent_push_deliveries enable row level security;
revoke all on star_private.parent_push_deliveries from public,anon,authenticated;
create function star_private.parent_push_delivery_allowed(nid uuid,sid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.parent_notifications n
 join public.parent_push_subscriptions s on s.id=sid join public.parent_push_preferences p on p.user_id=s.user_id
 where n.id=nid and n.user_id=s.user_id and p.enabled and n.category=any(p.categories)
 and n.created_at>=s.created_at and n.created_at>now()-interval '48 hours' and n.read_at is null
 and star_private.parent_notification_access(s.user_id,n.player_id,n.source_kind,n.source_id))
$$;
revoke all on function star_private.parent_push_delivery_allowed(uuid,uuid) from public,anon,authenticated;
create function star_private.queue_parent_push() returns trigger
language plpgsql security definer set search_path='' as $$begin
 insert into star_private.parent_push_deliveries(notification_id,subscription_id,available_at)
 select new.id,s.id,star_private.next_push_time(p.quiet_hours)
 from public.parent_push_subscriptions s join public.parent_push_preferences p on p.user_id=s.user_id
 where s.user_id=new.user_id and p.enabled and new.category=any(p.categories)
 and star_private.parent_notification_access(s.user_id,new.player_id,new.source_kind,new.source_id)
 on conflict do nothing;return new;
end $$;
revoke all on function star_private.queue_parent_push() from public,anon,authenticated;
create trigger queue_parent_push after insert on public.parent_notifications for each row execute function star_private.queue_parent_push();
create function star_private.claim_parent_push_deliveries(batch_size integer default 25)
returns table(id bigint,claim_token uuid,endpoint text,p256dh text,auth text,category text,notification_id uuid)
language plpgsql security definer set search_path='' as $$
begin
 update star_private.parent_push_deliveries q set status=case when attempts<5 then 'queued' else 'failed' end,available_at=now(),updated_at=now()
 where q.status='sending' and q.claimed_at<now()-interval '10 minutes';
 update star_private.parent_push_deliveries q set status='skipped',updated_at=now()
 where q.status='queued' and not star_private.parent_push_delivery_allowed(q.notification_id,q.subscription_id);
 update star_private.parent_push_deliveries q set available_at=star_private.next_push_time(p.quiet_hours)
 from public.parent_push_subscriptions s join public.parent_push_preferences p on p.user_id=s.user_id
 where q.subscription_id=s.id and q.status='queued' and q.available_at<=now() and star_private.next_push_time(p.quiet_hours)>now();
 return query with candidates as (
 select q.id from star_private.parent_push_deliveries q where q.status='queued' and q.available_at<=now()
 order by q.available_at,q.id limit greatest(1,least(coalesce(batch_size,25),100)) for update skip locked
 ), claimed as (
 update star_private.parent_push_deliveries q set status='sending',claim_token=gen_random_uuid(),claimed_at=now(),attempts=q.attempts+1,updated_at=now()
 where q.id in(select c.id from candidates c) returning q.*)
 select q.id,q.claim_token,s.endpoint,s.p256dh,s.auth,n.category,q.notification_id
 from claimed q join public.parent_push_subscriptions s on s.id=q.subscription_id join public.parent_notifications n on n.id=q.notification_id;
end $$;
revoke all on function star_private.claim_parent_push_deliveries(integer) from public,anon,authenticated;
grant execute on function star_private.claim_parent_push_deliveries(integer) to service_role;
create function star_private.check_parent_push_delivery(job_id bigint,token uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from star_private.parent_push_deliveries q join public.parent_push_subscriptions s on s.id=q.subscription_id
 join public.parent_push_preferences p on p.user_id=s.user_id where q.id=job_id and q.claim_token=token and q.status='sending'
 and star_private.parent_push_delivery_allowed(q.notification_id,q.subscription_id) and star_private.next_push_time(p.quiet_hours)<=now())
$$;
revoke all on function star_private.check_parent_push_delivery(bigint,uuid) from public,anon,authenticated;
grant execute on function star_private.check_parent_push_delivery(bigint,uuid) to service_role;
create function star_private.finish_parent_push_delivery(job_id bigint,token uuid,outcome text,http_status integer default 0) returns void
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if outcome not in ('sent','gone','retry','failed','skipped') then raise exception 'Invalid delivery outcome'; end if;
 update star_private.parent_push_deliveries q set
 status=case when outcome='retry' and q.attempts<5 then 'queued' when outcome='retry' then 'failed' when outcome='gone' then 'failed' else outcome end,
 available_at=case when outcome='retry' then now()+make_interval(mins=>least(60,power(2,q.attempts)::integer)) else q.available_at end,
 last_status=greatest(0,least(http_status,599)),updated_at=now()
 where q.id=job_id and q.claim_token=token and q.status='sending' returning subscription_id into sid;
 if outcome='gone' and sid is not null then delete from public.parent_push_subscriptions where id=sid; end if;
end $$;
revoke all on function star_private.finish_parent_push_delivery(bigint,uuid,text,integer) from public,anon,authenticated;
grant execute on function star_private.finish_parent_push_delivery(bigint,uuid,text,integer) to service_role;

create function public.claim_parent_push_deliveries(batch_size integer default 25) returns table(id bigint,claim_token uuid,endpoint text,p256dh text,auth text,category text,notification_id uuid) language sql security invoker set search_path='' as $$select * from star_private.claim_parent_push_deliveries(batch_size)$$;
revoke all on function public.claim_parent_push_deliveries(integer) from public,anon,authenticated;
grant execute on function public.claim_parent_push_deliveries(integer) to service_role;
create function public.check_parent_push_delivery(job_id bigint,token uuid) returns boolean language sql security invoker set search_path='' as $$select star_private.check_parent_push_delivery(job_id,token)$$;
revoke all on function public.check_parent_push_delivery(bigint,uuid) from public,anon,authenticated;
grant execute on function public.check_parent_push_delivery(bigint,uuid) to service_role;
create function public.finish_parent_push_delivery(job_id bigint,token uuid,outcome text,http_status integer default 0) returns void language sql security invoker set search_path='' as $$select star_private.finish_parent_push_delivery(job_id,token,outcome,http_status)$$;
revoke all on function public.finish_parent_push_delivery(bigint,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.finish_parent_push_delivery(bigint,uuid,text,integer) to service_role;
create policy parent_push_queue_worker_only on star_private.parent_push_deliveries for all to service_role using(true) with check(true);

-- Notify only the intended guardian for messages and request decisions.
create function star_private.notify_parent_update() returns trigger
language plpgsql security definer set search_path='' as $$
declare pid uuid; sid uuid; owner_id uuid; kind text; category_name text; heading text;
begin
 if tg_table_name='family_messages' then
  if new.sender_role<>'staff' then return new;end if;
  pid:=new.player_id;sid:=new.id;owner_id:=new.guardian_id;kind:='message';category_name:='message';heading:='New message from STAR';
 elsif tg_table_name='family_monthly_reports' then
  if tg_op='UPDATE' and (new.strengths,new.development_areas,new.next_steps,new.review_month) is not distinct from (old.strengths,old.development_areas,old.next_steps,old.review_month) then return new;end if;
  pid:=new.player_id;sid:=new.id;kind:='report';category_name:='report';heading:=case when tg_op='INSERT' then 'Monthly report published' else 'Monthly report updated' end;
 elsif tg_table_name='family_session_schedule' then
  kind:='session';category_name:='session';
  if tg_op='DELETE' then pid:=old.player_id;sid:=old.id;heading:='A shared session was removed';
  else
   if tg_op='UPDATE' and (new.title,new.starts_at,new.ends_at,new.venue,new.coach_focus,new.kit_list) is not distinct from (old.title,old.starts_at,old.ends_at,old.venue,old.coach_focus,old.kit_list) then return new;end if;
   pid:=new.player_id;sid:=new.id;heading:=case when tg_op='INSERT' then 'New session shared' else 'Session details changed' end;
  end if;
 elsif tg_table_name='family_session_requests' then
  if new.status='pending' or (new.status,new.staff_response) is not distinct from (old.status,old.staff_response) then return new;end if;
  pid:=new.player_id;sid:=new.id;owner_id:=new.guardian_id;kind:='request';category_name:='session';heading:='STAR replied to your session request';
 elsif tg_table_name='player_registrations' then
  if new.status not in ('under_review','accepted','declined','waitlisted','enrolled') or (new.status,new.recommended_programme) is not distinct from (old.status,old.recommended_programme) then return new;end if;
  sid:=new.id;owner_id:=new.guardian_id;kind:='programme';category_name:='programme';heading:='Your programme application has an update';
 else return new;end if;
 if owner_id is not null then
  insert into public.parent_notifications(user_id,player_id,category,source_kind,source_id,title)
  select owner_id,pid,category_name,kind,sid,heading where star_private.parent_notification_access(owner_id,pid,kind,sid);
 else
  insert into public.parent_notifications(user_id,player_id,category,source_kind,source_id,title)
  select g.guardian_id,pid,category_name,kind,sid,heading from public.guardian_player_links g
  where g.player_id=pid and star_private.parent_notification_access(g.guardian_id,pid,kind,sid);
 end if;
 if tg_op='DELETE' then return old;else return new;end if;
end $$;
revoke all on function star_private.notify_parent_update() from public,anon,authenticated;
create trigger notify_parent_update after insert on public.family_messages for each row execute function star_private.notify_parent_update();
create trigger notify_parent_update after insert or update on public.family_monthly_reports for each row execute function star_private.notify_parent_update();
create trigger notify_parent_update after insert or update or delete on public.family_session_schedule for each row execute function star_private.notify_parent_update();
create trigger notify_parent_update after update on public.family_session_requests for each row execute function star_private.notify_parent_update();
create trigger notify_parent_update after update on public.player_registrations for each row execute function star_private.notify_parent_update();

create function star_private.tick_parent_push() returns bigint
language plpgsql security definer set search_path='' as $$declare request_id bigint; secret text;
begin
 delete from star_private.parent_push_deliveries where status in ('sent','failed','skipped') and updated_at<now()-interval '30 days';
 if not exists(select 1 from star_private.parent_push_deliveries where (status='queued' and available_at<=now()) or (status='sending' and claimed_at<now()-interval '10 minutes')) then return null;end if;
 select v.decrypted_secret into secret from star_private.player_push_config c join vault.decrypted_secrets v on v.id=c.worker_secret where c.singleton;
 if secret is null then return null;end if;
 select net.http_post(url:='https://mgmzujtzncqubbwzvddh.supabase.co/functions/v1/parent-push-worker',headers:=jsonb_build_object('Content-Type','application/json','x-star-worker-secret',secret),body:='{}'::jsonb,timeout_milliseconds:=30000) into request_id;
 return request_id;
end $$;
revoke all on function star_private.tick_parent_push() from public,anon,authenticated;
select cron.schedule('star-parent-phone-alerts','* * * * *','select star_private.tick_parent_push()');
