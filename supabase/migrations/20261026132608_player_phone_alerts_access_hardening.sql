-- Keep privileged implementations in the unexposed schema; public RPCs are invokers.
create function star_private.register_player_push_subscription(subscription jsonb) returns uuid
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
revoke all on function star_private.register_player_push_subscription(jsonb) from public,anon;
grant execute on function star_private.register_player_push_subscription(jsonb) to authenticated;
create or replace function public.register_player_push_subscription(subscription jsonb) returns uuid
language sql security invoker set search_path='' as $$select star_private.register_player_push_subscription(subscription)$$;
create function star_private.player_push_public_key() returns text
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not star_private.has_player_space(auth.uid()) then raise exception 'Linked account required' using errcode='42501'; end if;
 return (select public_key from star_private.player_push_config where singleton);
end $$;
revoke all on function star_private.player_push_public_key() from public,anon;
grant execute on function star_private.player_push_public_key() to authenticated;
create or replace function public.player_push_public_key() returns text
language sql stable security invoker set search_path='' as $$select star_private.player_push_public_key()$$;
create policy push_config_worker_only on star_private.player_push_config for all to service_role using(true) with check(true);
create policy push_queue_worker_only on star_private.player_push_deliveries for all to service_role using(true) with check(true);
