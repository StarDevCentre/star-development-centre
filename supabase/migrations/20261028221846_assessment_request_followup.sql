alter table public.player_intakes add column assessment_contacted_at timestamptz;
create function star_private.reset_assessment_contact() returns trigger language plpgsql security invoker set search_path='' as $$
begin if new.assessment_requested_at is distinct from old.assessment_requested_at then new.assessment_contacted_at:=null; end if; return new;end;$$;
revoke all on function star_private.reset_assessment_contact() from public,anon,authenticated;
create trigger reset_assessment_contact before update of assessment_requested_at on public.player_intakes for each row execute function star_private.reset_assessment_contact();
create function star_private.set_assessment_contact(p_id uuid,p_contacted boolean) returns timestamptz language plpgsql security definer set search_path='' as $$
declare result timestamptz;begin
 if auth.uid() is null or not star_private.is_staff_manager() then raise exception 'Staff manager access required.';end if;
 if p_contacted is null then raise exception 'Choose the contact status.';end if;
 update public.player_intakes set assessment_contacted_at=case when p_contacted then coalesce(assessment_contacted_at,now()) else null end where id=p_id and assessment_requested_at is not null returning assessment_contacted_at into result;
 if not found then raise exception 'Assessment request not found.';end if;
 return result;
end;$$;
create function public.set_assessment_contact(p_id uuid,p_contacted boolean) returns timestamptz language sql security invoker set search_path='' as $$select star_private.set_assessment_contact(p_id,p_contacted)$$;
revoke all on function star_private.set_assessment_contact(uuid,boolean) from public,anon;
revoke all on function public.set_assessment_contact(uuid,boolean) from public,anon;
grant execute on function star_private.set_assessment_contact(uuid,boolean) to authenticated;
grant execute on function public.set_assessment_contact(uuid,boolean) to authenticated;
