-- One approved onboarding profile owns one Player Space. It is not paid enrolment.
alter table public.player_intakes add column portal_player_id uuid unique references public.coaching_players(id) on delete set null;
-- Existing enrolled records retain staff approval. Self-submitted profiles carry
-- their own intake consent reference instead of fabricating a staff approval.
alter table public.guardian_player_links alter column approved_by drop not null;
alter table public.guardian_player_links add column onboarding_intake_id uuid references public.player_intakes(id);
alter table public.guardian_player_links add constraint guardian_link_approval check(approved_by is not null or onboarding_intake_id is not null);
create index guardian_links_onboarding on public.guardian_player_links(onboarding_intake_id);
do $$declare c record;begin for c in select conname from pg_constraint where conrelid='public.coaching_players'::regclass and contype='c' and pg_get_constraintdef(oid) like '%programme%' loop execute format('alter table public.coaching_players drop constraint %I',c.conname);end loop;end$$;
alter table public.coaching_players add constraint coaching_players_programme_check check(programme in ('Sparks','Development','Flyers','Prestige','1-to-1','Other','Assessment'));
create function star_private.connect_intake_portal() returns trigger language plpgsql security definer set search_path='' as $$
 declare target_id uuid;existing_id uuid;begin
 if new.completed_at is null or new.guardian_reviewed_at is null or new.guardian_id is null then return new;end if;
 target_id:=new.portal_player_id;
 if new.player_user_id is not null then
  select player_id into existing_id from public.player_account_links where user_id=new.player_user_id;
  if existing_id is not null then
   if not exists(select 1 from public.guardian_player_links where player_id=existing_id and guardian_id=new.guardian_id) or (target_id is not null and target_id<>existing_id) then raise exception 'This player login is already connected to a different player profile. Contact STAR for help.';end if;
   target_id:=existing_id;
  end if;
 end if;
 if target_id is null then
  insert into public.coaching_players(first_name,last_name,programme,consent_confirmed,consent_recorded_by,consent_recorded_at,created_by)
  values(left(new.first_name,80),left(new.last_name,80),'Assessment',true,new.guardian_id,new.guardian_reviewed_at,new.guardian_id) returning id into target_id;
 end if;
 new.portal_player_id:=target_id;
 insert into public.guardian_player_links(guardian_id,player_id,approved_by,onboarding_intake_id) values(new.guardian_id,target_id,null,new.id) on conflict(guardian_id,player_id) do nothing;
 if new.player_user_id is not null then
  insert into public.player_account_links(user_id,player_id,approved_by) values(new.player_user_id,target_id,new.guardian_id) on conflict(user_id) do nothing;
  if not exists(select 1 from public.player_account_links where user_id=new.player_user_id and player_id=target_id) then raise exception 'Player login could not be connected safely. Contact STAR.';end if;
 end if;
 insert into public.player_space_profiles(player_id,updated_by,shirt_name,ambition,stronger_foot,playing_teams,experience)
 values(target_id,new.guardian_id,left(coalesce(nullif(new.details->>'preferred_name',''),new.first_name),30),left(coalesce(new.details->>'goals',''),500),case when new.details->>'stronger_foot' in ('Left','Right','Both') then new.details->>'stronger_foot' else '' end,left(coalesce(new.details->>'current_teams',''),200),case when new.date_of_birth<=current_date-interval '11 years' then 'senior' else 'junior' end)
 on conflict(player_id) do nothing;
 return new;
 end;$$;
revoke all on function star_private.connect_intake_portal() from public,anon,authenticated;
create trigger connect_approved_intake before insert or update of completed_at,guardian_reviewed_at,guardian_id,player_user_id on public.player_intakes for each row execute function star_private.connect_intake_portal();
-- Repair existing approved onboarding links as well as future ones.
update public.player_intakes set guardian_reviewed_at=guardian_reviewed_at,version=version+1,updated_at=now() where completed_at is not null and guardian_reviewed_at is not null and guardian_id is not null;

-- Revoking a player login also clears its onboarding identity link.
create function star_private.clear_revoked_intake_link() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 update public.player_intakes set player_user_id=null,version=version+1,updated_at=now()
 where portal_player_id=old.player_id and player_user_id=old.user_id
 and exists(select 1 from public.coaching_players where id=old.player_id);
 return old;
 end;$$;
revoke all on function star_private.clear_revoked_intake_link() from public,anon,authenticated;
create trigger clear_revoked_intake_link after delete on public.player_account_links for each row execute function star_private.clear_revoked_intake_link();

-- Both onboarding and existing coaching profiles use email invitations.
alter table star_private.intake_invitations alter column intake_id drop not null;
alter table star_private.intake_invitations add column portal_player_id uuid references public.coaching_players(id) on delete cascade;
alter table star_private.intake_invitations add constraint account_link_target check((intake_id is not null)<>(portal_player_id is not null));
alter table star_private.intake_invitations add constraint portal_invite_player_only check(portal_player_id is null or target_role='player');
create index intake_invitations_portal on star_private.intake_invitations(portal_player_id);
create index intake_invitations_email on star_private.intake_invitations(target_email,expires_at) where used_at is null;

