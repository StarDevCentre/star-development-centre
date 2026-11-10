-- Synthetic player, guardian and separate family. All fixtures roll back.
begin;
create temp table history_test(key text primary key,value text);
create temp table history_keys as select * from star_private.football_history_answers;
grant select on history_test, history_keys to authenticated;
do $$declare g uuid:=gen_random_uuid();o uuid:=gen_random_uuid();p uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;other_player uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) select id,'learning-'||id||'@example.invalid','authenticated','authenticated',now(),now(),now() from unnest(array[g,o,p,s]) id;
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic family'),(o,'Other synthetic family');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Learning','Synthetic','Assessment',true,s,s) returning id into c;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Other','Synthetic','Assessment',true,s,s) returning id into other_player;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s),(o,other_player,s);
 insert into public.player_account_links(user_id,player_id,approved_by) values(p,c,g);
 insert into history_test values('guardian',g::text),('other',o::text),('player',p::text),('core',c::text),('other_core',other_player::text);
 if has_function_privilege('anon','public.submit_football_history_quiz(uuid,smallint,integer[])','EXECUTE')
 or has_table_privilege('authenticated','star_private.football_history_answers','SELECT')
 or has_table_privilege('authenticated','public.player_history_progress','INSERT') then
  raise exception 'Unexpected history permissions';
 end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from history_test where key='guardian'),true);
do $$
declare pid uuid:=(select value::uuid from history_test where key='core');
 correct integer[]:=(select answers from history_keys where card_id=1);
 wrong integer[]:=correct;
 first_attempt public.player_history_progress;
 repeated public.player_history_progress;
begin
 wrong[1]:=(wrong[1]+1)%3;
 begin
  perform public.submit_football_history_quiz(pid,1::smallint,array[0,0,0,0]);
  raise exception 'Incomplete quiz accepted';
 exception when invalid_parameter_value then null; end;
 first_attempt:=public.submit_football_history_quiz(pid,1::smallint,wrong);
 if first_attempt.score is distinct from 4 or first_attempt.earned_at is not null
   or first_attempt.retry_at < now()+interval '19 minutes' then raise exception 'Failure or cooldown incorrect';end if;
 repeated:=public.submit_football_history_quiz(pid,1::smallint,correct);
 if repeated is distinct from first_attempt then raise exception 'Cooldown bypassed';end if;
 if (public.submit_football_history_quiz(pid,2::smallint,(select answers from history_keys where card_id=2))).score is distinct from 5 then
  raise exception 'Other stories should remain available';end if;
end$$;
reset role;
update public.player_history_progress set retry_at=now()-interval '1 second' where card_id=1
 and player_id=(select value::uuid from history_test where key='core');
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from history_test where key='player'),true);
do $$
declare pid uuid:=(select value::uuid from history_test where key='core');
 correct integer[]:=(select answers from history_keys where card_id=1);
 earned public.player_history_progress;
begin
 earned:=public.submit_football_history_quiz(pid,1::smallint,correct);
 if earned.score is distinct from 5 or earned.earned_at is null or earned.retry_at is not null then raise exception 'Card was not earned';end if;
 if public.submit_football_history_quiz(pid,1::smallint,array[0,0,0,0,0]) is distinct from earned
   or (select count(*) from public.player_history_progress where player_id=pid and earned_at is not null)<>2 then
  raise exception 'Replay changed the collection';end if;
end$$;
select set_config('request.jwt.claim.sub',(select value from history_test where key='other'),true);
do $$
declare pid uuid:=(select value::uuid from history_test where key='core');
begin
 if exists(select 1 from public.player_history_progress where player_id=pid) then raise exception 'Cross-family history read';end if;
 begin
  perform public.submit_football_history_quiz(pid,1::smallint,array[0,0,0,0,0]);
  raise exception 'Cross-family history write';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'PASS: five-question validation, 4/5 cooldown, expiry, 5/5 award, replay and family isolation.' as result;
