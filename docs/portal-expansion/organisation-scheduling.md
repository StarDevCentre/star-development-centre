# Organisation coaching schedule — 4 November 2026

STAR managers confirm coaching under Staff Portal → Schools & clubs → Coaching schedule. The training calendar links its organisation rows back to that editor. Staff Home shows upcoming organisation sessions; active coaches see their own assigned organisation sessions. Organisation Overview leads with upcoming coaching and its schedule tab shows arrangements, request history and delivery totals.

## Bookings and blocks

Create a single session or up to forty weekly dates within the next year. Untick holiday dates explicitly; school holiday calendars are not inferred. Each civil date is converted separately in Europe/London so weekly UK start times survive GMT/BST changes. Missing/repeated clock-change hours are rejected. Durations are 15–360 minutes.

An active verified STAR staff account is assigned to every new session. Managers supply its coach name for display to the organisation; account emails appear only in the manager's assignment picker when no profile name exists. Organisations cannot browse staff accounts. Coach overlaps across organisation sessions are checked transactionally under a per-coach advisory lock. Generic STAR calendar rows do not currently have assigned-coach metadata, so this check cannot infer their coach availability; STAR must also check other commitments.

The block creates real `training_sessions` rows, with private organisation metadata and retry identifiers. Optional related requests must belong to the same organisation and remain open; scheduling marks them confirmed. Dates are individually editable/cancellable. Block creation is atomic and idempotent: a conflict in any date rolls back the whole block, and an uncertain response can be retried without duplicate bookings. Other calendar clients cannot move an organisation session into the past or delete its history.

## Changes, cancellations and delivery

Organisation members can request a change or cancellation for an upcoming scheduled date, with one pending request per session. The request itself never changes the booking. Managers apply concrete new arrangements or decline with a response; both session and request revisions must still match. This prevents stale decisions overwriting changes made by a colleague.

Cancellation retains the calendar row and organisation history, omits it from upcoming calendar/attendance selectors and records an inbox update. A session with attendance cannot be cancelled or have its recorded times changed. Cancelled sessions are not reopened; create a replacement date. Mark coaching delivered after it ends; review any pending request first. The delivered total counts actual sessions explicitly marked completed, independently of the older completed-request total.

New confirmations, arrangement changes, cancellations, organisation requests and STAR decisions enter a block's organisation inbox thread. The existing one-minute email queue sends generic portal alerts and rechecks active access before delivery. Historic records are not backfilled. No real bookings or emails were created for testing.

## Privacy and compatibility

Schedule data contains organisation arrangements and a public-facing coach name, without player/family records. No automatic player linking, rosters, consent changes, personal family bookings or attendance marks occur. Organisation group sessions cannot be published into an individual family schedule. Ordinary training-calendar and family-publication workflows remain supported. Parent-approved player feedback stays in the separate consent-protected inbox workflow.

Private scheduling tables use RLS and deny direct client access. The invoker API checks live verified accounts, active staff roles and current organisation membership server-side. Organisation projections exclude staff email lists and change-submitter account IDs. Pausing an organisation or revoking its member blocks external access. Managers can still inspect paused history but must restore access before editing arrangements.

## Validation and operations

Applied migrations: `20261104030241_organisation_scheduling` and `20261104030537_organisation_calendar_time_guards`. TypeScript and production build are checked. `scripts/test-organisation-schedule.cjs` covers weekly arithmetic, exclusions and clock-change hours. Rollback-only `supabase/tests/organisation_scheduling.sql` covers identity/organisation/coach permissions, coach clashes and atomic rollback, duplicate retries, GMT/BST, immutable booking requests, optimistic concurrency, applied changes, cancellation/history, actual delivery totals, attendance preservation, transactional inbox alerts and ordinary family booking compatibility. No usability tests.

Existing security advisories are unchanged. Roll back app code to the preceding inbox release if needed, retaining these additive tables and organisation calendar guards to preserve booking history. Do not drop the scheduling tables or remove cancellation guards while real organisation sessions exist. Individual calendar records and inbox events provide an operational history; email-provider acceptance is monitored through the existing delivery queue.
