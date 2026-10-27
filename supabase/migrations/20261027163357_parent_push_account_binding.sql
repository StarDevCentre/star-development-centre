-- Bind a device opt-in to the account that made the explicit request.
create or replace function star_private.register_parent_push_subscription(subscription jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result uuid; existing_user uuid; ep text:=subscription->>'endpoint';
 k text:=subscription->'keys'->>'p256dh'; a text:=subscription->'keys'->>'auth';
begin
 if subscription->>'account_id' is distinct from uid::text then raise exception 'Sign in again before enabling this device' using errcode='42501';end if;
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