create function star_private.accept_account_link(p_invitation uuid) returns uuid language plpgsql security definer set search_path='' as $$
 declare inv star_private.intake_invitations;r public.player_intakes;existing_id uuid;begin
 perform star_private.intake_require_verified();
 select * into inv from star_private.intake_invitations where id=p_invitation for update;
 if not found or inv.used_at is not null or inv.expires_at<now() or inv.target_email<>(select lower(email) from auth.users where id=auth.uid()) then raise exception 'This invitation is unavailable. Sign in with the invited email or ask your parent to invite you again.';end if;
 if inv.portal_player_id is not null then
  if not exists(select 1 from public.guardian_player_links where guardian_id=inv.created_by and player_id=inv.portal_player_id) then raise exception 'This family invitation is no longer active.';end if;
  if inv.created_by=auth.uid() then raise exception 'Use the player’s separate login.';end if;
  select player_id into existing_id from public.player_account_links where user_id=auth.uid();
  if existing_id is not null and existing_id<>inv.portal_player_id then raise exception 'This login already belongs to another player profile. Contact STAR.';end if;
  insert into public.player_account_links(user_id,player_id,approved_by) values(auth.uid(),inv.portal_player_id,inv.created_by) on conflict(user_id) do nothing;
  if not exists(select 1 from public.player_account_links where user_id=auth.uid() and player_id=inv.portal_player_id) then raise exception 'Could not connect this login. Contact STAR.';end if;
 else
  select * into r from public.player_intakes where id=inv.intake_id for update;
  if not found or auth.uid() in (r.creator_id,r.guardian_id,r.player_user_id) then raise exception 'Use the invited person’s separate login.';end if;
  if inv.target_role='guardian' then
   if r.guardian_id is not null or not exists(select 1 from public.guardian_profiles where user_id=auth.uid()) then raise exception 'Complete your parent account contact details first.';end if;
   update public.player_intakes set guardian_id=auth.uid(),version=version+1,updated_at=now() where id=r.id;
  else
   if r.player_user_id is not null then raise exception 'A player login is already connected.';end if;
   update public.player_intakes set player_user_id=auth.uid(),version=version+1,updated_at=now() where id=r.id;
  end if;
 end if;
 update star_private.intake_invitations set used_at=now() where id=inv.id;
 return coalesce(inv.intake_id,inv.portal_player_id);
 end;$$;

-- Retain support for invitations already issued with a code.
create or replace function star_private.intake_claim(p_code text) returns public.player_intakes language plpgsql security definer set search_path='' as $$
 declare inv star_private.intake_invitations;r public.player_intakes;begin
 perform star_private.intake_require_verified();
 if length(p_code)<>64 then raise exception 'Invalid or expired invitation.';end if;
 select * into inv from star_private.intake_invitations where token_hash=encode(extensions.digest(p_code,'sha256'),'hex');
 if not found or inv.intake_id is null then raise exception 'Invalid or expired invitation.';end if;
 perform star_private.accept_account_link(inv.id);
 select * into r from public.player_intakes where id=inv.intake_id;return r;
 end;$$;
create function star_private.request_intake_link(p_id uuid,p_email text) returns void language plpgsql security definer set search_path='' as $$begin perform star_private.intake_invite(p_id,p_email);end;$$;
create function star_private.request_player_link(p_player uuid,p_email text) returns void language plpgsql security definer set search_path='' as $$
 declare token text;intake_id uuid;begin perform star_private.intake_require_verified();
 if not exists(select 1 from public.guardian_player_links where guardian_id=auth.uid() and player_id=p_player) then raise exception 'Approved parent access is required for this player.';end if;
 if p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or lower(btrim(p_email))=(select lower(email) from auth.users where id=auth.uid()) then raise exception 'Enter the player’s separate account email.';end if;
 if exists(select 1 from public.player_account_links where player_id=p_player) then raise exception 'This player already has a connected login.';end if;
 select id into intake_id from public.player_intakes where portal_player_id=p_player and guardian_id=auth.uid();
 if intake_id is not null then perform star_private.intake_invite(intake_id,p_email);return;end if;
 update star_private.intake_invitations set used_at=now() where portal_player_id=p_player and created_by=auth.uid() and used_at is null;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into star_private.intake_invitations(portal_player_id,token_hash,target_email,target_role,created_by) values(p_player,encode(extensions.digest(token,'sha256'),'hex'),lower(btrim(p_email)),'player',auth.uid());
 end;$$;
create function star_private.pending_account_links() returns table(link_id uuid,player_name text,invited_by text) language plpgsql security definer set search_path='' as $$
 begin perform star_private.intake_require_verified();return query
 select inv.id,concat_ws(' ',coalesce(i.first_name,c.first_name),coalesce(i.last_name,c.last_name)),coalesce(g.display_name,'Your family')
 from star_private.intake_invitations inv left join public.player_intakes i on i.id=inv.intake_id left join public.coaching_players c on c.id=inv.portal_player_id left join public.guardian_profiles g on g.user_id=inv.created_by
 where inv.used_at is null and inv.expires_at>now() and inv.target_email=(select lower(email) from auth.users where id=auth.uid()) order by inv.expires_at desc;
 end;$$;
create function public.accept_account_link(p_invitation uuid) returns uuid language sql security invoker set search_path='' as $$select star_private.accept_account_link(p_invitation)$$;
create function public.request_intake_link(p_id uuid,p_email text) returns void language sql security invoker set search_path='' as $$select star_private.request_intake_link(p_id,p_email)$$;
create function public.request_player_link(p_player uuid,p_email text) returns void language sql security invoker set search_path='' as $$select star_private.request_player_link(p_player,p_email)$$;
create function public.pending_account_links() returns table(link_id uuid,player_name text,invited_by text) language sql security invoker set search_path='' as $$select * from star_private.pending_account_links()$$;
do $$declare f record;begin for f in select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','star_private') and p.proname in ('accept_account_link','request_intake_link','request_player_link','pending_account_links') loop execute format('revoke all on function %I.%I(%s) from public,anon',f.nspname,f.proname,f.args);execute format('grant execute on function %I.%I(%s) to authenticated',f.nspname,f.proname,f.args);end loop;end$$;
