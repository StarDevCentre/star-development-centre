-- Phase 2 parent access: review and apply only after privacy/safeguarding approval.
-- No parent can create or approve their own link.
create table if not exists public.guardian_player_links (
 guardian_id uuid not null references auth.users(id) on delete cascade,
 player_id uuid not null references public.coaching_players(id) on delete cascade,
 approved_by uuid not null references public.staff_members(user_id),
 approved_at timestamptz not null default now(),
 primary key (guardian_id,player_id)
);
alter table public.guardian_player_links enable row level security;
revoke all on public.guardian_player_links from anon;
grant select on public.guardian_player_links to authenticated;
create policy guardian_read_own_links on public.guardian_player_links for select to authenticated using (guardian_id = (select auth.uid()));
-- Only an active owner/manager may create or revoke links. Existing staff access is unchanged.
grant insert,delete on public.guardian_player_links to authenticated;
create policy manager_approve_links on public.guardian_player_links for insert to authenticated with check (
 approved_by = (select auth.uid()) and exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.active and s.role in ('owner','manager'))
);
create policy manager_revoke_links on public.guardian_player_links for delete to authenticated using (
 exists(select 1 from public.staff_members s where s.user_id=(select auth.uid()) and s.active and s.role in ('owner','manager'))
);
-- Parent access is limited to the exact approved child, and read-only. No staff-only observations or reviews exposed.
create policy guardian_read_own_player on public.coaching_players for select to authenticated using (
 exists(select 1 from public.guardian_player_links l where l.player_id=id and l.guardian_id=(select auth.uid()))
);
create policy guardian_read_own_goals on public.coaching_development_goals for select to authenticated using (
 exists(select 1 from public.guardian_player_links l where l.player_id=player_id and l.guardian_id=(select auth.uid()))
);
create policy guardian_read_own_assessments on public.coaching_idp_assessments for select to authenticated using (
 exists(select 1 from public.guardian_player_links l where l.player_id=player_id and l.guardian_id=(select auth.uid()))
);
