create table public.staff_session_plan_links (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null references auth.users(id) on delete cascade,
 plan_id uuid not null references public.staff_session_plans(id) on delete cascade,
 training_session_id uuid references public.training_sessions(id) on delete cascade,
 family_session_id uuid references public.family_session_schedule(id) on delete cascade,
 check (num_nonnulls(training_session_id,family_session_id)=1),
 unique(created_by,training_session_id),
 unique(created_by,family_session_id)
);
create index staff_plan_links_plan on public.staff_session_plan_links(plan_id);
create index staff_plan_links_training on public.staff_session_plan_links(training_session_id);
create index staff_plan_links_family on public.staff_session_plan_links(family_session_id);
alter table public.staff_session_plan_links enable row level security;
revoke all on public.staff_session_plan_links from public,anon;
grant select,insert,update,delete on public.staff_session_plan_links to authenticated;
create policy own_plan_links_read on public.staff_session_plan_links for select to authenticated using (
 created_by=(select auth.uid()) and (select star_private.is_active_staff()) and
 exists(select 1 from public.staff_session_plans p where p.id=plan_id and p.created_by=(select auth.uid())) and
 (exists(select 1 from public.training_sessions s where s.id=training_session_id) or
 exists(select 1 from public.family_session_schedule s where s.id=family_session_id and star_private.can_coach_player(s.player_id)))
);
create policy own_plan_links_insert on public.staff_session_plan_links for insert to authenticated with check (
 created_by=(select auth.uid()) and (select star_private.is_active_staff()) and
 exists(select 1 from public.staff_session_plans p where p.id=plan_id and p.created_by=(select auth.uid())) and
 (exists(select 1 from public.training_sessions s where s.id=training_session_id) or
 exists(select 1 from public.family_session_schedule s where s.id=family_session_id and star_private.can_coach_player(s.player_id)))
);
create policy own_plan_links_update on public.staff_session_plan_links for update to authenticated using (
 created_by=(select auth.uid()) and (select star_private.is_active_staff())
) with check (
 created_by=(select auth.uid()) and (select star_private.is_active_staff()) and
 exists(select 1 from public.staff_session_plans p where p.id=plan_id and p.created_by=(select auth.uid())) and
 (exists(select 1 from public.training_sessions s where s.id=training_session_id) or
 exists(select 1 from public.family_session_schedule s where s.id=family_session_id and star_private.can_coach_player(s.player_id)))
);
create policy own_plan_links_delete on public.staff_session_plan_links for delete to authenticated using (created_by=(select auth.uid()) and (select star_private.is_active_staff()));
