-- STAR sponsorship bank transfers: parent-specific references, no card processing.
create table public.sponsorship_bank_transfers (
 id uuid primary key default gen_random_uuid(),
 guardian_id uuid references auth.users(id) on delete set null,
 payer_email text not null,
 option_key text not null,
 title text not null,
 amount_pence integer not null check(amount_pence > 0),
 session_kind text not null check(session_kind in ('group','individual')),
 session_count integer not null check(session_count between 1 and 20),
 payment_reference text not null unique check(payment_reference ~ '^[A-Z0-9]{1,18}$'),
 status text not null default 'awaiting_transfer' check(status in ('awaiting_transfer','reported_sent','confirmed','cancelled')),
 created_at timestamptz not null default now(),
 reported_sent_at timestamptz,
 confirmed_at timestamptz,
 confirmed_by uuid references auth.users(id) on delete set null
);
create index sponsorship_bank_transfers_guardian_idx on public.sponsorship_bank_transfers(guardian_id,created_at desc);
create index sponsorship_bank_transfers_status_idx on public.sponsorship_bank_transfers(status,created_at desc);
alter table public.sponsorship_bank_transfers enable row level security;
revoke all on public.sponsorship_bank_transfers from anon,authenticated;
grant select on public.sponsorship_bank_transfers to authenticated;

create or replace function star_private.is_sponsorship_owner()
returns boolean language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists(
   select 1 from public.staff_members m where m.user_id=(select auth.uid()) and m.role='owner' and m.active
 );
$$;
revoke all on function star_private.is_sponsorship_owner() from public,anon;
grant execute on function star_private.is_sponsorship_owner() to authenticated;

create policy sponsorship_read_own on public.sponsorship_bank_transfers
 for select to authenticated using(guardian_id=(select auth.uid()));
create policy sponsorship_read_owner on public.sponsorship_bank_transfers
 for select to authenticated using((select star_private.is_sponsorship_owner()));

create function public.star_create_sponsorship_bank_transfer(p_choice text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid := auth.uid();
 v_email text;
 v_title text;
 v_kind text;
 v_count integer;
 v_amount integer;
 v_id uuid;
 v_reference text;
 v_created timestamptz;
begin
 if v_uid is null or not exists(select 1 from public.guardian_profiles where user_id=v_uid) then
  raise exception 'A completed parent profile is required.' using errcode='42501';
 end if;
 select u.email into v_email from auth.users u where u.id=v_uid and u.email_confirmed_at is not null;
 if v_email is null then raise exception 'A verified parent email is required.' using errcode='42501'; end if;
 if (select count(*) from public.sponsorship_bank_transfers where guardian_id=v_uid and created_at>now()-interval '1 hour') >= 8 then
   raise exception 'Too many requests. Try again later.' using errcode='P0001';
 end if;
 case p_choice
 when 'one-group' then v_title:='One group session';v_kind:='group';v_count:=1;v_amount:=500;
 when 'four-group' then v_title:='Four group sessions';v_kind:='group';v_count:=4;v_amount:=2000;
 when 'one-local' then v_title:='One individual session · Taunton / Wellington';v_kind:='individual';v_count:=1;v_amount:=3500;
 when 'one-bridgwater' then v_title:='One individual session · Bridgwater';v_kind:='individual';v_count:=1;v_amount:=4000;
 when 'two-local' then v_title:='Two individual sessions · Taunton / Wellington';v_kind:='individual';v_count:=2;v_amount:=7000;
 when 'two-bridgwater' then v_title:='Two individual sessions · Bridgwater';v_kind:='individual';v_count:=2;v_amount:=8000;
 else raise exception 'Unsupported coaching option.' using errcode='22023';
 end case;
 v_reference := 'STAR' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 insert into public.sponsorship_bank_transfers(guardian_id,payer_email,option_key,title,amount_pence,session_kind,session_count,payment_reference)
 values(v_uid,v_email,p_choice,v_title,v_amount,v_kind,v_count,v_reference)
 returning id,created_at into v_id,v_created;
 return jsonb_build_object('id',v_id,'reference',v_reference,'amount_pence',v_amount,'title',v_title,'status','awaiting_transfer','created_at',v_created);
end;
$$;
revoke all on function public.star_create_sponsorship_bank_transfer(text) from public,anon;
grant execute on function public.star_create_sponsorship_bank_transfer(text) to authenticated;

create function public.star_mark_sponsorship_bank_transfer_sent(p_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_updated integer;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 update public.sponsorship_bank_transfers
  set status='reported_sent',reported_sent_at=now()
  where id=p_id and guardian_id=auth.uid() and status='awaiting_transfer';
 get diagnostics v_updated=row_count;
 return v_updated=1;
end;
$$;
revoke all on function public.star_mark_sponsorship_bank_transfer_sent(uuid) from public,anon;
grant execute on function public.star_mark_sponsorship_bank_transfer_sent(uuid) to authenticated;

create function public.star_confirm_sponsorship_bank_transfer(p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.sponsorship_bank_transfers;
begin
 if not star_private.is_sponsorship_owner() then raise exception 'Owner permission required' using errcode='42501'; end if;
 update public.sponsorship_bank_transfers
  set status='confirmed',confirmed_at=now(),confirmed_by=auth.uid()
  where id=p_id and status in ('awaiting_transfer','reported_sent')
  returning * into v;
 if v.id is null then raise exception 'Transfer cannot be confirmed. Check its current status.' using errcode='P0001'; end if;
 return jsonb_build_object('id',v.id,'status',v.status,'confirmed_at',v.confirmed_at);
end;
$$;
revoke all on function public.star_confirm_sponsorship_bank_transfer(uuid) from public,anon;
grant execute on function public.star_confirm_sponsorship_bank_transfer(uuid) to authenticated;
