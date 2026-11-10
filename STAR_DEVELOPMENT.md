Warning: truncated output (original token count: 21339)
Total output lines: 438

# STAR Development Centre — Development Guide

> Working reference for AI coding agents and human developers. Last updated: 30 October 2026.
> This document records product intent and working preferences. **The repository code, configuration and deployment environment are the source of truth for implemented behaviour.** Do not assume every planned feature exists.

## Purpose
STAR Development Centre is an independent girls' football development service in Somerset, UK. The website serves prospective families, enrolled players, parents/guardians and authorised coaches/staff. It is not a football club or an FA Emerging Talent Centre.

## Verified repository facts
- Repository: `StarDevCentre/star-development-centre`; default branch: `main`.
- `package.json` checked on 28 October 2026: Next.js 15 (`^15.3.0`), React 19, TypeScript 5.8, `@supabase/supabase-js` 2.76.1.
- Available scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run test:push`.
- The existing README describes an early preview and may be stale. Inspect actual routes, components, database schema and deployment setup before making claims about what is live.
- Do not assume authentication, booking, payments, notifications or portal features are complete merely because they appear in this guide.

## Brand and public-facing content
- Approved tagline: **Believe. Develop. Achieve.** Use this order consistently across public pages, metadata, sharing cards and portals.
- Brand palette: deep navy, STAR red, metallic/textured gold, white/off-white; polished, professional, cinematic where appropriate.
- Use the **actual official STAR logo assets** from the project; never approximate or redraw the logo. Use approved Autism Friendly Coaching/Gold badge assets faithfully, including their intended white interior.
- Maintain accessible contrast; do not communicate important status by red/green colour alone.
- Use genuine approved player/coach imagery and accurate STAR kit representations; otherwise use appropriate neutral football clothing. Do not invent accreditation or affiliation.
- Public homepage audience: parents and guardians. Prioritise clear programme information, age eligibility, prices, trust and straightforward registration/contact calls to action.
- STAR contact: call/text/WhatsApp 07902594064; email coachdmp7@gmail.com.
- Do not add a prospectus to the homepage or use it as a required user journey unless explicitly requested.

## Shared public header
- All routes use the same current public header from `components/Site.tsx`; do not select legacy headers using a route allowlist. Its shared `home.css` is loaded by the root layout so direct visits and navigation use the same sizing and styling.
- Player Space keeps its own header. Parent and staff app shells suppress the public header using their existing scoped styles; preserve those rules when changing shared chrome.
- Parent Portal layout eagerly loads `parent.css`, `parent-dashboard.css` and `parent-app.css` in that order. The entry header renders before authentication and for accounts without linked players, so its styles must never depend on the dynamically loaded `ParentExperience`. The entry logo also has small intrinsic dimensions to prevent document-width overflow if styles are delayed.

## Programmes — confirm prices before publishing changes
These are business requirements provided in earlier planning; check with the owner before changing public pricing.
- STAR Sparks ages 5–10: £5 per 45-minute group session, pay-as-you-go.
- Group coaching ages 11–16: £5 per 45-minute group session.
- Flyers ages 7–10: 16 weekly one-hour individual sessions; £375 upfront or £380 total across three payments.
- One to One Coaching ages 11–18: £35 per one-hour session.
- Prestige ages 11–18: 24 weeks, typically weekly 90-minute individual sessions; £800 upfront, 3 × £280 or 6 × £150.
- Player Season Support: £25 per visit, with agreed observations and coaching support.
- Ages 17–18: individual coaching only.
- Do not imply external academy endorsement or guarantee trials/pathway outcomes.

## Programmes page and finder
- One to One Coaching is the lead service and its consistent public name. Keep the agreed website design; the audience includes players and families.
- `/programmes` has an age filter, an individual-coaching feature, Flyers/Prestige cards, separate cards for group ages 5–7, 8–10, 11–13 and 14–16, and a separate Player Season Support section. Preserve existing programme anchor IDs.
- Reuse `/find-your-programme` as the single guided finder. Match age and stated focus, show the reason for each suggestion and rank One to One Coaching first for eligible individual goals. Do not suggest individual programmes as group matches; explain ages 17–18 have individual options.
- Public descriptions and enquiries do not require an account. Programme enquiries use the existing contact form with the programme and selected age carried through.
- All programme prices and payment options are public and visible without sign-in on programme pages and the finder. Keep enrolment and private player records protected separately.\n- Run `node --test scripts/test-programmes.cjs` for age/focus matching and mocked pricing authentication checks when modifying these areas.

## Public Football Hub
- `/articles` is the public collection of 12 original, detailed coaching guides; `/articles/[slug]` serves each guide with contents navigation, a practical activity, takeaways and related reading. It is separate from the completed private Parent Learning Hub.
- Content lives in `lib/content/football-hub-articles.json`, with helpers in `lib/footballHub.ts`. Keep public content independent of family records and portal content. Reading times are calculated from article text.
- Maintain the agreed website style and shared header. These are practical STAR coaching guides, not research reports or guaranteed development outcomes. Link external further reading where it informs an article; distinguish STAR examples from third-party guidance.

## Search and sharing
- `/site-index` is the visitor-facing directory, linked from the footer. `/search` provides ranked public results and category filters; the shared header keeps search collapsed behind a search icon (in the mobile login row), which opens the full search field and provides debounced suggestions through `/api/site-search`, plus a normal GET search form. Search result pages are noindex and omitted from the XML sitemap.
- `lib/siteDirectory.ts` is an explicit public allowlist, reusing public metadata, programme descriptions, group schedules, FAQs in `lib/content/site-help.json` and full Football Hub articles. `scripts/build-public-search.cjs` refreshes `lib/content/site-page-text.json` from its fixed public source list before each production build; never broaden it to scan portals or server files. Keep it current when public content changes. Portal entries describe login destinations only: never add family records, private learning content or signed-in prices to the index. No third-party search provider or search tracking is used. Run `node --test scripts/test-site-search.cjs` after changing indexing or matching.
- `lib/siteMetadata.ts` is the public page metadata registry and canonical origin (`https://star-development-centre.vercel.app`). Update the registry if the approved public domain changes; never infer it from an incoming Host header.
- Public pages and Football Hub articles have explicit canonical URLs, descriptions and Open Graph/Twitter cards. `/share/[id]` builds 1200×630 PNG cards using the official STAR logo and a whitelisted public title; it accepts no arbitrary user text or private records.
- `/sitemap.xml` lists only public pages and published articles. Portal/onboarding pages use noindex metadata and `X-Robots-Tag` headers; API and share-image responses also carry noindex. Robots allows portal crawling so compliant crawlers can see noindex; these directives never replace authentication or permissions. Non-production Vercel deployments use site-wide noindex headers and restrictive robots.
- Do not claim submission to search engines or guaranteed indexing/ranking. Existing shared-link previews may remain cached by social platforms.

## Contact and enquiries
- `/contact` follows the agreed navy, gold, red and off-white website style, with WhatsApp, phone and email options near the top. Reuse `EnquiryForm` for contact and booking enquiries.
- Reply-time wording: **We normally reply within 12 hours, but please allow up to 48 hours.** Show this beside the form and after confirmed online submission.
- Programme, exact group session and optional player age carry from the Programmes page into an editable enquiry summary. Request basic parent contact information; leave sensitive player information to the private onboarding process.
- Direct form delivery requires `STAR_ENQUIRY_ENABLED=true`, `RESEND_API_KEY` and `STAR_ENQUIRY_FROM` in the deployment environment. Only pass a Boolean availability flag to the browser. Enabling delivery requires a new deployment so the page and API use the same configuration.
- When direct delivery is unavailable, the form prepares an email/WhatsApp message. The visitor must choose a channel and press send in their app. Never describe preparation or opening an app as a received enquiry. A network/provider failure has an unconfirmed state and retains the entered details.
- `/api/enquiry` sends only to `coachdmp7@gmail.com`, validates contact/consent/programme/group data and reports success only when the email provider returns a receipt ID. No enquiry is saved to the player database.
- Run `node --test scripts/test-enquiries.cjs` for selection, validation, disabled delivery, provider-failure and confirmed-receipt checks. Mock delivery; do not send real test messages.

