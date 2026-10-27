begin;
create temp table programme_qa as select gen_random_uuid() guardian_a,gen_random_uuid() guardian_b,gen_random_uuid() owner_id,gen_random_uuid() player_id,gen_random_uuid() source_a,gen_random_uuid() source_b;
grant select on programme_qa to authenticated;
insert into auth.users(id,aud,role) select id,'authenticated','authenticated' from programme_qa cross join lateral unnest(array[guardian_a,guardian_b,owner_id]) id;
insert into public.staff_members(user_id,role,active) select owner_id,'owner',true from programme_qa;
insert into public.guardian_profiles(user_id,display_name) select guardian_a,'Programme QA parent' from programme_qa union all select guardian_b,'Other QA parent' from programme_qa;
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) select player_id,'Programme QA','Player','1-to-1',true,owner_id,owner_id from programme_qa;
insert into public.guardian_player_links(guardian_id,player_id,approved_by) select guardian_a,player_id,owner_id from programme_qa;
insert into public.player_registrations(id,guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at,enrolled_player_id)
select source_a,guardian_a,'Programme QA','Player',current_date-interval '13 years','one-to-one','enrolled',now(),player_id from programme_qa;
insert into public.player_registrations(id,guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at)
select source_b,guardian_b,'Other QA','Player',current_date-interval '13 years','one-to-one','submitted',now() from programme_qa;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',guardian_a,'role','authenticated')::text,true) from programme_qa;
update public.guardian_profiles set display_name='Updated QA parent',contact_phone='07000000000' where user_id=(select guardian_a from programme_qa);
update public.guardian_profiles set display_name='Unauthorised edit' where user_id=(select guardian_b from programme_qa);
select public.star_request_player_programme(source_a,'prestige') from programme_qa;
do $$ begin
 if not exists(select 1 from public.guardian_profiles where user_id=(select guardian_a from programme_qa) and display_name='Updated QA parent' and contact_phone='07000000000') then raise exception 'TEST: own profile update failed'; end if;
 if (select count(*) from public.player_registrations where guardian_id=(select guardian_a from programme_qa) and programme='prestige' and status='submitted' and source_registration_id=(select source_a from programme_qa))<>1 then raise exception 'TEST: additional programme request failed'; end if;
 begin perform public.star_request_player_programme((select source_a from programme_qa),'prestige');raise exception 'TEST: duplicate request accepted';exception when raise_exception then if sqlerrm like 'TEST:%' then raise;end if;end;
 begin perform public.star_request_player_programme((select source_a from programme_qa),'sparks');raise exception 'TEST: age restriction bypassed';exception when raise_exception then if sqlerrm like 'TEST:%' then raise;end if;end;
 begin perform public.star_request_player_programme((select source_b from programme_qa),'prestige');raise exception 'TEST: cross-parent source accepted';exception when raise_exception then if sqlerrm like 'TEST:%' then raise;end if;end;
 begin
  insert into public.player_registrations(guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at,source_registration_id)
  select guardian_a,'Other QA','Player',current_date-interval '13 years','prestige','submitted',now(),source_b from programme_qa;
  raise exception 'TEST: forged source insert accepted';
 exception when raise_exception then if sqlerrm like 'TEST:%' then raise;end if;end;
 update public.player_registrations set status='accepted' where programme='prestige' and guardian_id=(select guardian_a from programme_qa);
 if exists(select 1 from public.player_registrations where programme='prestige' and status<>'submitted' and guardian_id=(select guardian_a from programme_qa)) then raise exception 'TEST: parent self-approved';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true) from programme_qa;
update public.player_registrations set status='accepted' where guardian_id=(select guardian_a from programme_qa) and programme='prestige';
do $$ declare enrolled_id uuid; begin
 select public.star_enrol_approved_application(id,true) into enrolled_id from public.player_registrations where guardian_id=(select guardian_a from programme_qa) and programme='prestige';
 if enrolled_id<>(select player_id from programme_qa) then raise exception 'TEST: duplicate coaching player created';end if;
 if (select count(*) from public.player_registrations where guardian_id=(select guardian_a from programme_qa) and status='enrolled' and enrolled_player_id=(select player_id from programme_qa))<>2 then raise exception 'TEST: programme enrolments did not share the player';end if;
 if (select display_name from public.guardian_profiles where user_id=(select guardian_b from programme_qa))<>'Other QA parent' then raise exception 'TEST: cross-parent profile edited';end if;
end $$;
reset role;
rollback;
select 'PASS: own profile edits, age and duplicate guards, cross-parent isolation, staff-only approval, and additional programme enrolment reusing one player. All fixtures rolled back.' as result;
