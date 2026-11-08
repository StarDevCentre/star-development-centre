# STAR HQ — Batch 1 Implementation Handoff

Status: **Ready to begin implementation, NOT implemented**
Approved spec: [RECEPTION-V1-SPEC.md](./RECEPTION-V1-SPEC.md)
Branch: `feature/star-hq-reception-prototype` (isolated from `main`).
Date: 8 November 2026.
No production merge, deploy or public/player launch without the owner's approval.

## Repo baseline verified
- `package.json`: Next.js `^15.3.0`, React `^19.0.0`, TypeScript `^5.8.2`, Supabase JS `2.76.1`. No existing Three.js/R3F packages.
- Player Space: `app/player-portal/page.tsx`, `components/PlayerTrophyPortal.tsx`, `components/PlayerSpace.tsx`.
- Existing Player Space profile and art: `components/PlayerCard.tsx`, `lib/buildMyPlayer.ts`, `public/player-space/hero-player-star-kit.webp`, `public/player-space/builder/star-front.webp`, `star-back.webp`.
- Existing awards: `components/PlayerTrophyCabinet.tsx` and `lib/achievementBadges.ts`.
- Existing owner preview pattern: `components/OwnerPlayerSpacePreview.tsx`, `app/staff/player-preview/page.tsx`; staff membership uses `public.staff_members` and active owner role. This precedent does **not** by itself prove a new route is securely gated: verify server-side authentication before exposing the scene.
- Use official approved logo artwork already in `public/images/` rather than approximating it.
- Read and honour `STAR_DEVELOPMENT.md` before implementation.

## Build sequence, commit in independently reviewable steps

### 1. Dedicated owner-only preview entry point (safety gate FIRST)
- Choose a secure owner-only preview route such as `/staff/star-hq-preview`. It is **not** linked from Player Space, indexed publicly or accessible to ordinary signed-in players at this stage.
- Authenticate on the server and check current `staff_members` owner membership/active status; avoid relying solely on CSS hiding or a client-side Boolean. Review current auth/session architecture before deciding whether an SSR Supabase helper is required. Any missing secure guard is a stop condition: keep demo local, do not deploy an unprotected route.
- No production records: hard-code a synthetic `testPlayer` object (`{ firstName: "Alex", shirtName: "ALEX", shirtNumber: 10 }`), not a real account. No calls to player tables, signed photo URLs, or storage.
- Set noindex metadata and ensure any future preview hosting is protected. An unpublished Git branch itself is not an access control mechanism.

### 2. Client-only, lazily loaded game runtime
- Add `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` with pinned compatible versions and updated `package-lock.json` **only when starting code implementation**. Verify release versions before install. React Three Fiber **v9 pairs with React 19**; avoid v10 alpha without explicit reason.
- Next.js App Router: use a small browser Client Component with `next/dynamic(..., {ssr:false})` around the WebGL scene, not `ssr:false` directly from a Server Component. The route should not load graphics bundles until visited.
- `<Canvas>` mounts once; abort/unmount animations, sound, listeners and GPU resources on exit; add loading indicator and WebGL unsupported fallback.
- Proposed structure (subject to current repo patterns):
  - `app/staff/star-hq-preview/page.tsx` — guarded preview shell.
  - `components/star-hq/StarHQEntry.tsx` — client load controls, fallback, exit.
  - `components/star-hq/StarHQScene.tsx` — 3D root, time/lighting, camera.
  - `components/star-hq/ReceptionEnvironment.tsx` — lobby, signage, colliders, windows/exterior.
  - `components/star-hq/PlayerController.tsx` — avatar rig/animation, walk and camera.
  - `components/star-hq/MiaNPC.tsx` — receptionist idle/action animation, interaction.
  - `components/star-hq/BackgroundNPCs.tsx` — simple waypoints and task loops.
  - `components/star-hq/DialogueOverlay.tsx` — accessible HTML/text choices.
  - `components/star-hq/StarHQControls.tsx` — desktop, mobile, audio/settings, exit.
  - `lib/starHQ/testFixtures.ts`, `lib/starHQ/dialogue.ts`, `lib/starHQ/londonTime.ts` — pure helpers, synthetic fixtures.
  - `public/star-hq/v1/...` — approved original/licensed, optimised GLB/texture/audio assets.
  - `docs/star-hq/ASSET-PROVENANCE.md` — source, commercial rights and license for each model, animation, sound and screen image.

### 3. Realtime 3D reception shell
- Build an actual 3D scene, not 2D backgrounds or game-concept art. Model physical walls/floor/ceiling, timber reception desk, authentic STAR logo wall, sofas, screens, plants and glazing to an outdoor training-ground vista.
- Start from **18m × 12m × 4.2m** reference geometry and tune to the avatar scale and mobile field of view.
- South entrance spawn, north reception desk, direct marked **Changing Rooms**, **Trophy Gallery** and **Training Pitches** doors. Closed doors trigger small “Coming soon” messages (no room switching in v1).
- Colliders on walls, desks, doors and major furniture; prevent geometry/camera clipping, avoid spawn collisions and dead ends.

