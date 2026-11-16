# STAR Safeguarding Centre — implementation brief

Status: product direction and initial access approved; implementation in progress. Klaxon and Pushover deferred by the owner.

## Player help
- A STAR red button with gold lettering, labelled “GET HELP”, prominently available in Player Space Inbox and accessible from the main navigation.
- Opens immediate, reassuring guidance, a secure message composer and independent help options without requiring the player to categorise or prove a concern.
- Explain emergency help, STAR's monitoring availability and that sending a message does not guarantee an immediate human reply.
- Provide verified Childline/NSPCC links and telephone options. External contact is the player's choice; never automatically forward disclosures.
- Parent notification starts unticked. Explain precisely what notification will reveal before submission. Record the player's preference separately from any staff safeguarding decision.
- Do not notify a parent automatically when a report is submitted. Where requested, a safeguarding lead reviews safe contact before notification; tell the player this clearly.
- Explain confidentiality honestly: only authorised safeguarding staff can access the report, and information may need to be shared to protect someone. Parents do not acquire case access through their ordinary guardian link.
- Provide a quick exit to the football home screen, warning that it does not erase browser history. Do not persist disclosure drafts in localStorage, analytics or general coaching records.
- Show confirmation only after durable server receipt, with a case reference and private follow-up conversation. Retain unsent text on recoverable submission failure.
- Demo and owner Player Space previews must never load real safeguarding content or submit reports.

## Staff centre
1. Dashboard: unreviewed reports, assigned cases, due/overdue actions and failed delivery alerts. Sensitive details stay out of ordinary staff dashboard badges.
2. Intake: player disclosures and staff-recorded concerns; record source, exact words, occurrence/receipt dates, immediate safety actions and people involved. Staff can submit a report without gaining case-reading access.
3. Case register: search/filter by reference, status, assigned lead, priority and review date. Priority is assigned by a human; no automatic credibility or risk scoring.
4. Case workspace: original report, immutable chronology, separately labelled factual observations and professional judgement, private player replies, decisions and reasons, tasks and review dates.
5. Actions/referrals: record actual contact with agencies, recipient, date, reference, information shared and rationale. The system records referrals; it does not claim to have made them or automatically send sensitive disclosures externally.
6. Parent contact: prominently show the player's preference and any safety concerns; record a reasoned human decision, chosen recipient and what was communicated. Do not copy whole case files into the family inbox.
7. Closure/reopening: record outcome, rationale, remaining actions and review date; preserve original evidence and the history of decisions. Corrections are appended, not silent overwrites.
8. Resources: approved reporting procedure, contact directory, response guidance, policy versions and acknowledgement records.
9. Access administration: named safeguarding leads with explicit grants; case-specific exclusions and an alternative reporting route for concerns about a lead or owner. Ordinary owner/manager status must not automatically override exclusions.
10. Audit: record case reads, changes, access grants/revocations, exports and sharing decisions. Exports require an explicit action and are audited; no bulk case exports by default.

## Security and operations
- Separate private tables and server-checked APIs; no reuse of parent-visible player_space_messages.
- Validate current identity, active staff status, explicit safeguarding permission and case exclusion on every operation. Revocation takes effect on the next request.
- Restrict player reads to their own submitted conversation, excluding internal notes, staff identity-sensitive information and other reporters' information.
- Parent and school/club roles cannot read reports, internal case notes, case counts or safeguarding notifications through existing portal APIs.
- Staff alerts contain generic text and require sign-in to inspect the centre. Queue receipt, retry and failure visibility are required; never equate queued with delivered.
- Retention/review schedules and legal holds must be configurable and approved; no invented retention period and no automatic purge in the initial release.
- Safeguarding access and live alerts remain disabled until the named lead, alternative contact and monitoring arrangements are configured.
- Required checks: anonymous denial; cross-player isolation; guardian/organisation denial; staff-submit-only scope; explicit lead access; conflict exclusions; revocation; preview isolation; idempotent submissions; immutable chronology; notification privacy; failure/retry handling; TypeScript and production build.
- Verify database permissions using rollback-only synthetic fixtures. Never create real reports, contact agencies or send test disclosures.

## Owner decisions — 16 November 2026
- Dean and Becky are the current safeguarding team. All active, approved staff accounts may access the centre for now. Authorisation follows immutable account IDs and current active staff membership, never hard-coded email addresses. Pending applicants, suspended accounts, parents and organisation staff have no staff access.
- Monitoring is 24/7. Safeguarding alerts must not inherit parent quiet hours. This describes monitoring arrangements, not a guarantee of immediate response or delivery.
- Independent STAR contact is deferred. Always offer verified independent Childline/NSPCC routes and explain that the internal report reaches STAR staff. Do not invent an alternative contact.
- Requested phone sound: klaxon. Foreground portal sound requires explicit device arming and an audio test. Browser push does not provide a portable guarantee of custom lock-screen sound or bypassing silent/DND. Phone setup must display this limitation.
- A native alert service such as Pushover can support a siren with repeated emergency-priority alerts and acknowledgement receipts. Any such integration must be explicitly chosen/configured and send generic alert text only, never disclosure contents, child names, case references or identifying URLs.

## Current delivery scope
The owner deferred the klaxon and Pushover. Build the safeguarding centre with portal alerts; do not add a paid alert dependency. Optional phone delivery can be configured later.

## Implementation checkpoint
PlayerSafeguardingHelp.tsx supplies the red-and-gold help entry, accessible dialog, immediate independent support, parent-contact preference and explicit receipt/failure states. It requires a dedicated server transport and is not yet mounted or deployed. No reports are collected by this checkpoint. Case storage, staff case management, access tests and alerts remain to be implemented before activation.