## Staplegrove Ladies pathway referrals
- `/pathways` includes a separate Staplegrove-branded enquiry box for players aged 15+. Open-age match eligibility is 16+; the club confirms arrangements.
- `/api/staplegrove-referral` accepts only the four requested fields and explicit sharing consent, validates server-side, and sends to the fixed club address `staplegroveladiesfootballclub@gmail.com` through Resend. It requires `RESEND_API_KEY` and the verified sender `STAR_ENQUIRY_FROM` in the deployment environment; it does not use the general-enquiry enable flag. Missing configuration or delivery failure must never display success. A labelled email-app fallback requires the player to send the message herself.
- Referrals are not stored in the player database. Keep secrets and submitted contact details out of logs. The honeypot, origin validation and bounded per-instance request limit reduce abuse; the latter is not a distributed quota. Run `node --test scripts/test-staplegrove-referral.cjs` for mocked delivery and validation checks; do not send real test referrals.

## Player onboarding journey
- `/first-session` is the public preparation guide, linked from registration, programmes, booking and shared navigation. It explains the free 30-minute assessment, practical preparation, individual support and next steps. Keep dates, venues, watching arrangements and kit requirements subject to confirmation with STAR; an assessment request does not enrol a player in a paid programme.
- Parent account first. Parents complete and submit onboarding from their own login; creating, activating or linking a separate player login is optional and can happen later.
- Parent or player completes a saveable full player profile: football experience, goals, support needs, relevant health/emergency information and separate media consent choices.
- Kit sizing means **training-top size and boot size only**.
- Clearly request a recent head-to-toe photograph in the first section of the initial assessment form, in an expanded upload area. It remains optional before assessment and is for private identification and must not populate the Player Space card. Players choose their card photo or avatar separately; public promotional use requires separate choices.
- Keep the family journey simple: complete the form, review it, then use one prominent **Submit & request FREE assessment** action. Show a clear completion screen with a link back to the Parent Portal and explain that the parent can leave.
- Keep player login setup and secure email-specific account linking under an optional section after submission; do not make parents wait for player activation or linking.
- Submission validates and saves the completed form, records the parent’s participation/media confirmation and requests the **FREE 30-minute assessment and introduction** together. STAR confirms time and venue separately.
- On parent submission, `/onboarding` creates the family’s own Player Space under the **Assessment** programme. This does not enrol the player in a paid programme. Its stored `portal_player_id` connects both portals to one profile; existing approved onboarding links are carried through. Never match existing coaching records by name or grant access to a different family’s record.
- Account linking uses the invited person’s verified email and one named **Connect** action in Player Space or onboarding. Do not ask families to copy account IDs or invitation codes. A connected player opens the same profile on later sign-ins. Keep onboarding and Player Space links consistent when access is revoked.
- Staff managers manage assessment requests at Staff Portal → Onboarding & assessments, and can record when they have contacted a family. This marker records a manual action; it does not send a message. Parents can see their assessment status and confirmed arrangements in the Parent Portal. New profile edits invalidate parent review.

## Portal product intent
### Player Space
- Every player uses the same illustrated presentation and wording previously named Teenagers. No age-style selector or child-specific presentation remains. The historical database `experience` field is compatibility data only: every loaded value normalises to the shared style, including `children`, `junior` and `senior`. Do not use it to branch the interface or access/reward rules. Other customisation and saved progress are preserved; no new database migration is required for this removal.
- Home begins with a compact row of visible Style My Space and Personalise My Card buttons, without a title, extras counter or oversized empty area. The latter opens and focuses the existing card editor. Keep the player card before the trophy cabinet on mobile, with the next-step panel following both. Retain room between the main cards for the background; illustrated scenes show their full width on phones. Your Next Unlock is the final Home content card, below the session strip.
- The welcome tutorial uses the existing saved completion for the signed-in user and selected player. Once completed it renders nothing, including after reload; there are no replay launchers on Home or in Account. Hide the optional tutorial while its saved status is loading or unavailable. An unfinished/skipped tutorial can still be continued.
- Torn-paper edges use fixed pixel depths, never a percentage of form height. Long style, card-editing and collection panels must not clip their controls. Retain focused code/build checks; do not run usability tests.
- Shared-style/mobile refinement validation: 36 focused checks across player experience compatibility, activities, learning rewards, highlights and collections; TypeScript check and production build. No authentication, database permissions or reward rules changed.
- `20261030041324_player_space_age_styles.sql` was applied as Supabase migration `20261030041947` (`player_space_age_styles`); do not reapply. Validation: 36 focused checks across player experience, activities, learning rewards, highlights and collections; type check; production build; rollback-only `supabase/tests/player_space_age_styles_rls.sql` covering style persistence, legacy compatibility, progress preservation and family isolation. No usability testing.
- Homepage prioritises next session. Its personalised weekly feature chooses unlogged current-week/ongoing coach practices before optional extras, highlights a new award/unread update/latest feedback, and shows the closest existing cosmetic milestone. Practice-day rewards count distinct dates with positive minutes; saved server unlocks remain the authority, including after goals reopen.
- Successful practice saves show a personal completion card; failed saves retain the form and show no celebration. Quick reflection choices explicitly fill the existing editable reflection field and keep the same validation and family/coach visibility. No extra training quotas, consecutive-day streaks or new reward rules are introduced.
- Profile: photo/avatar, shirt name/number, positions, stronger foot, ambitions and appropriate football preferences.
- Personal goals, coach-assigned practice plans, optional extra challenges, achievements and trophy cabinet.
- Progress timeline, confidence/enjoyment reflections, match reflections and football learning.
- Personalised messages and player questions with parent-visible replies where appropriate.
- Learn → Play & explore contains eight interactive games: Spot the Pass, Find the Space, What Happens Next?, First-Touch Choices, Defend the Danger, Counterattack Creator, Goalkeeper: Own the Angle and Goalkeeper: Play Out. The library filters all games, outfield games and goalkeeper games. Goalkeeper positioning uses an enlarged goal-area diagram; defensive games clearly identify the left-hand goal to protect. Player-movement animations start from the player; ball actions start from the ball. Lifted passes use a labelled curved route. The original four games retain their scenario IDs and saved progress. Each has six original STAR decision snapshots with tappable pitch choices, a short optional movement animation, hints, retry and simpler/advanced explanations. Exploring any action counts; scenarios can have multiple useful choices. No score, timer, leaderboard or coach-badge changes.
- Activity exploration (`activity:<scenario-id>`) and favourites (`favourite:<scenario-id>`) reuse the existing player-protected `player_learning_progress` rows. Only confirmed writes update progress; failed writes keep the selected move and offer retry. Counts distinguish guides, quizzes and activities; favourites do not count as completion. All progress and favourites stay scoped to the selected player.
- Customisable themes, avatar features and earned decorations.
- Ball cosmetic options: classic black/white, yellow Nike, orange Nike, Gold 90; planned unlocks at 10 sessions (yellow/orange) and 50 sessions (Gold 90).
- Ensure player hero/customisation remains usable on mobile.

