begin;
select set_config('star.gm',gen_random_uuid()::text,true),set_config('star.gc',gen_random_uuid()::text,true),set_config('star.gg',gen_random_uuid()::text,true),set_config('star.gu',gen_random_uuid()::text,true),set_config('star.gp',gen_random_uuid()::text,true),set_config('star.go',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('star.gm')::uuid),(current_setting('star.gc')::uuid),(current_setting('star.gg')::uuid),(current_setting('star.gu')::uuid);
insert into public.staff_members(user_id,role,active) values(current_setting('star.gm')::uuid,'manager',true),(current_setting('star.gc')::uuid,'coach',true);
insert into public.coaching_players(id,first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values(current_setting('star.gp')::uuid,'Gallery','Test A','Development',true,current_setting('star.gm')::uuid,current_setting('star.gm')::uuid),(current_setting('star.go')::uuid,'Gallery','Test B','Development',true,current_setting('star.gm')::uuid,current_setting('star.gm')::uuid);
insert into public.coaching_assignments(player_id,staff_user_id) values(current_setting('star.gp')::uuid,current_setting('star.gc')::uuid);
insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(current_setting('star.gg')::uuid,current_setting('star.gp')::uuid,current_setting('star.gm')::uuid);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gm'),'role','authenticated')::text,true);
set local role authenticated;
do $$begin
 begin perform public.set_player_media_consent(current_setting('star.gp')::uuid,true);raise exception 'Manager granted parent permission';exception when insufficient_privilege then null;end;
 begin perform public.reserve_player_media(current_setting('star.gp')::uuid,'No permission','','image/jpeg',12);raise exception 'Upload reserved without permission';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gg'),'role','authenticated')::text,true);
select (public.set_player_media_consent(current_setting('star.gp')::uuid,true)).allowed;
do $$begin
 begin perform public.set_player_media_consent(current_setting('star.go')::uuid,true);raise exception 'Guardian granted another player permission';exception when insufficient_privilege then null;end;
 begin perform public.reserve_player_media(current_setting('star.gp')::uuid,'Guardian upload','','image/jpeg',12);raise exception 'Guardian uploaded';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gc'),'role','authenticated')::text,true);
select set_config('star.gmedia',(public.reserve_player_media(current_setting('star.gp')::uuid,'Private progress','A football detail','image/jpeg',12)).id::text,true);
do $$begin
 begin perform public.reserve_player_media(current_setting('star.go')::uuid,'Unassigned','','image/jpeg',12);raise exception 'Unassigned coach uploaded';exception when insufficient_privilege then null;end;
 begin perform public.reserve_player_media(current_setting('star.gp')::uuid,'Invalid','','text/html',12);raise exception 'Unsupported type accepted';exception when check_violation then null;end;
 begin perform public.reserve_player_media(current_setting('star.gp')::uuid,'Oversized','','image/jpeg',8388609);raise exception 'Oversize accepted';exception when check_violation then null;end;
 begin perform public.change_player_media(current_setting('star.gmedia')::uuid,1,'finish');raise exception 'Missing upload finalised';exception when check_violation then null;end;
end$$;
-- Storage metadata fixtures only: no physical files. This transaction is rolled back.
insert into storage.objects(bucket_id,name,owner_id,metadata) select 'player-coaching-media',object_path,current_setting('star.gc'),jsonb_build_object('size',12,'mimetype','image/jpeg') from public.player_media where id=current_setting('star.gmedia')::uuid;
select (public.change_player_media(current_setting('star.gmedia')::uuid,1,'finish')).status;
do $$begin
 begin perform public.change_player_media(current_setting('star.gmedia')::uuid,2,'share');raise exception 'Coach shared';exception when insufficient_privilege then null;end;
 begin update public.player_media set status='shared' where id=current_setting('star.gmedia')::uuid;raise exception 'Direct status update allowed';exception when insufficient_privilege then null;end;
 if (select count(*) from storage.objects where bucket_id='player-coaching-media' and name=(select object_path from public.player_media where id=current_setting('star.gmedia')::uuid))<>1 then raise exception 'Coach cannot view draft';end if;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gg'),'role','authenticated')::text,true);
do $$begin
 if exists(select 1 from public.player_media where id=current_setting('star.gmedia')::uuid) then raise exception 'Draft visible to parent';end if;
 if exists(select 1 from storage.objects where bucket_id='player-coaching-media') then raise exception 'Draft object visible to parent';end if;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gm'),'role','authenticated')::text,true);
select (public.change_player_media(current_setting('star.gmedia')::uuid,2,'share')).status;
do $$begin
 begin perform public.change_player_media(current_setting('star.gmedia')::uuid,2,'remove');raise exception 'Stale revision accepted';exception when serialization_failure then null;end;
 begin perform public.change_player_media(current_setting('star.gmedia')::uuid,null,'remove');raise exception 'Null revision accepted';exception when serialization_failure then null;end;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gu'),'role','authenticated')::text,true);
do $$begin
 if exists(select 1 from public.player_media where id=current_setting('star.gmedia')::uuid) or exists(select 1 from storage.objects where bucket_id='player-coaching-media') then raise exception 'Unlinked account can read media';end if;
 begin perform public.change_player_media(current_setting('star.gmedia')::uuid,3,'remove');raise exception 'Unlinked account removed media';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gg'),'role','authenticated')::text,true);
do $$begin
 if (select count(*) from public.player_media where id=current_setting('star.gmedia')::uuid)<>1 then raise exception 'Linked parent cannot view shared item';end if;
 if not exists(select 1 from storage.objects where bucket_id='player-coaching-media') then raise exception 'Linked parent cannot read file';end if;
end$$;
select (public.set_player_media_consent(current_setting('star.gp')::uuid,false)).allowed;
do $$begin
 if exists(select 1 from public.player_media where id=current_setting('star.gmedia')::uuid) or exists(select 1 from storage.objects where bucket_id='player-coaching-media') then raise exception 'Withdrawal did not block media';end if;
end$$;
select (public.set_player_media_consent(current_setting('star.gp')::uuid,true)).allowed;
do $$begin if exists(select 1 from public.player_media where id=current_setting('star.gmedia')::uuid) then raise exception 'Regrant republished old media';end if;end$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gm'),'role','authenticated')::text,true);
select (public.change_player_media(current_setting('star.gmedia')::uuid,4,'share')).status;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gg'),'role','authenticated')::text,true);
select (public.change_player_media(current_setting('star.gmedia')::uuid,5,'remove')).status;
do $$begin if exists(select 1 from storage.objects where bucket_id='player-coaching-media') then raise exception 'Removed object still readable';end if;end$$;
reset role;
update public.staff_members set active=false where user_id=current_setting('star.gc')::uuid;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('star.gc'),'role','authenticated')::text,true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.player_media where id=current_setting('star.gmedia')::uuid) then raise exception 'Inactive coach reads media';end if;
 begin perform public.change_player_media(current_setting('star.gmedia')::uuid,6,'remove');raise exception 'Inactive coach changes media';exception when insufficient_privilege then null;end;
end$$;
reset role;
set local role anon;
do $$begin
 begin perform 1 from public.player_media;raise exception 'Anonymous table access';exception when insufficient_privilege then null;end;
 begin perform public.set_player_media_consent(current_setting('star.gp')::uuid,true);raise exception 'Anonymous consent access';exception when insufficient_privilege then null;end;
 if exists(select 1 from storage.objects where bucket_id='player-coaching-media') then raise exception 'Anonymous storage access';end if;
end$$;
reset role;
rollback;
select 'Passed: consent, draft isolation, manager publication, linked-family storage, withdrawal, regrant, parent removal, stale revisions, assigned and inactive staff, anonymous denial. All fixtures rolled back.' as result;
