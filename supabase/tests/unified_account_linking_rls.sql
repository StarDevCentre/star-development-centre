-- Tests real RPCs/RLS with synthetic users. No family fixtures are retained.
begin;
create temp table account_link_test(key text primary key,value text);
grant select,insert,update on account_link_test to authenticated;
do $$declare g uuid:=gen_random_uuid();p uuid:=gen_random_uuid();o uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) values
 (g,'link-parent-'||g||'@example.invalid','authenticated','authenticated',now(),now(),now()),
 (o,'link-other-'||o||'@example.invalid','authenticated','authenticated',now(),now(),now()),
 (s,'link-staff-'||s||'@example.invalid','authenticated','authenticated',now(),now(),now());
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic parent');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Existing','Player','Development',true,s,s) returning id into c;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s);
 insert into account_link_test values('guardian',g::text),('player',p::text),('other',o::text),('core',c::text),('email','link-player-'||p||'@example.invalid');
 if has_function_privilege('anon','public.pending_account_links()','EXECUTE') or has_function_privilege('anon','public.accept_account_link(uuid)','EXECUTE') or has_function_privilege('anon','public.request_player_link(uuid,text)','EXECUTE') or has_function_privilege('anon','public.request_intake_link(uuid,text)','EXECUTE') or has_table_privilege('authenticated','star_private.intake_invitations','SELECT') then raise exception 'Unexpected invitation permissions';end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='guardian'),true);
do $$declare r public.player_intakes;begin r:=public.intake_create('guardian');insert into account_link_test values('intake',r.id::text);end$$;
reset role;
do $$declare path text:=(select value from account_link_test where key='intake')||'/'||gen_random_uuid()||'.jpg';begin insert into storage.objects(bucket_id,name,metadata) values('player-intake-photos',path,'{"mimetype":"image/jpeg","size":123}');insert into account_link_test values('photo',path);end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='guardian'),true);
do $$declare r public.player_intakes;d jsonb;begin
 select * into r from public.player_intakes where id=(select value::uuid from account_link_test where key='intake');
 select jsonb_object_agg(k,'Synthetic answer') into d from unnest(array['address','postcode','contact_name','relationship','contact_phone','contact_email','emergency_name','emergency_relationship','emergency_phone','experience','playing_history','weekly_football','positions','stronger_foot','enjoys','strengths','challenges','goals','confidence','learning','support','medical','allergies','medication','injuries','emergency_plan','training_top_size','boot_size','availability']) k;
 d:=d||'{"medical":"None known","coaching_media":"No","public_photos":"No","public_video":"No","public_name":"No"}'::jsonb;
 r:=public.intake_submit(r.id,r.version,'Synthetic','Intake',date '2014-05-10',d,(select value from account_link_test where key='photo'),true);
 if r.portal_player_id is null or r.player_user_id is not null or not exists(select 1 from public.coaching_players where id=r.portal_player_id and programme='Assessment') then raise exception 'Parent submission did not create its own assessment profile';end if;
 if not exists(select 1 from public.guardian_player_links where player_id=r.portal_player_id and guardian_id=auth.uid() and onboarding_intake_id=r.id and approved_by is null) then raise exception 'Onboarding consent reference missing or staff approval fabricated';end if;
 insert into account_link_test values('mapped',r.portal_player_id::text);
 -- Invite before the player's auth account exists; this path must keep both links together.
 perform public.request_player_link(r.portal_player_id,(select value from account_link_test where key='email'));
end$$;
reset role;
do $$declare invitation uuid;begin
 select id into invitation from star_private.intake_invitations where intake_id=(select value::uuid from account_link_test where key='intake') and used_at is null;
 if invitation is null then raise exception 'Email invitation not created for mapped onboarding';end if;
 insert into account_link_test values('invitation',invitation::text);
 -- The same invitation is inaccessible until the invited email is verified.
 insert into auth.users(id,email,aud,role,created_at,updated_at) values((select value::uuid from account_link_test where key='player'),(select value from account_link_test where key='email'),'authenticated','authenticated',now(),now());
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='other'),true);
do $$begin
 if exists(select 1 from public.pending_account_links()) then raise exception 'Other email can enumerate invitations';end if;
 if exists(select 1 from public.coaching_players where id=(select value::uuid from account_link_test where key='mapped')) then raise exception 'Other family sees assessment profile';end if;
 begin perform public.accept_account_link((select value::uuid from account_link_test where key='invitation'));raise exception 'TEST FAILED wrong email accepted';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.request_player_link((select value::uuid from account_link_test where key='core'),'new@example.invalid');raise exception 'TEST FAILED unrelated guardian invitation';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin insert into public.guardian_player_links(guardian_id,player_id,onboarding_intake_id) values(auth.uid(),(select value::uuid from account_link_test where key='mapped'),(select value::uuid from account_link_test where key='intake'));raise exception 'TEST FAILED direct family link allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='player'),true);
