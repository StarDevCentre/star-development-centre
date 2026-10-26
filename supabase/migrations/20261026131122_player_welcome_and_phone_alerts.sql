-- Setup progress belongs to each signed-in player/guardian, not the whole family.
create table public.player_space_onboarding (
 user_id uuid not null references auth.users(id) on delete cascade,
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 step smallint not null default 0 check(step between 0 and 5),
 status text not null default 'in_progress' check(status in ('in_progress','completed','skipped')),
 updated_at timestamptz not null default now(), primary key(user_id,player_id)
);
create index player_onboarding_player_idx on public.player_space_onboarding(player_id);
alter table public.player_space_onboarding enable row level security;
revoke all on public.player_space_onboarding from public,anon,authenticated;
grant select,insert,update on public.player_space_onboarding to authenticated;
create policy onboarding_read on public.player_space_onboarding for select to authenticated
 using(user_id=(select auth.uid()) and star_private.can_use_player(player_id));
create policy onboarding_insert on public.player_space_onboarding for insert to authenticated
 with check(user_id=(select auth.uid()) and star_private.can_use_player(player_id));
create policy onboarding_update on public.player_space_onboarding for update to authenticated
 using(user_id=(select auth.uid()) and star_private.can_use_player(player_id))
 with check(user_id=(select auth.uid()) and star_private.can_use_player(player_id));

-- Push is off until a person explicitly enables it. Preferences apply to their
-- own account; devices and encryption material are never shared with a family.
create table public.player_push_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 categories text[] not null default array['message','practice','session','goal','badge','cosmetic']::text[]
  check(cardinality(categories) between 0 and 6 and categories <@ array['message','practice','session','goal','badge','cosmetic']::text[]),
 quiet_hours boolean not null default true,
 consented_at timestamptz, updated_at timestamptz not null default now()
);
alter table public.player_push_preferences enable row level security;
revoke all on public.player_push_preferences from public,anon,authenticated;
grant select,insert,update on public.player_push_preferences to authenticated;
create function star_private.has_player_space(target_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.guardian_player_links where guardian_id=target_user)
 or exists(select 1 from public.player_account_links a join public.guardian_player_links g
 on g.player_id=a.player_id and g.guardian_id=a.approved_by where a.user_id=target_user)
$$;
revoke all on function star_private.has_player_space(uuid) from public,anon;
grant execute on function star_private.has_player_space(uuid) to authenticated;
create policy push_preferences_read on public.player_push_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy push_preferences_insert on public.player_push_preferences for insert to authenticated
 with check(user_id=(select auth.uid()) and (not enabled or (consented_at is not null and star_private.has_player_space((select auth.uid())))));
create policy push_preferences_update on public.player_push_preferences for update to authenticated using(user_id=(select auth.uid()))
 with check(user_id=(select auth.uid()) and (not enabled or (consented_at is not null and star_private.has_player_space((select auth.uid())))));

create table public.player_push_subscriptions (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null check(length(endpoint) between 20 and 4096),
 endpoint_hash text generated always as (md5(endpoint)) stored unique,
 p256dh text not null,auth text not null,created_at timestamptz not null default now(),last_seen_at timestamptz not null default now()
);
create index player_push_subscriptions_user_idx on public.player_push_subscriptions(user_id);
alter table public.player_push_subscriptions enable row level security;
revoke all on public.player_push_subscriptions from public,anon,authenticated;
grant select,delete on public.player_push_subscriptions to authenticated;
create policy push_subscription_read on public.player_push_subscriptions for select to authenticated using(user_id=(select auth.uid()));
create policy push_subscription_delete on public.player_push_subscriptions for delete to authenticated using(user_id=(select auth.uid()));

-- Validate both here and in the sender; subscriptions cannot turn the worker
-- into an arbitrary HTTP client. No local, custom-port or redirect endpoints.
create function star_private.valid_push_endpoint(endpoint text) returns boolean
language sql immutable set search_path='' as $$
 select length(endpoint)<=4096 and endpoint ~ '^https://(fcm\.googleapis\.com|([a-z0-9-]+\.)?push\.services\.mozilla\.com|([a-z0-9-]+\.)?push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/[^#[:space:]]+$'