### Parent Portal
- Clear, accessible view of their own child's sessions, development, progress and coach communications.
- Home uses a personal player card below the next-session panel: name/programme and decorative personalised shirt or the player's chosen private card photo, current shared coaching focus, most recently created active personal goal (falling back to her ambition), and latest real coach award with its badge/date/reason. Missing goals/awards leave no empty panels. The old promotional hero and separate focus panel are replaced; the new card has its own CSS namespace and content controls its height.
- Personal details reuse existing family RLS on `player_space_profiles`, `player_personal_goals` and `player_achievements`. Read only the selected player's minimal fields; private card-photo URLs expire after an hour and refresh on focus/visible five-minute refresh. Never use the onboarding identification photo or a generic coaching image as her real photo. Appearance remains browser-local; no personal goals, awards or signed photo URLs are stored there. The design studio labels photo availability and links to Player Space. `?player=` links select only an already-authorised player, once on entry; they never grant access.
- Focused validation for this data projection and private-photo fallback: `node --test scripts/test-parent-player-card.cjs`. Sample routes use explicitly fictional snapshots and make no player-card database requests.
- Age-appropriate football/tactics education with simple explanations.
- Formation explorer product intent: 9-a-side 2-4-2, 3-3-2, 3-2-3; 11-a-side 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 4-5-1, 3-1-4-2.
- Highlight primary and secondary coach-set positions distinctly; explain movements using short animations, arrows and plain language.
- Stadium/pitch presentation should be polished and intuitive, not at the expense of mobile performance.

### Coaching / Staff Portal
- Staff Home has a manager-only action list for requested assessments, incomplete/unreviewed onboarding (labelled as awaiting the family) and pending session changes. It uses existing RLS-protected tables, minimal summary fields, oldest-first ordering and exact counts; fetches at most 100 per source. Items open their existing workflow at the selected record. Refresh/reopening Home reloads the list; no contact, approval or schedule change occurs from opening an action. No new database permissions or schema are required.
- Support authorised coaches with player management, assessments, individual development plans, session planning, progress reports, achievements, observations and communications as features are implemented.
- Keep staff-only functionality and private player records behind appropriate server-enforced access control.
- Never assume a staff role from a client-side toggle.

## Safeguarding, security and privacy — non-negotiable
- The platform handles information about minors. Apply least-privilege access, appropriate parent/guardian visibility and strong separation between families.
- Enforce authentication and authorisation on the server and in Supabase row-level security as applicable; do not rely on hidden UI elements.
- Do not expose secrets, service-role keys, private player data or sensitive communications to client bundles or logs.
- For any schema, permission, auth, registration, payment or safeguarding-related change, review impacts and run relevant tests before production.
- Avoid sending identifiable player data to third parties without a justified, authorised integration.
- Never fabricate a successful test, migration or deployment.

## Usage-efficient AI development workflow
- Read `STAR_DEVELOPMENT.md` before making changes and follow its development guidelines.
- Keep repository exploration to the smallest relevant set of files. Streamline operations to minimise ChatGPT usage allowance without compromising quality or reliability.
- Do not run usability tests. The owner will report usability problems when fixes are needed. Retain focused code/build checks and relevant security/data validation.
1. Prefer **Terra / Medium** for routine UI work and straightforward features. Escalate to **Sol / High** only for genuinely complex architecture, permissions, difficult debugging or high-risk changes. These are working preferences, not guarantees of specific usage savings.
2. Start with a short implementation plan and identify the smallest set of relevant files. Do not repeatedly scan the entire repository unless necessary.
3. Batch closely related requested changes into one coherent task; avoid scope creep and speculative redesigns.
4. Reuse established components, tokens, utilities, routes and conventions instead of duplicating them.
5. Make the change, run focused checks, then the appropriate build/checks for the affected area.
6. Summarise files changed, behaviour added, tests actually run, any risks and deployment status concisely.
7. When requirements are ambiguous, ask only questions that materially block safe implementation; otherwise make conservative, reversible decisions and state assumptions.
8. Keep this document updated when architecture or lasting product requirements materially change; do not rewrite it on every task.

## Deployment preference
- Owner preference: **deploy completed development batches directly to production without a separate manual testing-approval step**.
- Deploy **once per completed batch** where practical, not after each small edit.
- This preference does **not** waive necessary validation, security checks, database migration safety or deployment verification.
- If checks fail, a change risks exposing minors' data, production credentials/access are missing, or deployment cannot be verified, **do not claim success or force an unsafe release**. Report the blocker and recommended fix.
- Record the commit/deployment reference when available; preserve a clear rollback route.
- Verify the actual hosting/deployment integration before choosing commands; do not assume that pushing to `main` always triggers production.

## Definition of done
- Requested behaviour implemented without breaking unrelated portals.
- Responsive on mobile and desktop; accessible keyboard interactions and readable text.
- Relevant authorisation/privacy boundaries preserved.
- Targeted checks and appropriate build passed (or failures transparently documented).
- Production deployment completed and verified where safe and configured; otherwise state exactly why not.
- Concise change summary and next actions.


## Learning rewards — 29 October 2026
- Eight Play & explore games each award one original learning badge and one named profile extra after a useful choice in all six scenarios. Both `opens-play` and `another-option` choices count; `look-again` does not. Exploration remains separate and old exploration never becomes mastery automatically.
- Quiz time has two fixed five-question rounds: Football Foundations and Teamwork & Trailblazers. All ten questions remain available with unlimited retries and saved correct answers. The latter round includes role/pressing questions with explanatory feedback for both age groups. Each complete round awards its badge and extra once. Previously saved correct quiz answers count.
- Ten extras: Passing Lanes, Open Pitch, Build from the Back and Football Notebook backgrounds; Next Move, Hold the Line, Between the Posts and Learning Crest photo/avatar frames; Touch Trail and Breakaway decorations. Previews, equip and removal use the existing profile system; skin/hair colours and the four original hairstyles remain freely available.
- Six new illustrated hairstyles: High bun, Double braids, Half-up waves, Curly ponytail, Twisted bun, Short textured crop. The first six distinct game/round completions each add one choice, spendable on any remaining hairstyle. Claims and unlocks persist across devices. The Learning Collection in Trophies and Style My Space presents badges, extras and hairstyle previews/claims.
- `lib/learningRewards.ts` is the client catalogue. The migration seeds matching answer/reward definitions in private tables; `scripts/build-learning-migration.cjs` regenerates the initial catalogue migration for review (do not reapply an applied migration). New catalogue changes need a new migration and the catalogue-consistency test.
- `submit_learning_answer` validates available choices and creates `mastery:<scenario-id>` or existing `quiz:<question-id>` progress server-side, then atomically grants badge/extra unlock rows. `unlock_learning_hairstyle` serialises per-player claims with the same transaction lock, checks six-choice entitlement, and is idempotent. Direct client mastery/quiz writes and deletes are blocked by RLS. New frames/backgrounds/hairstyles have server equip validation; existing decoration validation still applies. No coach-award records or family-sharing permissions change.
- Focused checks: `node --test scripts/test-learning-rewards.cjs scripts/test-player-activities.cjs`; `supabase/tests/learning_rewards_rls.sql` uses synthetic users and rolls back every fixture. Keep these checks when changing learning reward rules. No usability testing.

- The public sample Player Space starts with every existing and learning cosmetic, all ten learning badges and all six earned hairstyles unlocked. This is in-memory demo data only; real-account completion, attendance and server unlock rules are unchanged. Refresh restores the fully unlocked sample.