### 4. Proper rigged player character and motion
- Rigged **3D** fictional teen-style footballer, blonde ponytail, approved official STAR training top, black shorts/socks/trainers. One model only; no saved player appearance in v1.
- Proper bones/skinning and walk-idle animation blending, slow turn animation, procedural/clip-based breathing and head motion, blinking if facial rig permits.
- Walking only, ~1.2–1.5m/s; full-body third-person camera about 3m back, mobile left virtual stick/right drag, desktop WASD/mouse with E-to-talk. Camera obstacle collision, joystick dead zones, touch-action prevention scoped to game canvas only; don't block browser navigation globally.
- Maintain proportional 3D physics scale and footwear floor contact.

### 5. Mia and background NPC behaviours
- Mia: fictional ~22-year-old woman; brown tied-back hair; STAR-branded polo and smart trousers; desk idle tasks (typing, screen check, straighten items) and gaze/turn to player on approach.
- Talk prompt at ~1.6–2m, select by tap or E. Dialogue overlay uses semantic buttons, readable contrast, keyboard focus and an exit option. Freeze player movement and restore controls on close.
- Scripted, deterministic dialogue addressed to **Alex**. No generative NPC responses and no unrestricted player text input.
- Additional ambient NPCs: coach, two fictional academy players, a parent and administrator. Use bounded fixed paths, natural walk/idle cycles, staggered schedules, crowd avoidance and cull/LOD on low-end devices. No NPC interaction except Mia.

### 6. Real UK time, audiovisual controls and polish
- Use `Europe/London` for actual local time and correct DST. Display consistent daytime/dusk/night with sky/exterior lighting and warm interior illumination. Document v1 approximations in seasonal daylight handling.
- Original/licensed women's football-inspired material on screens; use branded/motion-graphic placeholders if original licensed highlights are unavailable. No external embeds, sound autoplay or private media.
- Separate mute/volume controls for ambient effects and music, default safely quiet; persist only simple local preferences if necessary. Support reduced motion.
- Pause/render throttling for background/inactive tabs and degrade shadows/post-processing on phones.

### 7. Verify before requesting owner review
- Add regression and security tests (for example `scripts/test-star-hq-prototype.cjs`) proving route authentication intent, no player data endpoints, static fixture use, no index, and no accidental Player Space home/nav modification.
- Run `npx tsc --noEmit`, `npm run build` (runs existing player-invitations and staff-reliability tests), and relevant Player Space regressions.
- Test signed-out, active coach, inactive owner/staff and active owner attempts. Confirm only active owner can enter, and no test causes production data writes.
- Manually test: desktop Chrome/Firefox; Android Chrome/PWA; iPhone Safari/PWA where available; keyboard navigation; joystick/camera; no stuck or clipping; Mia conversation; closed doors; UK midday/night time; audio muted; WebGL disabled fallback; exit/refresh.
- Initial performance budgets (targets, not guaranteed): **30+ FPS on supported mid-range mobiles**, stable desktop play, compressed models/textures, initial scene download ideally **under ~15 MB**, reduced-draw-call scene and adaptive quality. Measure device results; don't claim targets passed before testing.
- Capture review evidence (screenshots, mobile controls recording, build/test results, asset list). **No production merge or deployment**; request owner approval after verification.

## Integration boundary after owner approves prototype
- Keep existing Player Space as the primary user interface.
- Only in a later approved batch add optional `Enter STAR HQ` entry. Route must check the current user's linked player access; selected player must be authorised on the server; never trust user-controlled player IDs.
- Later connect shirt/name to the **same saved Player Card** and trophy displays to **existing achievement records** through read-only projections. Never duplicate or mint awards in HQ. Match existing model and entitlements.
- Keep current owner-only demo fictional until explicit approval to introduce real player information.

## Definition of done for Batch 1
- An active owner can open a truly 3D reception; an unauthorised user cannot.
- Playable character walks and collides naturally with the environment, controlled from desktop and mobile.
- Mia animates and holds accessible scripted conversations, beginning only at player request.
- Visible distinct background NPCs animate and traverse valid routes.
- Correct branding, lobby furnishings, outdoor vista, closed area signs, UK time lighting and independent audio controls.
- Satisfactory documented build, typecheck, security and device testing.
- No existing Player Space behaviour/data modified; no main branch merge; no production deployment.

## Current preparation state
- [x] Approved 50 product decisions recorded in companion specification.
- [x] Dedicated GitHub feature branch created off `main`.
- [x] Implementation sequence, planned paths, security requirements, sample fixtures and acceptance gates documented.
- [ ] Install 3D engine dependencies and construct actual WebGL scene.
- [ ] Build/obtain and license the finished 3D models and animation clips.
- [ ] Implement secure owner preview route and gameplay code.
- [ ] Run typecheck/build and real device acceptance tests.
- [ ] Obtain owner approval before preview release/production changes.

This plan describes **preparation only**. Documentation commits do not constitute a functioning 3D prototype.
