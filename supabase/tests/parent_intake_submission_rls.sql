-- Parent-only submission requires no player account. All fixtures roll back.
begin;
create temp table parent_intake_test(key text primary key,value text);
grant select,insert,update on parent_intake_test to authenticated;
do $$declare g uuid:=gen_random_uuid();o uuid:=gen_random_uuid();begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) values(g,'parent-submit-'||g||'@example.invalid','authenticated','authenticated',now(),now(),now()),(o,'other-submit-'||o||'@example.invalid','authenticated','authenticated',now(),now(),now());
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic parent');insert into parent_intake_test values('guardian',g::text),('other',o::text);
 if has_function_privilege('anon','public.intake_submit(uuid,integer,text,text,date,jsonb,text,boolean)','EXECUTE') then raise exception 'Anonymous submission is exposed';end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from parent_intake_test where key='guardian'),true);
do $$declare r public.player_intakes;begin r:=public.intake_create('guardian');insert into parent_intake_test values('intake',r.id::text);end$$;
reset role;
do $$declare profile_id uuid:=(select value::uuid from parent_intake_test where key='intake');path text;begin
 path:=profile_id||'/'||gen_random_uuid()||'.jpg';insert into storage.objects(bucket_id,name,metadata) values('player-intake-photos',path,'{"mimetype":"image/jpeg","size":123}');insert into parent_intake_test values('photo',path);
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select value from parent_intake_test where key='guardian'),true);
do $$declare r public.player_intakes;d jsonb;old_version int;requested_at timestamptz;begin
 select * into r from public.player_intakes where id=(select value::uuid from parent_intake_test where key='intake');old_version:=r.version;
 begin perform public.intake_submit(r.id,r.version,'Partial','Profile',date '2014-05-10','{}',(select value from parent_intake_test where key='photo'),true);raise exception 'TEST FAILED incomplete submission allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 if exists(select 1 from public.player_intakes where id=r.id and (version<>old_version or completed_at is not null or guardian_reviewed_at is not null or assessment_requested_at is not null)) then raise exception 'Failed submission left a partial update';end if;
 select jsonb_object_agg(k,'Synthetic answer') into d from unnest(array['address','postcode','contact_name','relationship','contact_phone','contact_email','emergency_name','emergency_relationship','emergency_phone','experience','playing_history','weekly_football','positions','stronger_foot','enjoys','strengths','challenges','goals','confidence','learning','support','medical','allergies','medication','injuries','emergency_plan','training_top_size','boot_size','availability']) k;
 d:=d||'{"medical":"None known","coaching_media":"No","public_photos":"No","public_video":"No","public_name":"No"}'::jsonb;
 begin perform public.intake_submit(r.id,r.version,'Synthetic','Player',date '2014-05-10',d,(select value from parent_intake_test where key='photo'),false);raise exception 'TEST FAILED submission without parent confirmation allowed';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
 r:=public.intake_submit(r.id,r.version,'Synthetic','Player',date '2014-05-10',d,(select value from parent_intake_test where key='photo'),true);
 if r.player_user_id is not null or r.completed_at is null or r.guardian_reviewed_at is null or r.assessment_status<>'requested' or r.assessment_requested_at is null then raise exception 'Unlinked parent could not complete the single submission';end if;
 if r.guardian_reviewed_by is distinct from auth.uid() then raise exception 'Incorrect consent actor';end if;
 requested_at:=r.assessment_requested_at;
 r:=public.intake_submit(r.id,r.version,r.first_name,r.last_name,r.date_of_birth,r.details,r.photo_path,true);
 if r.assessment_requested_at is distinct from requested_at then raise exception 'Resubmission duplicated the assessment request';end if;
 insert into parent_intake_test values('version',r.version::text),('details',r.details::text);
end$$;
select set_config('request.jwt.claim.sub',(select value from parent_intake_test where key='other'),true);
do $$declare target_id uuid:=(select value::uuid from parent_intake_test where key='intake');begin
 if exists(select 1 from public.player_intakes where id=target_id) then raise exception 'Submission leaked across families';end if;
 begin perform public.intake_submit(target_id,(select value::int from parent_intake_test where key='version'),'Intruder','Player',date '2014-05-10',(select value::jsonb from parent_intake_test where key='details'),(select value from parent_intake_test where key='photo'),true);raise exception 'TEST FAILED unrelated account submitted another family profile';exception when others then if sqlerrm like 'TEST FAILED%' then raise;end if;end;
end$$;
reset role;
rollback;
select 'PASS: parent submits without player login; form validation and consent required; atomic rollback; no duplicate request; unrelated/anonymous accounts blocked; fixtures rolled back' as result;