## Player collections — 29 October 2026
- Eight illustrated backgrounds are free for every player in Style My Space: floodlit stadium, street court, sunset pitch, futsal arena, rainy match night, stadium tunnel, football wall, and STAR navy & gold. Existing earned backgrounds retain their learning requirements.
- My squad has 175 full-body WSL and WSL 2 character illustrations across twenty-six clubs, club/name/position filters, 5-a-side (diamond/box) and 11-a-side (4–3–3, 4–4–2, 4–2–3–1) formations, a squad name and captain. Saving requires exactly one goalkeeper and either four or ten distinct outfield players to match the chosen formation. `player_squads` is protected by family/player RLS and server validation; squads are private to the player's existing linked accounts.
- Formation slots use content-sized CSS grid rows, with the goalkeeper on a separate final row. Keep full player illustrations and wrapped name/captain labels inside their own cells; do not restore a fixed pitch height or absolute percentage positioning. The pitch can grow on mobile to keep the diamond's anchor and goalkeeper apart.
- Boot locker has 17 collectible pairs. Learn → Boot Challenges has 17 original topics with a coaching tip, three decisions, explanations and unlimited retries. All three useful answers unlock the associated pair once. `submit_boot_answer` validates choices and issues permanent unlocks atomically; direct mastery and reward writes remain blocked. Boot learning does not award unrelated learning badges or hairstyle choices.
- Catalogues: `lib/playerScenes.ts`, `lib/playerSquad.ts`, `lib/bootChallenges.ts`. WebP artwork lives under `public/player-space/{scenes,squad,boots}`. The public sample includes a saved squad and all 17 boot pairs unlocked.
- `20261029150000_player_collections.sql` was applied through Supabase as migration `20261029202733` (`player_collections`); do not reapply it. Focused validation: `node --test scripts/test-player-collections.cjs scripts/test-learning-rewards.cjs scripts/test-player-activities.cjs` (23 checks), production build, and `supabase/tests/player_collections_rls.sql` (synthetic users, full rollback).

## Collection expansion — 29 October 2026
- Added the 16 owner-selected players, including Asllani/Godfrey for London City and Tierney/Goodwin for Leicester. Six goalkeepers are eligible; the same one-goalkeeper/four-outfield validation applies to old and new squads. WSL 2 players are explicitly included.
- Nine new pairs include IDA Rise, Furon Pink Heat, white Tekela, Ruby Red Morelia, Pink Foam Superfly, Predator Absolute (2006), Total 90 III (2004), Lotto Stadio (1990) and Etrusco Unico (1990). Each has its own three-decision challenge. All 51 boot decisions save permanently; every boot reward remains once-only.
- Additions live in lib/playerCollectionExpansion.ts. Counts derive from the catalogues; sample unlocks automatically include every pair. Artwork and prompts are recorded in scripts/collection-expansion-assets.md.
- Migration 20261029212443_expand_player_collections.sql is applied. It only extends the squad validator, allowed cosmetic keys and private challenge/reward catalogue; no permission or identity rules change. Generate future additions as new migrations, never re-run or overwrite applied ones.
- Validation: 24 focused checks, production build, and rollback-only database checks covering the expanded roster, all 17 boot rewards, family isolation, duplicate prevention and linked player access.


## Staff Session Builder — 29 October 2026
- Staff Portal → Session Builder provides ten original starter activities, custom activities, reorder controls, editable coaching points/equipment/adaptations, duration totals, a pitch-side view and print/PDF layout.
- Plans are separate from the training calendar and player assignments. Saving a plan does not schedule or publish a session. Use general group descriptions, no player names or sensitive information.
- Each active staff member can save and copy their own plans across devices. public.staff_session_plans uses creator-scoped RLS plus existing is_active_staff checks for every operation; family, other-staff and revoked-staff access is denied. Saves use updated_at concurrency checks and retain edits on failure.
- Migration 20261029220332_staff_session_builder is applied. Rollback-only validation is in supabase/tests/staff_session_builder_rls.sql.


## Session Builder library expansion — 29 October 2026
- lib/content/session-builder-library.json adds exactly 140 original entries alongside the ten retained starters: 50 one-to-one drills, 10 one-to-one activities, 40 small-group drills, 20 small-group activities and 20 one-to-one goalkeeper drills. New entries target female players aged 11–18; adapt to readiness and experience.
- Drills average 12.4 minutes (all 10–15); activities are 30 minutes with work/rest/review blocks. One-to-one entries require only one player and one coach. Each entry specifies player count, space/setup, equipment, coaching points and easier/harder options. No heading or collision work is required.
- The library has category counts, full-content search and 12-entry progressive loading. Player counts carry into pitch-side and printed plans. Existing saved plans remain compatible; no database migration or permission changes.
- Validation: node scripts/test-session-builder-library.cjs checks exact counts, unique IDs/titles/setups, original-title exclusion, durations, fields and staffing. Conceptual review excludes repeated starter setups; related football skills are intentionally practised in different situations.


## Coach…4339 tokens truncated… the collection now contains 175 distinct players across 26 clubs and 27 goalkeepers. Existing ids and assets remain available. Chloe Giddings and Lucy Noble were cancelled by the owner.
- Current official league portraits supply 22 likenesses; identified club or league photographs supply the remaining seven, with current teammate photos used for kit only. All illustrations use built-in image_gen in the established full-body style. Published league heights are recorded where available; other body/foot proportions and boot details are visual estimates. Per-player sources and prompts are in the roster provenance.
- The new additive `remaining_wsl2_selections` migration changes only the eligible roster and goalkeeper arrays. Private ownership, captain selection, one-goalkeeper/four-outfield validation, unique-player checks and existing family/player RLS are preserved. Never reapply previous migrations.

- Remaining WSL2 validation: all 32 focused collection/activity/reward checks and the production build passed. Migration applied as Supabase version `20261030120339` (`remaining_wsl2_selections`). Authenticated rollback-only database checks saved all 139 recent additions, rejected invalid goalkeeper placement and duplicate players, and preserved linked-account access and family isolation. No usability testing.

## Eleven-a-side squad option — 30 October 2026

- Squad Creator has a prominent 5-a-side / 11-a-side switch above the pitch. Eleven-a-side includes 4–3–3, 4–4–2 and 4–2–3–1. The formation determines the required team size; existing five-player saves remain valid without conversion. One saved squad per player remains the data model; saving replaces it with the selected format. Format drafts are retained only in component memory while the creator stays open, and reset clears them.
- Eleven-player pitches use twelve equal grid tracks with non-overlapping spans, smaller full-body artwork, wrapped names/captain labels and content-sized rows. Goalkeepers retain a separate last row. Never use fixed-height pitches or absolute-position players that can overlap on mobile.
- Additive migration `20261030122008_squad_eleven_a_side.sql` extends only formation/size constraints and the existing roster trigger. One goalkeeper in the first slot, unique eligible players, a selected captain, private ownership and existing family/player RLS remain enforced. No permissions or account-link rules change.
- Validation: 34 focused collection/activity/reward checks, TypeScript and production build passed. `supabase/tests/squad_eleven_a_side_rls.sql` passed authenticated saving for all three eleven-player formations, five-player compatibility, rejection of invalid sizes/duplicates/unknown players/goalkeepers in outfield slots, linked access and cross-family isolation; all synthetic fixtures rolled back. No usability testing.

## Homepage reasons to choose STAR — 30 October 2026

