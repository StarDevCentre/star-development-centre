create table public.staff_session_plans (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id),
 title text not null check(char_length(title) between 1 and 100),
 plan jsonb not null check(jsonb_typeof(plan)='object' and octet_length(plan::text)<=80000),
 updated_at timestamptz not null default now()
);
alter table public.staff_session_plans enable row level security;
revoke all on public.staff_session_plans from anon;
grant select,insert,update,delete on public.staff_session_plans to authenticated;
create policy plan_read on public.staff_session_plans for select to authenticated using (created_by=(select auth.uid()) and (select star_private.is_active_staff()));
create policy plan_insert on public.staff_session_plans for insert to authenticated with check (created_by=(select auth.uid()) and (select star_private.is_active_staff()));
create policy plan_update on public.staff_session_plans for update to authenticated using (created_by=(select auth.uid()) and (select star_private.is_active_staff())) with check (created_by=(select auth.uid()) and (select star_private.is_active_staff()));
create policy plan_delete on public.staff_session_plans for delete to authenticated using (created_by=(select auth.uid()) and (select star_private.is_active_staff()));
create index staff_session_plans_author on public.staff_session_plans(created_by,updated_at desc);