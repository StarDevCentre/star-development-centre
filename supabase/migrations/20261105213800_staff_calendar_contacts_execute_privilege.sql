-- Public RPC is SECURITY INVOKER, so allow its staff-guarded helper to execute.
-- Helper checks auth.uid() and active STAR staff membership before any data lookup.
-- The star_private schema is not a public API schema; anonymous users remain denied.
grant execute on function star_private.staff_calendar_people(uuid[]) to authenticated;