- The public homepage leads with specific coaching benefits and four reasons to choose STAR: individual attention, programme-specific development reporting, support between sessions and inclusive coaching. Existing public evidence includes Dean’s seven years of coaching experience, Approved Autism Friendly Coaching status and the working sample Player Space. Never invent testimonials, player outcomes, qualifications or endorsements.
- One to One Coaching is the first and visually emphasised service, linked to `/programmes#one-to-one`; Flyers and Prestige have separate links with their age ranges and structured support. Individual Development Plans, monthly reports and regular reviews are explicitly attributed to Flyers/Prestige, not promised for every flexible session or group.
- Inclusion and the free 30-minute assessment invitation precede the members’ pack and parent advice. The assessment explains listening, suitable football activities and agreeing next steps, with consistent request links to `/register`, preparation at `/first-session`, and clear parent-account/form/submission instructions. Requests still require STAR to confirm date and venue; no payment or programme commitment is implied. Existing onboarding and pricing access rules are unchanged.
- Validation: all 12 existing programme/search checks, production build including TypeScript, and built HTML checks for key messages, assessment links, section order, unique IDs and the public pricing boundary passed. Image references were checked against the production source tree. No usability testing.

## Assessment entry page — 30 October 2026

- `/register` now uses its own scoped `register.css` and the current navy, gold, red and off-white design. A compact responsive introduction and parent-account action card replace the legacy full-height-looking hero. Keep the first action near the top on mobile; do not add fixed-height hero sections that push it below the introductory content.
- The primary action is explicitly “Create my parent account” and opens the existing signup at `/parent-portal?mode=signup#parent-account`. Returning parents can sign in at the account anchor or continue `/onboarding`. The three steps include email confirmation, the saveable player form and explicit assessment submission; the page reiterates that STAR confirms date/venue and a player login is optional. This is a public entry page, not a new form or a confirmed booking; existing authentication, consent, submission and account-link rules remain unchanged.
- The first-session guide, individual support, preparation details and contact options remain available below. Personal, health and emergency details are directed to the private form. Validation: 12 existing programme/search checks, production build including TypeScript, and built-page checks for primary action order, account/returning-parent links, key guidance, unique IDs and the public pricing boundary passed. Responsive rules and keyboard focus styling checked in source; no usability testing.

## Initial assessment photograph request — 30 October 2026

- The head-to-toe photograph upload is visible in the first player/contact section, rather than hidden in optional extras at the end. Ask for one player with her face and whole body visible, in ordinary clothing or training kit. JPG, PNG or WebP under 10 MB use the existing private identification upload/save path, separate from Player Space card images and promotional consent. Full-image previews use `object-fit:contain`.
- The registration preparation checklist now asks parents to have that photograph ready. Upload remains optional and can be added later; no database, access, consent or submission-validation rules changed. Existing private upload/save handling and optional-photo validation were checked against the previous version. All 12 programme/search checks and the production build including TypeScript passed. No usability testing.

## Public homepage loading — 30 October 2026

- Preserve the current photography and layout. Homepage and shared header/footer imagery use Next Image with explicit responsive sizes; the homepage hero alone is preloaded at high priority. Header identity marks load eagerly, while lower-page photographs remain lazy.
- Barlow Condensed and DM Sans are self-hosted in `public/fonts/` with their OFL licences. `app/fonts.css` preserves the original font families, weights and Unicode subsets; the root layout preloads the two main Latin faces. Do not restore a render-blocking Google Fonts CSS import.
- Public header/footer and homepage links into the parent/player/staff portals disable automatic route prefetching; opening those links still uses normal Next navigation. The sample Player Space iframe remains visibility-gated.
- Footer column titles are level-two headings with an explicit small-label style. Keep their appearance independent of the global heading scale.
- Validation: production build including TypeScript, five public-search checks, and built-homepage checks for responsive hero/preload, local fonts and sequential headings passed. The search test's explicit public allowlist now includes the existing `/where-we-coach` page. Local image encoding checks reduced the 828px hero from 238,764 to 68,028 bytes and the 256px logo from 71,342 to 4,380 bytes; these are encoding checks, not a new Lighthouse result. No usability testing.

## Homepage CSS delivery — 30 October 2026

- The root `globals.css` contains the public foundation only. `app/portal-base.css` retains the original shared portal rules and loads eagerly from the parent, player and staff layouts, plus the onboarding page, before their scoped overrides. New portal entry routes must inherit or import that foundation; do not return private workspace CSS to the public root.
- Retired homepage rules are retained in `components/legacy-home.css`, imported only by the unused legacy `HomeInteractions` component. The live homepage continues to use `home.css`; the shared public header still receives it from the root layout.
- `components/header-search.css` contains the compact shared search controls; `site-search.css` now contains only Search and Site Index page presentation. Those two pages retain their explicit page stylesheet imports.
- Homepage/shared header/footer links to Programmes and the finder defer automatic route prefetching, alongside the existing portal policy, so their pricing/authentication bundles are fetched on navigation. Normal navigation and authenticated pricing remain unchanged.
- The numbered Player Space tour controls include their visible number in their accessible names. The members' pack image link includes its visible “Explore the full pack” label.
- Validation: all 12 programme/search checks and the production build including TypeScript passed. CSS AST comparison confirms every original selector/declaration and media/print context is retained across the split stylesheets. Built output verifies the responsive hero/preload, all four corrected labels, three homepage CSS requests (90,368 uncompressed bytes versus 168,093 previously), eager portal/onboarding foundation and parent override order, and full Search/Site Index styles. No usability testing or new Lighthouse result is implied.

## Homepage font and image delivery — 30 October 2026

- The root layout now imports `app/public.css`, which bundles fonts, the public foundation, `home.css` and compact header search in their existing order. Do not add duplicate `home.css` imports to public pages or return portal styles to this bundle. The production homepage has one render-blocking CSS request instead of three; private portal foundations still load eagerly in their layouts.
- Small, content-hashed common-text font subsets retain the exact original outlines, spacing and weight axes. The full original Latin/extended/Vietnamese faces remain available for other characters, alongside both OFL licences. Five homepage faces are discoverable directly from document preloads, removing the CSS-to-font discovery chain for those faces; their combined size is 89,716 bytes versus 126,116. Fonts have immutable caching: publish a new filename when their contents change. `scripts/subset-public-fonts.py` regenerates the subsets manually with fonttools[woff]; it is not a production build dependency.
- Next Image negotiates AVIF with WebP fallback throughout the site. Intermediate 480px/576px widths and programme-card sizes reflect the actual mobile carousel and desktop grid. Keep lower-page images lazy. The hero retains its document preload and high fetch priority, with synchronous decoding as a first-paint preference; it has no animation or hydration visibility gate.
- Dean's homepage portrait uses the same visible area from the approved poster as a lossless 370×414 source, rather than downloading and enlarging the entire poster. `scripts/build-home-portrait.cjs` regenerates the versioned asset; the original poster remains available. Preserve the visible crop and approved photography. The small CAA badge uses quality 65 at its existing dimensions.
- Validation: the production build including TypeScript and all 12 programme/search checks passed. Serialized font checks preserved 918 glyph outlines/advances and vertical metrics, including three variable-font weights. The portrait's source pixels exactly match the original crop. Built output verifies one CSS request (92,162 uncompressed bytes), five matching font hints, high-priority hero/synchronous decode, responsive card widths, and eager private-layout CSS. Public search content is unchanged. Local encoding checks reduce the 828px hero from 68,028-byte WebP to 39,520-byte AVIF, and the portrait from 41,850 bytes to 7,920-byte AVIF (12,710-byte WebP fallback). These are delivery checks, not a new Lighthouse score. No usability testing.

## Build My Player — 1 November 2026

