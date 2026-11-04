# Schools & Clubs Portal — expansion brief, 3 November 2026

Free, invitation-only, co-branded organisation portal. Primary outcome: referrals into STAR coaching, whoever pays. Organisation branding is prominent; STAR remains Football Development Partner. Parent-approved linked-player sharing remains separate from referrals.

## Owner's 20 decisions

1. Parents create/sign into their own account before submitting an organisation-link referral.
2. Co-branded QR posters, social graphics/captions, parent emails and newsletter text.
3. New referrals alert Dean in Staff Portal, create a dated task and assign to his chosen STAR staff member.
4. Default first contact deadline: within 12 hours of submission.
5. Overdue tasks highlighted on staff dashboard and owner alerted.
6. Milestones: parent contacted and first coaching session attended.
7. Organisation inbox brings linked conversations together.
8. Confirmed organisation sessions enter STAR calendar, have an assigned coach, support recurring/term-time blocks and organisation change/cancellation requests.
9. Resources include pitch diagrams with setup/movement instructions, printable PDFs and privately saved adaptations.
10. Resource filters: age/experience, player numbers, duration.
11. Organisation staff suggest goals and record progress against STAR-approved goals.
12. Coaches receive reminders to review selected feedback after every relevant STAR session.
13. STAR manages all organisation branding.
14. Organisation staff receive email alerts and portal notifications.
15. STAR sees referrals, first-session conversion, contact response time, coaching delivered, portal activity/resource use.
16. Secure emailed staff invitations, acceptance tracking and resend controls; no first-login guide selected.
17. Organisation dashboard leads with unread messages/actions and upcoming coaching sessions.
18. Organisation staff create teams/year groups.
19. Organisation reporting is an on-screen summary of referrals, first-session attendance and coaching delivered.
20. Lead batch: co-branded referral pages, promotional materials, referral follow-up.

## First batch delivered by this change

- STAR-controlled logo upload, brand colour, welcome, per-organisation default assignee.
- Minimal public branding page at `/refer/[code]`; parent account required before referral submission. Existing parent links still work.
- Organisation and STAR promotion toolkit: self-contained printable SVG QR poster, PNG social graphic, email/newsletter/caption text. Official STAR asset, exact QR URLs, no third-party QR service or family data in artwork.
- Server-created 12-hour first-contact task on each referral, chosen staff assignment with active owner fallback, owner/assignee new-referral alerts and idempotent owner overdue alerts from a five-minute database job.
- Staff Home task queue; managers review all organisation follow-ups; an assigned coach can update only their own task. Contact and actual first-session date recorded separately; no name matching, automatic player links, enrolment or attendance-register writes.
- Optimistic revision checks prevent overwriting newer follow-up changes.
- Organisation progress summary; STAR also sees conversion and mean contact time. Until calendar scheduling arrives, delivered coaching is explicitly labelled completed requests (a request may be a visit or block), not an individual-session count.
- Internal assignments and deadlines excluded from organisation/parent referral projections.

## Remaining batches

Richer coaching resources and private adaptations; shared goals/progress; teams/year groups; dashboard action/session prioritisation; complete session-based reporting and portal/resource activity metrics.

## Validation

TypeScript; production build; existing parent-account checks; rollback-only original organisation/consent checks and new referral permissions/assignment/deadline/alert/concurrency/milestone checks. Exported poster/social artwork rendered with the actual STAR logo. No real referral, email, invitation or player records created for testing; no browser/usability tests.
 
## Invitation batch

Individual emailed staff invitations, resend controls, delivery-attempt/acceptance tracking and native Auth password setup are now delivered. See [individual-invitations.md](individual-invitations.md) for operations and validation.


## Inbox batch shipped — 4 November 2026

Individual email invitations and the organisation inbox/email alert batch are complete. Staff Inbox has Families and Schools & clubs tabs; organisation Overview and Staff Home show personal unread summaries. New selected feedback, observations and referral/request updates create contextual conversation events. Generic production emails use the durable queue and minute worker. Parent consent, live membership and STAR management permissions are checked on each inbox operation and before delivery. No historic notification backfill. See `organisation-inbox.md` for operation, validation and rollback. Calendar scheduling is the next separate batch.


## Scheduling batch shipped — 4 November 2026

Confirmed organisation sessions now enter STAR's training calendar with an assigned coach. Weekly blocks support explicit holiday exclusions and UK clock changes. Organisation and staff dashboards show upcoming sessions; organisations request individual date changes/cancellations for STAR review. Personal unread inbox/email notifications cover confirmations, requests and arrangement changes. Delivered-session totals count sessions marked delivered. Individual occurrences can be edited/cancelled; bulk block editing, external calendar subscriptions and team/year-group rosters remain later work. See `organisation-scheduling.md` for operations, limits and validation.
