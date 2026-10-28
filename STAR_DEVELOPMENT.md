# STAR Development Centre — Development Guide

> Working reference for AI coding agents and human developers. Last updated: 28 October 2026.
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

## Programmes — confirm prices before publishing changes
These are business requirements provided in earlier planning; check with the owner before changing public pricing.
- STAR Sparks ages 5–10: £5 per 45-minute group session, pay-as-you-go.
- Group coaching ages 11–16: £5 per 45-minute group session.
- Flyers ages 7–10: 16 weekly one-hour individual sessions; £375 upfront or £380 total across three payments.
- Ad-hoc individual coaching ages 11–18: £40 per one-hour session.
- Prestige ages 11–18: 24 weeks, typically weekly 90-minute individual sessions; £800 upfront, 3 × £280 or 6 × £150.
- Player Season Support: £25 per visit, with agreed observations and coaching support.
- Ages 17–18: individual coaching only.
- Do not imply external academy endorsement or guarantee trials/pathway outcomes.

## Player onboarding journey
- Parent account first. Parents complete and submit onboarding from their own login; creating, activating or linking a separate player login is optional and can happen later.
- Parent or player completes a saveable full player profile: football experience, goals, support needs, relevant health/emergency information and separate media consent choices.
- Kit sizing means **training-top size and boot size only**.
- A head-to-toe photograph is for identification and the private player profile; public promotional use requires separate choices.
- Keep the family journey simple: complete the form, review it, then use one prominent **Submit & request FREE assessment** action. Show a clear completion screen with a link back to the Parent Portal and explain that the parent can leave.
- Keep player login setup and secure email-specific account linking under an optional section after submission; do not make parents wait for player activation or linking.
- Submission validates and saves the completed form, records the parent’s participation/media confirmation and requests the **FREE 30-minute assessment and introduction** together. STAR confirms time and venue separately.
- `/onboarding` holds pre-assessment profiles independently of existing enrolled coaching records. It never grants access to existing coaching records.
- Staff managers manage assessment requests at Staff Portal → Onboarding & assessments. New profile edits invalidate parent review.

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

