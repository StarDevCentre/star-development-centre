-- Match every family and coach lookup to the row being accessed.
drop policy assignment_read on public.player_training_assignments;
create policy assignment_read on public.player_training_assignments for select to authenticated using (
 (select star_private.is_staff_manager()) or exists (
  select 1 from public.guardian_player_links l
  where l.player_id=player_training_assignments.player_id and l.guardian_id=(select auth.uid())
 )
);
drop policy assignment_staff_insert on public.player_training_assignments;
create policy assignment_staff_insert on public.player_training_assignments for insert to authenticated with check (
 (select star_private.is_staff_manager()) and created_by=(select auth.uid()) and (
  goal_id is null or exists(select 1 from public.coaching_development_goals g where g.id=player_training_assignments.goal_id and g.player_id=player_training_assignments.player_id)
 )
);
drop policy coaching_goals_read on public.coaching_development_goals;
create policy coaching_goals_read on public.coaching_development_goals for select to authenticated using (
 (select star_private.is_staff_manager()) or (
  (select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=coaching_development_goals.player_id and a.staff_user_id=(select auth.uid()))
 )
);
drop policy coaching_goals_insert on public.coaching_development_goals;
create policy coaching_goals_insert on public.coaching_development_goals for insert to authenticated with check (
 created_by=(select auth.uid()) and ((select star_private.is_staff_manager()) or (
  (select star_private.is_active_staff()) and exists(select 1 from public.coaching_assignments a where a.player_id=coaching_development_goals.player_id and a.staff_user_id=(select auth.uid()))
 ))
);
drop policy diary_guardian_insert on public.player_training_diary;
create policy diary_guardian_insert on public.player_training_diary for insert to authenticated with check (
 guardian_id=(select auth.uid()) and practice_date <= (now() at time zone 'Europe/London')::date and exists (
  select 1 from public.player_training_assignments a join public.guardian_player_links l on l.player_id=a.player_id
  where a.id=player_training_diary.assignment_id and l.guardian_id=(select auth.uid())
 )
);
