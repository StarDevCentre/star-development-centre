-- Synthetic player, guardian and separate family. All fixtures roll back.
begin;
create temp table history_test(key text primary key,value text);
create temp table history_keys as select * from star_private.football_history_answers;
grant select on history_test, history_keys to authenticated;
do $$declare g uuid:=gen_random_uuid();o uuid:=gen_random_uuid();p uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;other_player uuid;junior uuid;missing_dob uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) select id,'learning-'||id||'@example.invalid','authenticated','authenticated',now(),now(),now() from unnest(array[g,o,p,s]) id;
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic family'),(o,'Other synthetic family');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Learning','Synthetic','Assessment',true,s,s) returning id into c;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Other','Synthetic','Assessment',true,s,s) returning id into other_player;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
 values('Sparks','Synthetic','Assessment',true,s,s) returning id into junior;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by)
 values('Missing DOB','Synthetic','Assessment',true,s,s) returning id into missing_dob;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s),(o,other_player,s),(g,junior,s),(g,missing_dob,s);
 insert into public.player_intakes(creator_id,guardian_id,portal_player_id,date_of_birth) values
 (g,g,c,((now() at time zone 'Europe/London')::date-interval '11 years')::date),
 (g,g,junior,((now() at time zone 'Europe/London')::date-interval '11 years')::date+1);
 insert into history_test values('junior',junior::text),('missing_dob',missing_dob::text);
 insert into public.player_account_links(user_id,player_id,approved_by) values(p,c,g);
 insert into history_test values('guardian',g::text),('other',o::text),('player',p::text),('core',c::text),('other_core',other_player::text);
 if has_function_privilege('anon','public.submit_football_history_quiz(uuid,smallint,integer[])','EXECUTE')
 or has_function_privilege('anon','public.football_history_edition(uuid)','EXECUTE')
 or has_function_privilege('authenticated','star_private.submit_football_history_quiz(uuid,smallint,integer[])','EXECUTE')
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
select set_config('request.jwt.claim.sub',(select value from history_test where key='guardian'),true);
do $$
declare older uuid:=(select value::uuid from history_test where key='core');
 younger uuid:=(select value::uuid from history_test where key='junior');
 unknown_age uuid:=(select value::uuid from history_test where key='missing_dob');
 right_answers integer[]:=(select answers from history_keys where card_id=101);
 special_card smallint;
 special_answers integer[];
begin
 if public.football_history_edition(older) <> 'trailblazers'
  or public.football_history_edition(younger) <> 'sparks'
  or public.football_history_edition(unknown_age) <> 'unknown' then raise exception 'Edition age boundary failed';end if;
 begin
  perform public.submit_football_history_quiz(younger,1::smallint,(select answers from history_keys where card_id=1));
  raise exception 'Younger player received Trailblazers';
 exception when insufficient_privilege then null;end;
 begin
  perform public.submit_football_history_quiz(older,101::smallint,right_answers);
  raise exception 'Older player received Sparks';
 exception when insufficient_privilege then null;end;
 begin
  perform public.submit_football_history_quiz(unknown_age,101::smallint,right_answers);
  raise exception 'Unknown date of birth received award';
 exception when insufficient_privilege then null;end;
 foreach special_card in array array[31,32,33,34,35,36,37,38,39]::smallint[] loop
  select answers into special_answers from history_keys where card_id=special_card;
  begin
   perform public.submit_football_history_quiz(younger,special_card,special_answers);
   raise exception 'Younger player received special edition %',special_card;
  exception when insufficient_privilege then null;end;
  if (public.submit_football_history_quiz(older,special_card,special_answers)).earned_at is null then
   raise exception 'Special edition % was not earned',special_card;end if;
 end loop;
 if (public.submit_football_history_quiz(younger,101::smallint,right_answers)).earned_at is null then
  raise exception 'Sparks card was not earned';end if;
 if exists(select 1 from public.player_history_progress where player_id=younger and card_id=1) then
  raise exception 'Sparks incorrectly earned a Trailblazers card';end if;
end$$;
reset role;
update public.player_intakes set date_of_birth=((now() at time zone 'Europe/London')::date-interval '11 years')::date
 where portal_player_id=(select value::uuid from history_test where key='junior');
set local role authenticated;
do $$
declare younger uuid:=(select value::uuid from history_test where key='junior');
begin
 if public.football_history_edition(younger) <> 'trailblazers' then raise exception 'No switch on eleventh birthday';end if;
 if not exists(select 1 from public.player_history_progress where player_id=younger and card_id=101 and earned_at is not null) then
  raise exception 'Sparks keepsake lost on birthday';end if;
end$$;
select set_config('request.jwt.claim.sub',(select value from history_test where key='other'),true);
do $$
declare pid uuid:=(select value::uuid from history_test where key='core');
begin
 if exists(select 1 from public.player_history_progress where player_id=pid) then raise exception 'Cross-family history read';end if;
 begin
  perform public.football_history_edition(pid);raise exception 'Cross-family edition read';
 exception when insufficient_privilege then null;end;
 begin
  perform public.submit_football_history_quiz(pid,1::smallint,array[0,0,0,0,0]);
  raise exception 'Cross-family history write';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'PASS: five-question validation, 4/5 cooldown, expiry, 5/5 award, replay, edition age boundary, special edition award and age restriction, birthday keepsakes and family isolation.' as result;
