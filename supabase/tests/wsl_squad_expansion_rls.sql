-- Only synthetic fixtures, rolled back in full.
begin;
do $$declare g uuid:=gen_random_uuid();o uuid:=gen_random_uuid();p uuid:=gen_random_uuid();s uuid:=gen_random_uuid();c uuid;other_player uuid;begin
 insert into auth.users(id,email,aud,role,email_confirmed_at,created_at,updated_at) select id,'squad-check-'||id||'@example.invalid','authenticated','authenticated',now(),now(),now() from unnest(array[g,o,p,s]) id;
 insert into public.guardian_profiles(user_id,display_name) values(g,'Synthetic family'),(o,'Other synthetic family');
 insert into public.staff_members(user_id,role,active) values(s,'manager',true);
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Squad','Synthetic','Assessment',true,s,s) returning id into c;
 insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,created_by) values('Other','Synthetic','Assessment',true,s,s) returning id into other_player;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by) values(g,c,s),(o,other_player,s);
 insert into public.player_account_links(user_id,player_id,approved_by) values(p,c,g);
 perform set_config('star_test.guardian',g::text,true);perform set_config('star_test.other',o::text,true);perform set_config('star_test.linked',p::text,true);perform set_config('star_test.player',c::text,true);
 insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values(other_player,'Other five','diamond',array['hampton','williamson','hasegawa','toone','shaw'],'shaw',o);
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('star_test.guardian'),true);
do $$declare pid uuid:=current_setting('star_test.player')::uuid;selected text;n integer;begin
 insert into public.player_squads(player_id,name,formation,footballers,captain,updated_by) values(pid,'My five','diamond',array['hampton','williamson','hasegawa','toone','shaw'],'shaw',auth.uid());
 foreach selected in array array['sophie-baggaley','chiamaka-nnadozie','sophie-whitehouse','shae-yanez','khiara-keating','mary-earps','constance-picaud','daphne-van-domselaar','pauline-peyraud-magnin','fran-bentley','kirstie-levell','anna-king','lysianne-proulx','olivia-clark','anna-tamminen'] loop
  update public.player_squads set footballers=array[selected,'anna-patten','alexia-putellas','jessica-park','riko-ueki'],captain=selected,updated_by=auth.uid() where player_id=pid;
  if not exists(select 1 from public.player_squads where player_id=pid and footballers[1]=selected and captain=selected) then raise exception 'Goalkeeper did not save';end if;
  begin update public.player_squads set footballers=array['hampton',selected,'hasegawa','toone','shaw'],captain='shaw' where player_id=pid;raise exception 'Second goalkeeper accepted';exception when check_violation then null;end;
 end loop;
 foreach selected in array array['anna-patten','lynn-wilms','missy-bo-kearns','millie-turner','neve-herron','lisa-naalsund','lily-crosthwaite','veatriki-sarri','marisa-olislagers','maisie-symonds','madison-haley','ellie-mason','kiera-skeels','jodie-hutton','lucy-fitzgerald','gillian-kenney','allyson-swaby','aimee-everett','annabel-blanchard','ashleigh-weerden','bethany-england','ruby-mace','mayumi-pacheco','clare-wheeler','yuka-momiki','ornella-vignola','jenna-clark','fuka-nagano','ceri-holland','beata-olsson','maria-leon','alexia-putellas','kadidiatou-diani','anna-sandberg','jessica-park','amanda-nilden','olivia-holdt','jessica-naz','cathinka-tandberg','estelle-cascarino','ffion-morgan','katie-zelem','riko-ueki','ebony-salmon','asmita-ale','sjoeke-nusken','vivianne-miedema','kirsty-hanson','caitlin-hayes','hikaru-kitagawa','mia-enderby','grace-geyoro','rebeca-bernal','noelle-maritz','lotte-wubben-moy','drew-spence','seraina-piubel','danielle-van-de-donk','shannon-cooke','elisha-n-dow','aoba-fujino','aggie-beever-jones','aurora-galli','naomi-girma','hinata-miyazawa','olivia-smith','victoria-pelova','maelys-mpome','megan-finnigan','simone-magill','kirsty-howat','rebecca-knaak','nikita-parris','brooke-aspin','ella-powell','marine-dafeur','lotta-lindstrom','maddi-wilde','jamie-finn','rachel-williams','charlie-wellings','emma-brown','beth-hepple','lucy-watson','olivia-fergusson','jorja-fox','jenna-slattery','mary-mcateer','princess-ademiluyi','olivia-mcloughlin','poppy-pritchard','alisha-lehmann','demi-stokes','jordan-nobbs','beth-lumsden'] loop
  update public.player_squads set footballers=array['hampton',selected,'hasegawa','toone','shaw'],captain=selected,updated_by=auth.uid() where player_id=pid;
  if not exists(select 1 from public.player_squads where player_id=pid and footballers[2]=selected and captain=selected) then raise exception 'Outfield player did not save';end if;
  begin update public.player_squads set footballers=array[selected,'williamson','hasegawa','toone','shaw'],captain='shaw' where player_id=pid;raise exception 'Outfield player accepted as goalkeeper';exception when check_violation then null;end;
 end loop;
 begin update public.player_squads set footballers=array['asmita-ale','williamson','hasegawa','toone','shaw'],captain='shaw' where player_id=pid;raise exception 'Leicester defender accepted as goalkeeper';exception when check_violation then null;end;
 if exists(select 1 from public.player_squads where player_id<>pid) then raise exception 'Cross-family squad visible';end if;
 update public.player_squads set name='Stolen' where player_id<>pid;get diagnostics n=row_count;if n<>0 then raise exception 'Cross-family squad writable';end if;
 begin update public.player_squads set footballers=array['hampton','anna-patten','anna-patten','toone','shaw'],captain='shaw' where player_id=pid;raise exception 'Duplicate accepted';exception when check_violation then null;end;
end$$;
select set_config('request.jwt.claim.sub',current_setting('star_test.linked'),true);
do $$declare pid uuid:=current_setting('star_test.player')::uuid;begin
 if not exists(select 1 from public.player_squads where player_id=pid) then raise exception 'Linked player lost access';end if;
 update public.player_squads set name='Linked five',updated_by=auth.uid() where player_id=pid;
end$$;
select set_config('request.jwt.claim.sub',current_setting('star_test.other'),true);
do $$begin
 if exists(select 1 from public.player_squads where player_id=current_setting('star_test.player')::uuid) then raise exception 'Linked squad leaked';end if;
 if not exists(select 1 from public.player_squads where name='Other five') then raise exception 'Other family squad changed';end if;
end$$;
reset role;
rollback;
select 'PASS: all 110 additions save; goalkeeper slots, unique players, linked account access and family isolation enforced; fixtures rolled back.' as result;
