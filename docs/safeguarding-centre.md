# STAR safeguarding centre

Implemented 16 November 2026. Klaxon, push and paid phone services remain deferred by the owner.

## Access and confidentiality
- Staff Portal → Operations → Safeguarding. Every currently active approved owner, manager, coach or assistant coach has access, as explicitly requested. Existing Staff access administration controls membership. Access follows account IDs and live membership, never fixed email addresses.
- The API checks an existing verified non-anonymous, non-banned identity on every request; a JWT session ID, when supplied, must still exist. Inactive staff, parents and organisation-only accounts cannot read cases, counts or resources. Removing the guardian approval underpinning a player link removes that player account's case access.
- Dedicated `star_private.safeguarding_*` tables have RLS, explicit deny-direct policies and revoked client grants. `public.star_safeguarding` is an invoker wrapper around a restricted, checked private definer. The definer is necessary to prohibit raw case access and make reads audited and writes append-only through the API.
- No safeguarding text enters family inboxes, coaching records, public search, notifications, browser storage, or an external messaging service. The player sees only their original report and explicitly shared replies on reports submitted by their current linked player account. Staff-recorded concerns are not published to players.
- Owner/demo previews never load real safeguarding data or submit reports. Guardian views do not mount the private help component. The public sample displays an explicitly disabled report preview.

## Player help
- Red-and-gold GET HELP is available above the Player Space content, including Inbox. It provides emergency guidance, independent Childline/NSPCC options and a dedicated private composer.
- Parent contact starts unticked. A request is recorded; no automatic parent message or case access results. Staff assess safe contact and record a reasoned decision.
- Reports receive a durable case reference. Retry UUIDs avoid duplicates after an uncertain network response. Unconfirmed messages remain in memory. Private conversations open only when the player opens help and are refreshed on demand.
- STAR's owner states monitoring is 24/7; this is not an immediate response guarantee. Emergency guidance says not to wait for STAR.
- Quick exit closes help, clears in-memory drafts and returns to football. It does not erase history, delete received reports or cancel a message already sending.
- Independent links checked 16 November 2026: https://www.childline.org.uk/get-support/ and https://www.nspcc.org.uk/about-us/our-services/nspcc-helpline/. Childline phone: 0800 1111. Follow provider pages for current service availability.

## Staff workflow
- Search/filter the latest 500 cases by reference/name, status, priority, assignee and due review. The case workspace shows the preserved report, parent preference, chronology, actions and access audit.
- Staff intake records source, exact words, people involved, dates and immediate actions in the original record. Later records distinguish observations, professional judgement, decisions, referrals, parent contact, corrections and player-visible replies.
- Human decisions set priority, lead, status, review and retention-review dates and legal hold. Revision checks reject stale edits; closure/reopening requires a rationale. Original evidence is never overwritten through the API.
- Actions have responsible staff, deadlines and recorded completion outcomes. Referrals and contact notes record actual actions, agency/recipient, date/reference, information shared and rationale. Saving a record does not contact anyone.
- Procedure versions and acknowledgements are recorded separately. No approved STAR policy is invented or pre-seeded. Staff must add the actual approved procedure and contacts.
- Register/case reads, changes, policy actions and explicit single-case JSON exports are audited. No bulk export or automatic deletion is provided. Retention-review dates prompt human review; no retention period is invented.

## Alerts and limitations
- A generic banner in the signed-in staff workspace polls every 30 seconds and on window focus. Unread state persists in the database; new records, overdue tasks and due reviews remain visible. Failure is shown rather than a false zero count. Quiet hours are not applied.
- This release has portal alerts only. A closed browser, suspended device or offline session cannot receive these alerts. It does not provide lock-screen push, klaxon, SMS or email delivery, and does not claim any delivery receipt.
- All active staff have access; per-case exclusions and a separate internal alternative handler are not configured, following the owner's deferral. The player is told internal reporting reaches STAR staff, and independent services remain visible.
- No automatic agency referral, parent notification, investigation decision, credibility scoring or purge.

## Validation and rollback
- `supabase/tests/safeguarding_centre.sql` uses synthetic accounts and full rollback: anonymous/raw-table denial, linked-player/parent/unrelated-account isolation, active/inactive/unverified staff, private reply projection, retries, stale edits, immutable chronology, tasks, export audit and immediate link/staff revocation.
- TypeScript and production build are required. No browser/usability tests or real test disclosures/messages/referrals.
- Migrations: `20261116030627_safeguarding_centre.sql`, then `20261116031552_safeguarding_query_aliases.sql`. Keep applied migration history intact.
- UI rollback: revert this release's Git commit and deploy. Keep private records and migrations; never drop safeguarding data as a rollback. To disable intake immediately, revoke authenticated EXECUTE on `public.star_safeguarding(text,jsonb)`; this also disables centre access until deliberately restored.