- Player Space → Build My Player (`#builder`) saves one illustrated custom look per player. New looks start in plain sports base layers. Free exploration covers presets, skin/face/eyes/build, hair, football/casual clothes, Boot Locker pairs and accessories, with front/back preview. Gold clothing/accessories reuse permanent coach-badge cosmetic unlocks; boots require their existing server-issued entitlements.
- A dressed saved look may appear on the player card and once in any outfield squad slot in either team size, including as captain. It does not change the home hero or use the private onboarding photograph. Existing photo/avatar options remain selectable. A top and outer bottoms are required for card/squad display.
- `builder_look` and `builder_on_card` extend the existing private profile with strict server catalogue and entitlement checks. Existing RLS is unchanged. The reserved `my-player` squad identity uses the current player's own saved look only, with unchanged goalkeeper/uniqueness rules. Shared transaction locks serialize wardrobe/squad saves. See `docs/player-space/build-my-player.md` for assets, architecture and validation.
- The additive `build_my_player` migration is applied; do not reapply. Validation: TypeScript, production build, 39 focused builder/collections/learning/activity checks, artwork export inspection and rollback-only authenticated database checks. No usability tests.

- Renderer correction: `lib/builderArtwork.ts` masks individual garments at their actual seams, aligns waistbands, keeps the hair layer clear of clothing and fits socks/boots to the complete feet. Front/rear footwear details differ. Render offscreen and discard stale selections. Mobile preview uses a compact side-by-side figure/view-control layout. Preserve these boundaries when adding clothes; rectangular full-outfit strips reintroduce clipping and mixed-garment fragments. Saved look schema/access rules are unchanged.

- Approved wardrobe expansion: 22 new free clothing items (including White Fox Shadow/Glacier Grey hoodies), all 26 2026/27 WSL/WSL2 home-kit illustrations and separately selectable shirt/shorts/socks, search/style filters, new fitted core bottoms and new front/rear art for all 17 earned boots plus starter. Independent garment/boot sprites replace stretched hips and procedural footwear. Preserve old saved IDs and boot/gold entitlements. Kit sponsor research has three explicit launch-version exceptions: Durham, Sunderland and Watford; keep their principal fronts blank until women's current sponsorship is verified. See `docs/player-space/builder-art-provenance.json` for generation/source metadata. `approved_builder_wardrobe` is applied (validator enums only); authenticated rollback-only checks passed. No usability testing.

## Single teenage builder template — batch one, 1 November 2026

- One fixed slim teenage-looking model replaces the adult preset picker and build controls. Legacy build values normalise to slim; retained server enum values are compatibility only. Start fully clothed in a navy training outfit and starter boots. No database migration or player-row rewrite.
- `lib/builderFit.ts` gates the completed fitting batch: navy/white tees, navy/gold hoodies, navy shorts, ankle-sock colours, starter boots and ponytail. Pending garments, kits, earned boots and other hairstyles stay visibly marked Being fitted. Preserve saved IDs/unlocks; pending saved looks use the clearly explained training fallback and cannot overwrite a saved look until fitted items are selected.
- `public/player-space/builder/v2/` and fixed template crops replace garment bounding-box scaling. Keep all landmarks shared; explicit coverage clears the old body before aligned sleeves are composited. Never enable legacy adult sprites on this template. Refit and inspect items in small batches. See `docs/player-space/build-my-player.md` for exact prompts, export and limits.
- Eight existing builder checks, TypeScript, production build and sixteen artwork/view/appearance renders passed. No usability testing or database changes.

## Branded builder batch two — 1 November 2026

- `builderFit.ts` now enables the existing Nike Club grey-marl hoodie/joggers and White Fox Shadow/Glacier Grey hoodies. Eight v2 exports are edited directly from the working teenage template; maintain identical fixed coordinates. Other pending pieces remain unavailable.
- The lower-body replacement mask covers old shorts/legs and excludes hands; tops overlay the waistband. Sock recolouring starts below full-length cuffs. Preserve separate brand artwork, saved IDs and existing entitlements. No migration.
- TypeScript, production build and 56 mixed outfit/view/appearance artwork renders passed. No usability tests. Exact source hashes/prompts and export details: `docs/player-space/builder-branded-batch-2.json` and `build-my-player.md`.


## Branded builder batch three — 1 November 2026

- Five more existing IDs fitted: adidas Firebird top/trousers, adidas Originals tee, Under Armour Tech half-zip and PUMA Essentials hoodie. Ten aligned v2 exports, same template. Short-sleeve branded tees use training coverage; long sleeves use the established full-arm mask. Firebird sock recolouring begins below its white stripes.
- Saved IDs/unlocks and remaining fitting gates stay intact; no migration. Exact source metadata/prompts: `docs/player-space/builder-branded-batch-3.json`.
- TypeScript, production build and 132 mixed outfit/view/appearance renders passed. No usability tests.


## Nike Pro builder fitting batch — 1 November 2026

- Enabled existing Nike Pro crop/shorts IDs in black/white. Crop outfits use four fitted torso/waist variants for all completed bottoms; eight v2 exports. Regular tops keep their full hem when worn with Pro shorts. Further bottoms need a crop-compatible variant before activation.
- Same fixed crop/export coordinates and existing personalisation/save/unlock rules; no migration. Exact prompts and source hashes: `docs/player-space/builder-nike-pro-batch.json`.
- TypeScript, production build and 192 mixed outfit/view/appearance renders passed; no usability tests.


## Ellesse pink tracksuit — 1 November 2026

- Added separately selectable free Ellesse pink crew-neck sweatshirt and joggers from owner garment photos; six v2 exports include the crop/jogger variant. Preserve plain backs, chest/thigh branding, pink fabric and fixed template dimensions. Jogger rear export uses x887 to compensate for its measured source translation, without scaling.
- Warm brand emblems are protected from skin recolouring; socks begin below cuffs. `export-builder-branded.cjs` supports optional rear crop alignment. Source hashes/prompts: `docs/player-space/builder-ellesse-pink.json`.
- Migration `20261101222814_ellesse_pink_tracksuit` is applied; only two validator IDs added, existing permissions/unlocks unchanged. TypeScript, production build, 260 mixed artwork renders and rollback-only authenticated save/privacy/entitlement checks passed; no usability tests.

## Builder waist clipping correction — 1 November 2026

- Replaced flat top boundaries with measured front/rear hems for fitted tops. Long-sleeve coverage clears the original bare arms above the waist, then stays outside the selected bottoms at the hips. Do not copy the source outfit's navy shorts below a top or clear trousers with sleeve rectangles.
- The Ellesse waist defect was visible despite the earlier reduced-size render review. Rechecked 120 top/bottom/view combinations in waist crops at source resolution and the Ellesse front/rear waist at 2× size, plus both appearance render sets. TypeScript and production build passed. Renderer only; no migration, save rules or entitlement changes. No usability tests.

## Builder sock fitting — 1 November 2026

- Added seven independent free sock choices: white/black Nike ankle and crew socks, black adidas ankle socks, white Gain The Edge grip crew socks, and the owner's white/burgundy cherry ribbon grip socks. Fourteen front/rear lower-leg strips keep the fixed template scale; exact prompts, reference/source/output hashes and measured alignment are in `docs/player-space/builder-socks.json`. Export with `scripts/export-builder-socks.cjs`.
- `builderSocks.ts` finds connected exposed knit beneath each actual cuff instead of using a flat recolouring cutoff. This removes the white band under trousers while preserving adidas stripes and boots. New shafts/frills overlay bare calves with shorts and tuck beneath trousers; apply sock branding after skin personalisation. Search matches the new labels.
- Migration `20261101232010_builder_socks` is applied. Only seven sock validator IDs are added. Rollback-only authenticated checks cover all seven choices and legacy colours, guardian/linked-player saves, unknown socks, existing locks and cross-family isolation. Security advisories are unchanged. Nine builder checks, TypeScript, production build and 220 outfit/view/appearance renders passed, with enlarged cuff inspection. The catalogue regression check follows the latest validator migration and includes the previously added Ellesse pieces. No usability tests.

## Complete independent builder layers — 2 November 2026

