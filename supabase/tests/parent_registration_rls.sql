begin;
create temp table registration_test_ids as select gen_random_uuid() guardian_a,gen_random_uuid() guardian_b;
grant select on registration_test_ids to authenticated;
insert into auth.users(id,aud,role) select id,'authenticated','authenticated' from registration_test_ids cross join lateral unnest(array[guardian_a,guardian_b]) id;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',guardian_a,'role','authenticated')::text,true) from registration_test_ids;
insert into public.guardian_profiles(user_id,display_name,contact_phone) select guardian_a,'Registration QA guardian',null from registration_test_ids;
insert into public.player_registrations(guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at) select guardian_a,'QA','Fixture',current_date-interval '13 years','prestige','submitted',now() from registration_test_ids;
do $$ begin
 if (select count(*) from public.guardian_profiles where user_id=(select guardian_a from registration_test_ids))<>1 then raise exception 'Parent profile read after save failed'; end if;
 if (select count(*) from public.player_registrations where guardian_id=(select guardian_a from registration_test_ids) and status<>'draft' and submitted_at is not null)<>1 then raise exception 'Submitted registration pricing eligibility failed'; end if;
 begin
  insert into public.player_registrations(guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at) select guardian_b,'QA','Spoofed',current_date-interval '13 years','prestige','submitted',now() from registration_test_ids;
  raise exception 'Spoofed guardian accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.player_registrations(guardian_id,player_first_name,player_last_name,date_of_birth,programme,status,submitted_at) select guardian_a,'QA','Fixture',current_date-interval '13 years','prestige','enrolled',now() from registration_test_ids;
  raise exception 'Self-enrolment accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',guardian_b,'role','authenticated')::text,true) from registration_test_ids;
do $$ begin
 if exists(select 1 from public.guardian_profiles where user_id=(select guardian_a from registration_test_ids)) then raise exception 'Another parent read profile'; end if;
 if exists(select 1 from public.player_registrations where guardian_id=(select guardian_a from registration_test_ids)) then raise exception 'Another parent read registration'; end if;
 if exists(select 1 from public.player_registrations where guardian_id=(select guardian_b from registration_test_ids) and status<>'draft' and submitted_at is not null) then raise exception 'Unregistered parent became pricing eligible'; end if;
end $$;
reset role;
rollback;
select 'PASS: parent profile, registration, pricing eligibility and cross-parent isolation. Fixtures rolled back.' as result;