$$;
revoke all on function star_private.valid_push_endpoint(text) from public,anon,authenticated;
create function public.register_player_push_subscription(subscription jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result uuid; existing_user uuid; ep text:=subscription->>'endpoint';
 k text:=subscription->'keys'->>'p256dh'; a text:=subscription->'keys'->>'auth';
begin
 if uid is null or not star_private.has_player_space(uid) or not exists(select 1 from public.player_push_preferences where user_id=uid and enabled) then
  raise exception 'Enable alerts on your linked account first' using errcode='42501'; end if;
 if ep is null or not star_private.valid_push_endpoint(ep) or k is null or k !~ '^[A-Za-z0-9_-]{87}$' or a is null or a !~ '^[A-Za-z0-9_-]{22}$' then
  raise exception 'Unsupported push subscription' using errcode='22023'; end if;
 -- Serialise a user's registrations so concurrent requests cannot exceed the cap.
 perform 1 from public.player_push_preferences where user_id=uid for update;
 select user_id into existing_user from public.player_push_subscriptions where endpoint_hash=md5(ep);
 if existing_user is not null and existing_user<>uid then raise exception 'Re-enable alerts for this device' using errcode='42501'; end if;
 if existing_user is null and (select count(*) from public.player_push_subscriptions where user_id=uid)>=5 then
  raise exception 'Five devices are already enabled. Turn off an old device first.' using errcode='22023'; end if;
 insert into public.player_push_subscriptions(user_id,endpoint,p256dh,auth) values(uid,ep,k,a)
 on conflict(endpoint_hash) do update set p256dh=excluded.p256dh,auth=excluded.auth,last_seen_at=now()
 where player_push_subscriptions.user_id=uid returning id into result;
 if result is null then raise exception 'Re-enable alerts for this device' using errcode='42501'; end if;
 return result;
end $$;
revoke all on function public.register_player_push_subscription(jsonb) from public,anon;
grant execute on function public.register_player_push_subscription(jsonb) to authenticated;

-- Vault holds the signing key and scheduler credential. Only the worker's
-- service role can fetch them; only a public signing key reaches the browser.
create table star_private.player_push_config (
 singleton boolean primary key default true check(singleton), public_key text not null,
 private_key_secret uuid not null,worker_secret uuid not null
);
alter table star_private.player_push_config enable row level security;
revoke all on star_private.player_push_config from public,anon,authenticated;
create function public.player_push_public_key() returns text
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not star_private.has_player_space(auth.uid()) then raise exception 'Linked account required' using errcode='42501'; end if;
 return (select public_key from star_private.player_push_config where singleton);
end $$;
revoke all on function public.player_push_public_key() from public,anon;
grant execute on function public.player_push_public_key() to authenticated;
create function public.player_push_worker_config() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('publicKey',c.public_key,'privateKey',p.decrypted_secret,'workerSecret',w.decrypted_secret)
 from star_private.player_push_config c join vault.decrypted_secrets p on p.id=c.private_key_secret
 join vault.decrypted_secrets w on w.id=c.worker_secret where c.singleton
$$;
revoke all on function public.player_push_worker_config() from public,anon,authenticated;
grant execute on function public.player_push_worker_config() to service_role;

create function star_private.push_user_can_access(uid uuid,pid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.guardian_player_links where guardian_id=uid and player_id=pid)
 or exists(select 1 from public.player_account_links a join public.guardian_player_links g
 on g.player_id=a.player_id and g.guardian_id=a.approved_by where a.user_id=uid and a.player_id=pid)
$$;
revoke all on function star_private.push_user_can_access(uuid,uuid) from public,anon,authenticated;
create function star_private.next_push_time(quiet boolean) returns timestamptz
language sql stable set search_path='' as $$
 select case when not quiet or (now() at time zone 'Europe/London')::time between time '08:00' and time '20:59:59.999999' then now()
 else (((now() at time zone 'Europe/London')::date + case when (now() at time zone 'Europe/London')::time>=time '21:00' then 1 else 0 end)+time '08:00') at time zone 'Europe/London' end
$$;
revoke all on function star_private.next_push_time(boolean) from public,anon,authenticated;
create table star_private.player_push_deliveries (
 id bigint generated always as identity primary key,
 notification_id uuid not null references public.player_notifications(id) on delete cascade,
 subscription_id uuid not null references public.player_push_subscriptions(id) on delete cascade,
 status text not null default 'queued' check(status in ('queued','sending','sent','failed','skipped')),
 attempts smallint not null default 0,available_at timestamptz not null default now(),
 claim_token uuid,claimed_at timestamptz,updated_at timestamptz not null default now(),
 last_status smallint,unique(notification_id,subscription_id)
);
create index player_push_delivery_due_idx on star_private.player_push_deliveries(available_at) where status='queued';
create index player_push_delivery_subscription_idx on star_private.player_push_deliveries(subscription_id);
alter table star_private.player_push_deliveries enable row level security;
revoke all on star_private.player_push_deliveries from public,anon,authenticated;
create function star_private.push_delivery_allowed(nid uuid,sid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.player_notifications n
 join public.player_push_subscriptions s on s.id=sid
 join public.player_push_preferences p on p.user_id=s.user_id
 where n.id=nid and p.enabled and n.category=any(p.categories)
 and (n.created_at>=s.created_at or n.source_key like 'reminder:%') and n.created_at>now()-interval '48 hours'
 and star_private.push_user_can_access(s.user_id,n.player_id)
 and not exists(select 1 from public.player_notification_reads r where r.user_id=s.user_id and r.notification_id=n.id)
 and (n.source_key not like 'reminder:%' or exists(select 1 from public.family_session_schedule f
 where f.player_id=n.player_id and f.starts_at>now() and n.source_key='reminder:'||f.id||':'||f.starts_at::text)))
$$;
revoke all on function star_private.push_delivery_allowed(uuid,uuid) from public,anon,authenticated;
create function star_private.queue_player_push() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into star_private.player_push_deliveries(notification_id,subscription_id,available_at)
 select new.id,s.id,star_private.next_push_time(p.quiet_hours)
 from public.player_push_subscriptions s join public.player_push_preferences p on p.user_id=s.user_id
 where p.enabled and new.category=any(p.categories) and star_private.push_user_can_access(s.user_id,new.player_id)
 on conflict do nothing;
 return new;
end $$;
revoke all on function star_private.queue_player_push() from public,anon,authenticated;
create trigger queue_player_push after insert on public.player_notifications for each row execute function star_private.queue_player_push();

create function public.claim_player_push_deliveries(batch_size integer default 25)
returns table(id bigint,claim_token uuid,endpoint text,p256dh text,auth text,category text,notification_id uuid)
language plpgsql security definer set search_path='' as $$
begin
 update star_private.player_push_deliveries q set status=case when attempts<5 then 'queued' else 'failed' end,available_at=now(),updated_at=now()
 where q.status='sending' and q.claimed_at<now()-interval '10 minutes';
 update star_private.player_push_deliveries q set status='skipped',updated_at=now()
 where q.status='queued' and not star_private.push_delivery_allowed(q.notification_id,q.subscription_id);
 update star_private.player_push_deliveries q set available_at=star_private.next_push_time(p.quiet_hours)
 from public.player_push_subscriptions s join public.player_push_preferences p on p.user_id=s.user_id
 where q.subscription_id=s.id and q.status='queued' and q.available_at<=now() and star_private.next_push_time(p.quiet_hours)>now();
 return query with candidates as (
 select q.id from star_private.player_push_deliveries q where q.status='queued' and q.available_at<=now()
 order by q.available_at,q.id limit greatest(1,least(coalesce(batch_size,25),100)) for update skip locked
 ), claimed as (
 update star_private.player_push_deliveries q set status='sending',claim_token=gen_random_uuid(),claimed_at=now(),attempts=q.attempts+1,updated_at=now()
 where q.id in(select c.id from candidates c) returning q.*)
 select q.id,q.claim_token,s.endpoint,s.p256dh,s.auth,n.category,q.notification_id
 from claimed q join public.player_push_subscriptions s on s.id=q.subscription_id join public.player_notifications n on n.id=q.notification_id;
end $$;
revoke all on function public.claim_player_push_deliveries(integer) from public,anon,authenticated;
grant execute on function public.claim_player_push_deliveries(integer) to service_role;
create function public.check_player_push_delivery(job_id bigint,token uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from star_private.player_push_deliveries q join public.player_push_subscriptions s on s.id=q.subscription_id
 join public.player_push_preferences p on p.user_id=s.user_id where q.id=job_id and q.claim_token=token and q.status='sending'
 and star_private.push_delivery_allowed(q.notification_id,q.subscription_id) and star_private.next_push_time(p.quiet_hours)<=now())
$$;
revoke all on function public.check_player_push_delivery(bigint,uuid) from public,anon,authenticated;
grant execute on function public.check_player_push_delivery(bigint,uuid) to service_role;
create function public.finish_player_push_delivery(job_id bigint,token uuid,outcome text,http_status integer default 0) returns void
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if outcome not in ('sent','gone','retry','failed','skipped') then raise exception 'Invalid delivery outcome'; end if;
 update star_private.player_push_deliveries q set
 status=case when outcome='retry' and q.attempts<5 then 'queued' when outcome='retry' then 'failed' when outcome='gone' then 'failed' else outcome end,
 available_at=case when outcome='retry' then now()+make_interval(mins=>least(60,power(2,q.attempts)::integer)) else q.available_at end,
 last_status=greatest(0,least(http_status,599)),updated_at=now()
 where q.id=job_id and q.claim_token=token and q.status='sending' returning subscription_id into sid;
 if outcome='gone' and sid is not null then delete from public.player_push_subscriptions where id=sid; end if;
end $$;
revoke all on function public.finish_player_push_delivery(bigint,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.finish_player_push_delivery(bigint,uuid,text,integer) to service_role;

-- Reminders and delivery continue when nobody has Player Space open.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create function star_private.tick_player_push() returns bigint
language plpgsql security definer set search_path='' as $$
declare request_id bigint; secret text;
begin
 if not exists(select 1 from star_private.player_push_config) then return null; end if;
 insert into public.player_notifications(player_id,category,title,body,tab,source_key)
 select f.player_id,'session','Your session is coming up',f.title||' · '||to_char(f.starts_at at time zone 'Europe/London','Dy DD Mon HH24:MI'),
 'home','reminder:'||f.id||':'||f.starts_at::text from public.family_session_schedule f
 where f.starts_at>now() and f.starts_at<=now()+interval '24 hours'
 and exists(select 1 from public.player_push_subscriptions s join public.player_push_preferences p on p.user_id=s.user_id
 where p.enabled and 'session'=any(p.categories) and star_private.push_user_can_access(s.user_id,f.player_id)) on conflict do nothing;
 -- A player may enable alerts after their in-portal reminder was created.
 insert into star_private.player_push_deliveries(notification_id,subscription_id,available_at)
 select n.id,s.id,star_private.next_push_time(p.quiet_hours) from public.player_notifications n
 cross join public.player_push_subscriptions s join public.player_push_preferences p on p.user_id=s.user_id
 where n.source_key like 'reminder:%' and star_private.push_delivery_allowed(n.id,s.id) on conflict do nothing;
 delete from star_private.player_push_deliveries where status in ('sent','failed','skipped') and updated_at<now()-interval '30 days';
 if not exists(select 1 from star_private.player_push_deliveries where (status='queued' and available_at<=now()) or (status='sending' and claimed_at<now()-interval '10 minutes')) then return null; end if;
 select v.decrypted_secret into secret from star_private.player_push_config c join vault.decrypted_secrets v on v.id=c.worker_secret where c.singleton;
 select net.http_post(url:='https://mgmzujtzncqubbwzvddh.supabase.co/functions/v1/player-push-worker',
 headers:=jsonb_build_object('Content-Type','application/json','x-star-worker-secret',secret),body:='{}'::jsonb,timeout_milliseconds:=30000) into request_id;
 return request_id;
end $$;
revoke all on function star_private.tick_player_push() from public,anon,authenticated;
select cron.schedule('star-player-phone-alerts','* * * * *','select star_private.tick_player_push()');