- All existing wardrobe options, 26 home kits, 17 earned boots, starter boots and four hairstyles now use independent v3 sprites on the single slim body. Fitting gates are complete. Keep all persisted IDs, gold/boot entitlements, card/squad rules and server validation. No database changes.
- Body/skin, socks, bottoms, tops, boots and hair composite separately. Garment branding is never skin/hair recoloured. Socks precede trousers; boot layers contain footwear only. Hips/crotch stay continuous, lower legs register separately, and club knit follows the shared calf outline. Body and hair are framed together with room for buns/puffs.
- `scripts/export-builder-complete.cjs` exports the v3 rig from generated source sheets and existing independent garment art. Never restore full adult body sprites or the old source-outfit replacement rectangles. Source/prompts/hashes: `docs/player-space/builder-complete.json`.
- Durham's blank principal front is confirmed by the official 2026/27 launch photographs. Sunderland and Watford retain their explicit launch labels and blank principal fronts until women's sponsorship is verified; do not substitute men's sponsors.
- Resumed verification: corrected raised collars crossing the mouth by restoring the complete head above garment layers; retained the 32-image cache limit. Nine existing builder checks, TypeScript, production build, 144 catalogue/view renders and 106 sock/appearance renders passed. Native-size wardrobe, kit and collar composites inspected. No browser/usability checks or database changes.

## Individual wardrobe correction pass — 2 November 2026

- The owner's five screenshots revealed defects despite the previous broad render counts. The earlier statement that the complete wardrobe was fitted is not a visual sign-off. Build My Player remains behind the existing Coming Soon panel; do not reopen it as part of a fitting batch.
- First correction batch: seven separately measured front/rear sock registrations, continuous textile feet without the old white ankle underlay or bare-toe fringes, and individual source limits for adidas/Gain The Edge branding. Socks remain beneath trousers and boots. Arsenal/Charlton sock silhouettes use the new registration; other club socks retain their existing rendering pending individual review.
- Arsenal, Charlton and Ellesse sweatshirt neck openings use shaped front apertures and separate rear nape boundaries. Rear ponytail anchor moves from -60px to -88px to cover the exposed scalp. Other hair placements and garment collars remain pending.
- `docs/player-space/builder-item-review.json` records every catalogue entry separately and distinguishes corrected local artwork from related-outfit inspection and unreviewed items. Do not bulk mark the remaining catalogue complete. `scripts/render-builder-item-review.cjs <absolute-output-directory>` reproduces sock close-ups with `BUILDER_CANVAS_MODULE` pointing to an available @napi-rs/canvas installation; it does not interact with a browser or player data.
- Keep all saved IDs, reward entitlements and database validation unchanged. No migrations, account changes or usability testing in this batch.



## Builder artwork preview checkpoint — 2 November 2026

- The owner requested deployment of the work in progress to inspect it. `/player-portal/builder-preview` uses the real builder and renderer with a synthetic demo ID, in-memory saves and all demo boots available. It has noindex metadata, reads no family data and does not change saved profiles or earned rewards. The regular Player Space Coming Soon panel remains in place.
- v4 adds remade white/black Nike ankle socks and starter, IDA, Tekela, Superfly and Stadio footwear, plus individually registered Furon, Morelia, Absolute, Total 90, Etrusco and Tiempo pairs. Boot openings have their own cuff coverage; socked feet are not left projecting outside boots. Retained low-cut boots anchor at the ankle opening rather than the higher sock rim.
- All 38 sock choices have had separate front/rear artwork checks without boots and with starter boots. Crew and club shafts stay above their actual boot cuffs; Bristol City's source stops at y860 to omit its former white footwear fragment. Native review sheets preserve aspect ratio.
- This is not a completed wardrobe fitting. Tops, bottoms, hair, seven earned boot pairs and broader mixed-outfit compatibility remain pending. Keep the individual review record accurate and continue one item at a time. Do not infer visual correctness from render counts.
- Source PNGs, measured registration receipts and output hashes are recorded in `docs/player-space/builder-v4-provenance.json`; `scripts/export-builder-v4.cjs` recreates the current batch. Saved IDs, server validation, entitlements and database schema are unchanged. No browser/usability testing or account/database writes.


## School and club portal — 3 November 2026

- `/school-club-portal` is the shared invitation-only organisation portal. Schools request tasters, lunchtime/after-school clubs, player observation visits or bespoke support; clubs request team coaching, observation visits or bespoke support. The resource area contains eight original resources covering the four approved categories.
- Staff Portal → Schools & clubs is manager/owner only. STAR creates organisations and individual email-bound invitations, revokes staff, pauses organisations, connects existing player records, publishes selected feedback/support and reviews referrals, requests and observations. Creating an invitation does not send email: STAR shares the displayed portal link manually. Unaccepted invitations expire after 14 days.
- Existing Parent Portal → Account includes School & club connections. A linked guardian explicitly approves or withdraws organisation sharing. All individually invited staff within that organisation see its approved players: current working goals, 90 days of STAR attendance and STAR-selected feedback/support. Full player profiles, health information, media and family messages are excluded. Guardian unlinking, permission withdrawal, staff revocation and organisation pause take effect on subsequent server operations.
- Both referral methods are supported: organisation staff attest parent permission, or families use the organisation’s link to submit via their own verified Parent Portal login. Email confirmation preserves the referral query and Account destination. Referrals never automatically match or link existing players by name or grant access. Session requests are reviewed and confirmed separately; they do not automatically create training-calendar bookings.
- Additive migration `20261103043832_school_club_portal` is applied. New tables use RLS and manager-only direct reads; writes and minimal organisation projections go through the invoker RPC `star_organisation_portal` and a checked private dispatcher. Live verified email and current membership are checked server-side, without user-editable JWT metadata. Parent consent changes have a separate immutable audit history. Existing family/staff RLS is unchanged.
- Validation: TypeScript, production build, parent account checks, and rollback-only `supabase/tests/school_club_portal_rls.sql` for both referral routes, live consent, cross-organisation/family isolation, raw-table protection, manager actions, invitation expiry/revocation, paused organisations and anonymous denial. Security advisories unchanged. The pre-existing `test-staff-app.cjs` fails identically on the untouched base because its old attendance fixture lacks explicit roster participants; no attendance production logic was changed. No browser/usability tests or real invitations were sent.


## Organisation referrals and co-branding — 3 November 2026

- Expansion decisions and batch boundaries are in `docs/portal-expansion/brief.md`. First batch leads with referrals; the remaining inbox, email/invitation delivery, scheduling, resource and shared-goal enhancements remain planned.
- Manage branding and the default referral assignee in Staff → Schools & clubs → Branding & promotion. The public `/refer/[code]` page returns only active organisation branding. Submission continues through the verified Parent Portal, retaining organisation attribution; old parent referral links remain valid.
- Approved public logos use the isolated public `organisation-branding` bucket (PNG/JPEG/WebP, 512 KB). Only STAR managers upload/change saved branding. The promotion toolkit generates printable SVG QR posters, 1080-square PNG social graphics and ready-to-copy email/newsletter/caption text. QR generation runs locally; artwork includes no family data and retains the actual STAR logo.
- New referrals receive a server-set 12-hour deadline and active chosen staff assignment, falling back to the owner. Staff Home includes outstanding follow-ups and persistent new/overdue alerts. A five-minute database job generates owner overdue alerts once per referral. Contact and actual first-session attendance are separate dated milestones, recorded manually after the event. No automatic player linking, enrolment or attendance-register mutation.
- Managers see/reassign all referrals; an assigned active STAR coach sees/updates only their task. External organisation staff retain existing consent-protected views, with internal assignee/deadline fields stripped. Revision checks prevent stale follow-up overwrites.
- Organisation summary is on-screen. STAR additionally sees conversion and average first-contact time. Completed coaching requests are labelled as requests/visits/blocks until session calendar integration supports an individual-session count.
- Migration `20261103144612_organisation_referral_growth` is applied. TypeScript, production build and existing parent-account check passed. Both rollback-only organisation permission suites passed, including anonymous branding-only access, external staff denial, chosen assignment, exact deadline, owner alert deduplication, assigned-coach isolation, milestones and stale-save prevention. Existing security advisories are unchanged; synthetic records were rolled back. No real messages or invitations sent and no browser/usability tests.


