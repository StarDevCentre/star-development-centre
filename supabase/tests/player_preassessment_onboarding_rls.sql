-- Synthetic users only. All fixtures and writes are rolled back.
begin;
create temp table intake_test_state(key text primary key,value text);
grant select,insert,update on intake_test_state to authenticated;
do $$declare g uuid:=gen_random_uuid();p uuid:=gen_random_uuid();o uuid:=gen_random_uuid();u uuid:=gen_random_uuid();begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) values(g,'intake-parent-'||g||'@example.invalid','authenticated','authenticated',now(),now(),now()),(p,'intake-player-'||p||'@example.invalid','authenticated','authenticated',now(),now(),now()),(o,'intake-other-'||o||'@example.invalid','authenticated','authenticated',now(),now(),now()),(u,'intake-unverified-'||u||'@example.invalid','authenticated','authenticated',null,now(),now());
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic parent');
 insert into intake_test_state values('guardian',g::text),('player',p::text),('other',o::text),('unverified',u::text),('player_email','intake-player-'||p||'@example.invalid'),('manager',(select user_id::text from public.staff_members where active and role in ('owner','manager') limit 1));
 if has_table_privilege('anon','public.player_intakes','SELECT') or has_table_privilege('authenticated','public.player_intakes','UPDATE') or has_function_privilege('anon','public.intake_create(text)','EXECUTE') then raise exception 'Unexpected direct or anonymous permissions';end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from intake_test_state where key='guardian'),true);
do $$declare r public.player_intakes;code text;begin
 r:=public.intake_create('guardian');insert into intake_test_state values('intake',r.id::text);
 if r.guardian_id is distinct from auth.uid() or r.player_user_id is not null then raise exception 'Incorrect new-profile ownership';end if;
 begin perform public.intake_request(r.id,r.version);raise exception 'TEST FAILED incomplete request allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 code:=public.intake_invite(r.id,(select value from intake_test_state where key='player_email'));insert into intake_test_state values('code',code);
end$$;
reset role;
do $$declare target_id uuid:=(select value::uuid from intake_test_state where key='intake');path text;begin path:=target_id||'/'||gen_random_uuid()||'.jpg';insert into storage.objects(bucket_id,name,metadata) values('player-intake-photos',path,'{"mimetype":"image/jpeg","size":123}');insert into intake_test_state values('photo',path);end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from intake_test_state where key='other'),true);
do $$declare target_id uuid:=(select value::uuid from intake_test_state where key='intake');begin
 if exists(select 1 from public.player_intakes where player_intakes.id=target_id) then raise exception 'Unrelated family read allowed';end if;
 if exists(select 1 from storage.objects where bucket_id='player-intake-photos' and name=(select value from intake_test_state where key='photo')) then raise exception 'Unrelated photo read allowed';end if;
 begin perform public.intake_save(target_id,1,'Intruder','Test',null,'{}',null,false);raise exception 'TEST FAILED unrelated update allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.intake_claim((select value from intake_test_state where key='code'));raise exception 'TEST FAILED wrong-email claim allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.intake_assessment(target_id,1,'confirmed',now()+interval '1 day','Test venue','');raise exception 'TEST FAILED nonstaff scheduling allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub',(select value from intake_test_state where key='unverified'),true);
do $$begin begin perform public.intake_create('player');raise exception 'TEST FAILED unverified creation allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;end$$;
select set_config('request.jwt.claim.sub',(select value from intake_test_state where key='player'),true);
do $$declare r public.player_intakes;begin r:=public.intake_claim((select value from intake_test_state where key='code'));if r.player_user_id is distinct from auth.uid() then raise exception 'Player link failed';end if;
 begin perform public.intake_claim((select value from intake_test_state where key='code'));raise exception 'TEST FAILED invitation reuse allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 begin perform public.intake_review(r.id,r.version,true);raise exception 'TEST FAILED player acting as parent allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 if not exists(select 1 from storage.objects where name=(select value from intake_test_state where key='photo')) then raise exception 'Linked player cannot read photo';end if;
end$$;
select set_config('request.jwt.claim.sub',(select value from intake_test_state where key='guardian'),true);
do $$declare r public.player_intakes;d jsonb;begin
 select * into r from public.player_intakes where id=(select value::uuid from intake_test_state where key='intake');
 select jsonb_object_agg(k,'Synthetic answer') into d from unnest(array['address','postcode','contact_name','relationship','contact_phone','contact_email','emergency_name','emergency_relationship','emergency_phone','experience','playing_history','weekly_football','positions','stronger_foot','enjoys','strengths','challenges','goals','confidence','learning','support','medical','allergies','medication','injuries','emergency_plan','training_top_size','boot_size','availability']) k;
 d:=d||'{"medical":"None known","coaching_media":"No","public_photos":"No","public_video":"No","public_name":"No"}'::jsonb;
 r:=public.intake_save(r.id,r.version,'Synthetic','Player',date '2014-05-10',d,(select value from intake_test_state where key='photo'),true);
 begin perform public.intake_save(r.id,r.version-1,'Stale','Player',r.date_of_birth,d,r.photo_path,true);raise exception 'TEST FAILED stale save allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 r:=public.intake_review(r.id,r.version,true);
 r:=public.intake_request(r.id,r.version);
 if r.assessment_status<>'requested' then raise exception 'Valid free assessment request failed';end if;
 begin perform public.intake_request(r.id,r.version);raise exception 'TEST FAILED duplicate assessment allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
end$$;
select set_config('request.jwt.claim.sub',(select value from intake_test_state where key='manager'),true);
do $$declare r public.player_intakes;begin select * into r from public.player_intakes where id=(select value::uuid from intake_test_state where key='intake');if r.id is null then raise exception 'Manager cannot read request';end if;r:=public.intake_assessment(r.id,r.version,'confirmed',now()+interval '1 day','Synthetic venue','Family-visible arrangements');if r.assessment_status<>'confirmed' then raise exception 'Manager confirmation failed';end if;end$$;
select set_config('request.jwt.claim.sub',(select value from intake_test_state where key='player'),true);
do $$declare r public.player_intakes;begin select * into r from public.player_intakes where id=(select value::uuid from intake_test_state where key='intake');r:=public.intake_save(r.id,r.version,r.first_name,r.last_name,r.date_of_birth,r.details||'{"goals":"Updated goal"}',r.photo_path,true);if r.guardian_reviewed_at is not null then raise exception 'Player edit did not invalidate parent review';end if;end$$;
reset role;
rollback;
select 'PASS: ownership, private photographs, verified email invitations, replay prevention, guardian review, version conflicts, assessment prerequisites and manager-only scheduling; synthetic fixtures rolled back' as result;