do $$begin begin perform public.pending_account_links();raise exception 'TEST FAILED unverified account can access invitations';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;end$$;
reset role;
update auth.users set email_confirmed_at=now() where id=(select value::uuid from account_link_test where key='player');
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='player'),true);
do $$declare target uuid;begin
 if (select count(*) from public.pending_account_links() where player_name='Synthetic Intake')<>1 then raise exception 'Named invitation not visible to verified recipient';end if;
 target:=public.accept_account_link((select value::uuid from account_link_test where key='invitation'));
 if target<>(select value::uuid from account_link_test where key='intake') then raise exception 'Incorrect profile accepted';end if;
 if not star_private.is_player((select value::uuid from account_link_test where key='mapped')) then raise exception 'Accepted onboarding does not grant Player Space';end if;
 if not exists(select 1 from public.player_account_links where user_id=auth.uid() and player_id=(select value::uuid from account_link_test where key='mapped')) or not exists(select 1 from public.player_space_profiles where player_id=(select value::uuid from account_link_test where key='mapped')) then raise exception 'Player Space loader cannot read connected profile';end if;
 if public.player_ball_progress((select value::uuid from account_link_test where key='mapped'))<>0 then raise exception 'New profile has unexpected sessions';end if;
 if not exists(select 1 from storage.objects where bucket_id='player-intake-photos' and name=(select value from account_link_test where key='photo')) then raise exception 'Connected player cannot read private profile photo';end if;
 if exists(select 1 from public.coaching_players where id=(select value::uuid from account_link_test where key='core')) then raise exception 'Player gained access to another player in same family';end if;
 begin perform public.accept_account_link((select value::uuid from account_link_test where key='invitation'));raise exception 'TEST FAILED invitation replay';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
end$$;
-- Simulate a new sign-in; access is stored, not a temporary UI state.
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='guardian'),true);
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='player'),true);
do $$begin if not star_private.is_player((select value::uuid from account_link_test where key='mapped')) or exists(select 1 from public.pending_account_links()) then raise exception 'Fresh sign-in lost its link or still requires an invitation';end if;end$$;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='guardian'),true);
do $$declare r public.player_intakes;begin
 select * into r from public.player_intakes where id=(select value::uuid from account_link_test where key='intake');
 r:=public.intake_submit(r.id,r.version,r.first_name,r.last_name,r.date_of_birth,r.details,r.photo_path,true);
 if r.portal_player_id<>(select value::uuid from account_link_test where key='mapped') then raise exception 'Resubmission created a second Player Space';end if;
 delete from public.player_account_links where user_id=(select value::uuid from account_link_test where key='player');
 if exists(select 1 from public.player_intakes where id=r.id and player_user_id is not null) then raise exception 'Revoking player access left onboarding linked';end if;
end$$;
reset role;
delete from public.guardian_player_links where guardian_id=(select value::uuid from account_link_test where key='guardian') and player_id=(select value::uuid from account_link_test where key='mapped');
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='guardian'),true);
do $$declare r public.player_intakes;begin
 select * into r from public.player_intakes where id=(select value::uuid from account_link_test where key='intake');
 begin perform public.intake_submit(r.id,r.version,r.first_name,r.last_name,r.date_of_birth,r.details,r.photo_path,true);raise exception 'TEST FAILED saved intake restored staff-revoked family access';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 if exists(select 1 from public.guardian_player_links where player_id=r.portal_player_id) then raise exception 'Revoked family link was restored';end if;
 -- Existing enrolled players use the same email-and-accept flow.
 perform public.request_player_link((select value::uuid from account_link_test where key='core'),(select value from account_link_test where key='email'));
end$$;
reset role;
insert into account_link_test select 'core_invitation',id::text from star_private.intake_invitations where portal_player_id=(select value::uuid from account_link_test where key='core') and used_at is null;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from account_link_test where key='player'),true);
do $$begin
 if star_private.is_player((select value::uuid from account_link_test where key='mapped')) then raise exception 'Revoked player retained Player Space';end if;
 perform public.accept_account_link((select value::uuid from account_link_test where key='core_invitation'));
 if not star_private.is_player((select value::uuid from account_link_test where key='core')) then raise exception 'Existing enrolled player cannot accept email invitation';end if;
end$$;
reset role;
rollback;
select 'PASS: parent-only submission opens own Assessment profile; invitation before signup; verified recipient only; named one-click acceptance; stable fresh sign-in; private photo; family isolation; no second profile; revocation consistency; staff revocation cannot be bypassed; enrolled-player email invitations; all fixtures rolled back' as result;