## Organisation inbox and email alerts — 4 November 2026

- School/club Portal → Inbox supports general and consent-protected player conversations. Staff Portal → Inbox now contains Families and Schools & clubs. Organisation Overview, Staff Home and the staff navigation show personal unread counts. Existing family message behaviour is unchanged.
- New selected feedback, observations, coaching requests and referral/request replies enter contextual conversations automatically; existing records are not backfilled. Replies are immutable through the client, with retry UUIDs and server throttling. A recipient reads only their own alerts; history has earlier-message pagination.
- Additive migration `20261104015451_organisation_inbox` creates private RLS-protected message/delivery tables and checked invoker APIs. Active verified identity, organisation membership, active STAR management and current parent sharing are checked at read/write and before delivery. Revocations/pauses/withdrawal suppress queued alerts.
- Production server handler `/api/organisation-alerts` uses existing Resend configuration and a new dedicated Vault/Vercel worker credential, with no service-role key in Vercel. Minute cron, token leases, stable provider idempotency, checked receipts and bounded exponential retries keep delivery independent of browser sessions. Generic emails contain no player or message details. Operational monitoring/rollback: `docs/portal-expansion/organisation-inbox.md`.
- TypeScript and production build passed. Rollback-only inbox access/privacy/unread/idempotency/queue checks and fourteen mocked mail delivery cases passed. Existing security advisories unchanged; no real test emails or usability tests.


## Organisation coaching scheduling — 4 November 2026

- Staff → Schools & clubs → Coaching schedule creates single dates or weekly blocks (up to forty dates, explicit holiday exclusions), assigns active verified STAR coaches and enters confirmed arrangements in the shared training calendar. Calendar rows link back to organisation management. Staff Home shows upcoming organisation coaching; non-manager coaches see their own assigned sessions. Organisation Overview and Coaching schedule show upcoming dates, coach, venue, requests and actual delivered-session totals.
- Civil UK time is resolved per occurrence, retaining the same weekly local start through GMT/BST; missing/repeated hours are rejected. Per-coach transaction locks reject organisation-session overlaps, with atomic block rollback and idempotent creation retries. Other commitments without an assigned coach are still checked by STAR.
- Organisation requests never change bookings directly. Managers apply concrete changes/cancellations or decline with a response; revision checks guard session and request updates. Cancellation retains history and excludes the row from upcoming/attendance selectors. Recorded attendance prevents cancellation/time rewrites. Delivered status is explicit, after the session ends, and independent of completed-request metrics.
- Private RLS scheduling tables and invoker API enforce verified live roles/membership. Group organisation sessions cannot be published as personal family bookings and never auto-populate player rosters, attendance or consent. Ordinary calendar/family publication remains supported. Inbox events use the already deployed generic email queue.
- Applied migrations `20261104030241_organisation_scheduling` and `20261104030537_organisation_calendar_time_guards`. TypeScript, production build, fifteen date/time checks, existing parent-account checks and rollback-only scheduling access/DST/conflict/retry/request/revision/cancellation/delivery/attendance/family-compatibility checks passed. Security advisories unchanged; no real test bookings/emails or usability tests. Operations/limits: `docs/portal-expansion/organisation-scheduling.md`.


## Direct booking calendar — 4 November 2026
- Parents book under Sessions; organisations use Book coaching. Prestige has no self-booking service. Standard bookings confirm atomically against the shared training calendar; bespoke work stays quotation-only.
- Opening hours in Europe/London: Mon/Tue/Thu/Fri 10:00–20:00, Wed 10:00–17:00, Sat 10:00–16:00, Sundays closed. Each coach has a 30-minute travel/setup gap; unassigned legacy calendar sessions conservatively block all coaches.
- Parents pay off-site after sessions; organisations pay by invoice. Organisation blocks of 10–40 dates receive 15% off. Schools/clubs provide suitable facilities. Prices/durations are authoritative in booking_services; no Curriculum PE or standard regular whole-team service.
- Sparks releases reserve Monday 15:45–16:45 at one venue for two different coaches, ages 5–7 and 8–10, 10 places each. Release dated sessions only when the venue and coach assignments are known.
- Staff Calendar → Booking management controls enabled coaches/services, individual venues, dated groups, closures, Flyers entitlement and cancellations. No coaches or sessions are automatically enabled by migrations. Configure these before expecting bookable availability.
- Booking tables are private with deny-direct policies. The RPC checks current guardian/organisation access on every operation; no client pricing or capacity is trusted. Cancellation preserves history and restores unused Flyers entitlement. Legacy editors cannot delete released arrangements or bypass group capacity.
- Three direct_booking_calendar migrations are applied. Rollback-only supabase/tests/direct_booking_calendar.sql checks ten-place capacity, separate age groups, family/organisation isolation, retry idempotency, block pricing/atomicity, UK hours/DST, cancellation and permissions. No real bookings or emails were created by these checks.

## Automatic parent availability and staff calendar — 4 November 2026
- Individual availability is generated inside opening hours from free coach time, without requiring a published slot or prefilled venue. Unknown individual venues are explicitly recorded as “Venue to be arranged with STAR”. Existing enabled coach/service and age/entitlement checks, closures, calendar conflicts and 30-minute buffer still apply.
- Staff Calendar now leads with day/week/month grids, period/date navigation and session detail dialogs. It loads the selected date range independently of the old paginated list. Mobile starts in day view; overlapping appointments occupy separate columns. Booking settings and legacy session controls remain collapsible below.
- Migration parent_automatic_booking_availability is applied. A rollback-only parent check verified 37 one-hour start times on an empty ten-hour day, successful booking with blank venue, and correct 11:30 availability after a 10:00–11:00 appointment. Production build and TypeScript passed; no real test bookings or emails.

## Football History Collection
- Player Space → History includes 30 Trailblazers stories with five multiple-choice questions each. The catalogue in `lib/content/football-history.json` supplies prompts and options. Keep the private SQL answer positions in sync when editing choices. The illustrated fronts and backs live in `public/player-space/history`.
- The server marks all five answers together. A 5/5 awards the numbered card once, and a lower score delays another attempt for that story by 20 minutes. Other stories remain available. Account progress is private to the linked player and approved guardians. The sample and staff preview can browse stories without accessing quiz progress.
- My collection presents earned cards with Front and Back controls. Use the rollback-only `supabase/tests/player_football_history_rls.sql` suite for changes to quiz permissions, attempts or rewards.
- Ages 5–10 open STAR Sparks, with 30 illustrated story cards and one question at a time. Ages 11+ open Trailblazers and can view any previously earned Sparks cards in My Sparks cards. The server uses the linked onboarding or registration date of birth and returns only the edition. Card IDs 101–130 are Sparks, while 1–30 are Trailblazers. The scoring RPC enforces the active edition before calling the shared scoring function.
- Special editions SE01 (Afghanistan Women’s National Team, ID 31) and SE02 (North Korea Women’s National Team, ID 32) use the same server-scored quiz for linked players aged 11+ and have a separate count from the standard 30-card series. Keep the fully illustrated faces and their text alternatives in sync with the sourced story.
