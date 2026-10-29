# STAR Development Centre — Development Guide

> Working reference for AI coding agents and human developers. Last updated: 29 October 2026.
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

## Programmes — confirm prices before publishing changes
These are business requirements provided in earlier planning; check with the owner before changing public pricing.
- STAR Sparks ages 5–10: £5 per 45-minute group session, pay-as-you-go.
- Group coaching ages 11–16: £5 per 45-minute group session.
- Flyers ages 7–10: 16 weekly one-hour individual sessions; £375 upfront or £380 total across three payments.
- One to One Coaching ages 11–18: £40 per one-hour session.
- Prestige ages 11–18: 24 weeks, typically weekly 90-minute individual sessions; £800 upfront, 3 × £280 or 6 × £150.
- Player Season Support: £25 per visit, with agreed observations and coaching support.
- Ages 17–18: individual coaching only.
- Do not imply external academy endorsement or guarantee trials/pathway outcomes.

## Programmes page and finder
- One to One Coaching is the lead service and its consistent public name. Keep the agreed website design; the audience includes players and families.
- `/programmes` has an age filter, an individual-coaching feature, Flyers/Prestige cards, separate cards for group ages 5–7, 8–10, 11–13 and 14–16, and a separate Player Season Support section. Preserve existing programme anchor IDs.
- Reuse `/find-your-programme` as the single guided finder. Match age and stated focus, show the reason for each suggestion and rank One to One Coaching first for eligible individual goals. Do not suggest individual programmes as group matches; explain ages 17–18 have individual options.
- Public descriptions and enquiries do not require an account. Programme enquiries use the existing contact form with the programme and selected age carried through.
- Prices and payment options stay exclusively in the server pricing route and are returned only after validating a non-anonymous signed-in user. Viewing prices no longer requires a parent profile or submitted player registration; enrolment permissions remain separate. Never embed prices in public page data, HTML or client bundles.
- The pricing sign-in links accept only the `programmes` or `finder` return destinations. The existing parent sign-in/confirmation flow returns to that page; password recovery must finish before redirecting.
- Run `node --test scripts/test-programmes.cjs` for age/focus matching and mocked pricing authentication checks when modifying these areas.

## Public Football Hub
- `/articles` is the public collection of 12 original, detailed coaching guides; `/articles/[slug]` serves each guide with contents navigation, a practical activity, takeaways and related reading. It is separate from the completed private Parent Learning Hub.
- Content lives in `lib/content/football-hub-articles.json`, with helpers in `lib/footballHub.ts`. Keep public content independent of family records and portal content. Reading times are calculated from article text.
- Maintain the agreed website style and shared header. These are practical STAR coaching guides, not research reports or guaranteed development outcomes. Link external further reading where it informs an article; distinguish STAR examples from third-party guidance.

## Search and sharing
- `/site-index` is the visitor-facing directory, linked from the footer. `/search` provides ranked public results and category filters; the shared header provides debounced suggestions through `/api/site-search`, plus a normal GET search form. Search result pages are noindex and omitted from the XML sitemap.
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
- Parent account first. Parents complete and submit onboarding from their own login; creating, activating or linking a separate player login is optional and can happen later.
- Parent or player completes a saveable full player profile: football experience, goals, support needs, relevant health/emergency information and separate media consent choices.
- Kit sizing means **training-top size and boot size only**.
- A head-to-toe onboarding photograph is for private identification and must not populate the Player Space card. Players choose their card photo or avatar separately; public promotional use requires separate choices.
- Keep the family journey simple: complete the form, review it, then use one prominent **Submit & request FREE assessment** action. Show a clear completion screen with a link back to the Parent Portal and explain that the parent can leave.
- Keep player login setup and secure email-specific account linking under an optional section after submission; do not make parents wait for player activation or linking.
- Submission validates and saves the completed form, records the parent’s participation/media confirmation and requests the **FREE 30-minute assessment and introduction** together. STAR confirms time and venue separately.
- On parent submission, `/onboarding` creates the family’s own Player Space under the **Assessment** programme. This does not enrol the player in a paid programme. Its stored `portal_player_id` connects both portals to one profile; existing approved onboarding links are carried through. Never match existing coaching records by name or grant access to a different family’s record.
- Account linking uses the invited person’s verified email and one named **Connect** action in Player Space or onboarding. Do not ask families to copy account IDs or invitation codes. A connected player opens the same profile on later sign-ins. Keep onboarding and Player Space links consistent when access is revoked.
- Staff managers manage assessment requests at Staff Portal → Onboarding & assessments, and can record when they have contacted a family. This marker records a manual action; it does not send a message. Parents can see their assessment status and confirmed arrangements in the Parent Portal. New profile edits invalidate parent review.

## Portal product intent
### Player Space
- Mobile-first and age-appropriate for younger and older players.
- Homepage prioritises next session.
- Profile: photo/avatar, shirt name/number, positions, stronger foot, ambitions and appropriate football preferences.
- Personal goals, coach-assigned practice plans, optional extra challenges, achievements and trophy cabinet.
- Progress timeline, confidence/enjoyment reflections, match reflections and football learning.
- Personalised messages and player questions with parent-visible replies where appropriate.
- Customisable themes, avatar features and earned decorations.
- Ball cosmetic options: classic black/white, yellow Nike, orange Nike, Gold 90; planned unlocks at 10 sessions (yellow/orange) and 50 sessions (Gold 90).
- Ensure player hero/customisation remains usable on mobile.

### Parent Portal
- Clear, accessible view of their own child's sessions, development, progress and coach communications.
- Age-appropriate football/tactics education with simple explanations.
- Formation explorer product intent: 9-a-side 2-4-2, 3-3-2, 3-2-3; 11-a-side 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 4-5-1, 3-1-4-2.
- Highlight primary and secondary coach-set positions distinctly; explain movements using short animations, arrows and plain language.
- Stadium/pitch presentation should be polished and intuitive, not at the expense of mobile performance.

### Coaching / Staff Portal
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

