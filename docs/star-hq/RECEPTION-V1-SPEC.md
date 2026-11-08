# STAR HQ — Reception and Character Design Specification (v1)

Status: **Approved product direction; implementation not yet started**
Date: 8 November 2026
Branch: `feature/star-hq-reception-prototype`
Owner review required before any deployment or production change.

## Product contract
STAR HQ is an **optional, separate 3D experience**, launched by choice from the existing Player Space in a later release. It never replaces Player Space, the Player Card, Build My Player, Trophy Cabinet, learning, coaching records, or existing navigation. The initial preview is for the **STAR owner only** and uses **fictional data exclusively**. Do not add a public or player-facing HQ entry point in Batch 1.

Preserve `STAR_DEVELOPMENT.md`, current database policies and account linking. No database changes, no live player read/write, no production deployment, no automatic launch, and no Player Space redesign in this batch. Design future links from HQ's shirt, awards and other objects to their existing canonical systems rather than duplicating records.

## Approved Round 1–3 decisions (1–50)

### Reception/building — 1–10, 23–28
- Style: ultra-modern **elite football academy**, with **medium-sized** professional reception, not a giant stadium.
- Player spawns **just inside the main entrance**, facing the desk.
- Signature feature: **huge illuminated official STAR logo behind desk** directly opposite the entrance.
- Materials: **warm timber, stone and glass**; subtly premium official STAR identity (navy, white/off-white, restrained red and metallic gold).
- Windows overlook **outdoor football pitches and academy buildings**.
- Dynamic lighting reflects **actual UK local time**, including GMT/BST handling, rather than a sped-up cycle.
- Spacious **wide rectangular lobby**, with **individual doors directly off reception** to changing rooms, trophy gallery and training pitches. A larger building is suggested by branching corridors and closed future facilities.
- Lounge with a **combination of sofas, tables and digital screens**, plus plants and other decor.
- Screens show **women's football highlights and inspirational content**, subject to rights: use only original/licensed media; where unavailable, original fictional football moments, motion graphics or approved STAR content. No unlicensed broadcast video, player likeness or misleading partnership footage.
- **Unfinished-area doors remain closed**. A short, accessible “Coming soon” interaction explains that the area is not open yet. Do not open empty/unbuilt rooms.

### Playable character — 11–16, 29–33, 44–45
- **One standard fictional teenage-style female footballer** in v1; realistic 3D visual quality as mobile performance permits. No real player likeness/photo or uploaded identification image.
- **Blonde ponytail**.
- Existing **official STAR training top design**, represented faithfully from approved repo assets and verified by visual review. **Black shorts, black socks and trainers**. Do not replace with invented alternate kit colours.
- No v1 wardrobe editor or account customisation; later integrate the established builder/card and entitlement system.
- Indoors **walking only**. Natural walk/start/stop, breathing, blinking, subtle head-turning and idle weight shifts; hand/head interaction animations at relevant moments. Animation blending must prevent foot sliding as far as practical.
- Third-person camera **a few metres behind**, showing the whole footballer. No first-person mode or sprint/jump in this batch.

### NPCs — 17–22, 34–39, 43, 46
- Main receptionist: **Mia**, fictional woman **approximately 22**, **brown hair tied back**, **branded STAR polo** and smart trousers.
- Friendly, professional, enthusiastic and encouraging. She types/checks screens/arranges things when idle, turns naturally to face a nearby player on interaction, and returns to task animation afterwards.
- Mia uses **interactive text-choice conversations** with readable captions; **no unrestricted AI chat** and no voice dialogue in v1.
- No forced welcome cinematic or auto-dialogue: player **explores freely** and approaches Mia when ready.
- Intended future real-account greeting uses the **first name in Player Space**, but v1 uses hard-coded fictional greeting name **Alex** (sample value, not a real user).
- Mia is the only fully interactive NPC initially.
- Reception feels lively: **parents, coaches/staff and fictional players** entering/leaving, walking between fixed safe waypoints and doing simple tasks. Suggested cast: Mia plus a coach, two player NPCs, a waiting parent and an administrator (six NPCs total including Mia). Background NPCs do not offer conversations in v1.
- Use game-original fictional NPCs; never copy real enrolled children, families, staff likenesses or personal information.

### First visit, audio and access — 40–42, 47–50
- First visit: direct control at spawn; optional discovery of Mia, no compulsory tutorial.
- Environmental sound: footsteps, doors, subdued NPC chatter, distant pitch sounds and optional ambient music. **Separate sound-effects/ambience and music controls**; audio starts only after suitable user interaction and respects mute/reduced-motion preferences.
- **Owner-only first prototype**. **Fictional test player**, no actual player profile, no live database access.
- First playable scope: **reception exploration and NPC conversation only**. No penalty game, inventory, scoring, editable world or accessible future rooms in this batch.

## Spatial scene blueprint (initial modelling dimensions, subject to gameplay fit)
- Main lobby interior: approximately **18m wide × 12m deep × 4.2m tall**, rectangular.
- Entrance centred on the south wall; player spawn about **2m inside** and looking north.
- Desk on north wall opposite entrance, logo wall behind it; space at desk for Mia and safe interaction point.
- West/south-west: sofas, low tables, indoor planting and viewing screens; leave accessible movement clearances.
- East: glass wall with an optimised exterior vista of football pitches and academy outbuildings.
- Three distinct closed doors on lobby perimeter with readable signs: **Changing Rooms**, **Trophy Gallery**, **Training Pitches**. Arrange positions to preserve sightlines and NPC circulation. Other future doors optional; all remain closed with “Coming soon”.
- Short visible hall recesses, glazing or corridor sightlines may imply a larger campus, but cannot be traversed beyond the current playable boundary.
- Strong visual axis from south entrance to Mia and illuminated STAR logo; reception desk never blocks player spawn or navigation.
- Continuous walkable floor, colliders on all walls, furniture, desk and closed doors; avoid invisible barriers with no visual explanation.

## Camera, interaction and character controller
- Target camera: shoulder-centred full-body third person, approximately **2.7–3.4m behind** and **1.5–1.9m high**; tune for phone screens and occlusion avoidance. Smooth tracking, bounded yaw and camera collision prevention.
- Controls: mobile left virtual joystick / right-drag camera; desktop WASD / mouse drag, E or click to interact. Clear on-screen interaction prompt, pause/settings/exit control. Walking speed initially ~**1.2–1.5 m/s** and turn smoothing adjusted in playtesting.
- Character capsule/collision shape, static room collider meshes, and simple background NPC avoidance. Prevent camera/character clipping through desk, walls and other NPCs.
- Mia interaction radius approximately **1.6–2m**; display **“Talk to Mia”** within range, accessible to tap or keyboard. When dialogue opens, suspend locomotion, orient Mia and player toward each other and render accessible semantic dialogue buttons; restore controls afterward.
- No pathfinding or quest engine dependency for v1; NPCs use small deterministic waypoint paths with simple obstacle avoidance and idle tasks. Only pursue more complex AI after actual test results.

## Sample Mia dialogue (fictional data only)
- Greeting: “Hi, Alex! Welcome to STAR HQ. It's lovely to see you. What would you like to know?”
- Choice 1 — “What is STAR HQ?” → “It's your virtual football training centre. You can explore the reception now, and more areas are coming later.”
- Choice 2 — “Where are the changing rooms?” → “You'll see the changing-room door from reception. It's not open just yet.”
- Choice 3 — “What can I explore today?” → “Have a look around, see the screens and say hello. We're building the rest of the centre!”
- Choice 4 — “Goodbye” → “See you soon, Alex!” and close conversation.
- Conversations are short, deterministic, inclusive and age-appropriate. Neither Mia nor background NPCs solicit private information. The fictional name is fixed for v1 rather than coming from a database.

## Time, lighting and screens
- Determine scene time from `Europe/London` to handle GMT/BST correctly, independent of device timezone. No accelerated simulation.
- Match daytime/evening/night in lighting and visible exterior. If accurate sunrise/sunset is later added, base it on the physical Somerset location and date; v1 may use documented time windows in London local time as an approximation, not falsely claim astronomical accuracy.
- Warm indirect interior lights remain usable at night; logo emissive/glow restrained and legible, shadows calibrated for mobile.
- Screens present original licensed/approved women’s football-inspired content in lightweight looping image/slideshow or original motion graphics. Mute by default where media includes audio; no third-party embedded social feeds in v1.

## Asset and identity requirements
- Official STAR logo: existing approved site asset, e.g. `public/images/star-colour-transparent.webp` (verify actual dimensions and suitability in scene).
- Official kit artwork references: existing `public/player-space/hero-player-star-kit.webp` and `public/player-space/builder/star-front.webp` / `star-back.webp`. These are **2D reference artwork**, not 3D models and must not be misrepresented as one.
- 3D environment and characters must be genuinely modelled/rigged GLB/glTF assets with appropriate commercial-use rights or original creation. Keep asset licenses and source provenance documented.
- First footballer and NPC rigs must share consistent scale and walk/idle animations. Mobile quality should use LOD/texture downscaling where needed; never fake screenshots as interactive gameplay.

## Accessibility, safeguarding and privacy
- Existing Player Space stays fully available outside HQ; do not gate existing learning, achievements or coaching tools behind a 3D experience.
- Visible **Exit STAR HQ** and controls help; keyboard and touch; readable text, focus handling, UI contrast, reduced-motion and separate volume controls; accessible “WebGL unavailable” fallback returning to Player Space or staff preview.
- Fictional NPCs only; do not display real user names, profiles, photographs or records in owner demo.
- Future live-data integration requires separate review and existing family/player RLS; do not infer identity from an unchecked URL parameter. Do not expose private account or health data on any screens.

## Owner acceptance criteria for first playable prototype
1. Only an authenticated, active STAR owner can enter preview; non-owners and signed-out visitors cannot start the scene.
2. One fictional teenage-style blonde-ponytail footballer wearing approved STAR top, black shorts/socks and trainers walks/turns/stops naturally.
3. Full-body trailing 3D camera and colliders work on desktop mouse+keyboard and mobile touch.
4. Real-time 3D lobby has convincing architectural scale, direct entrances, correct official logo, warm timber/stone/glass finishes, lounge, glass pitch view and branded desk.
5. Mia (22, tied-back brown hair, STAR polo, smart trousers) performs desk tasks, responds to approach and offers **clickable text dialogue**.
6. Five additional distinct background NPCs follow reasonable routines, with adaptive density/performance. They cannot be spoken to in v1.
7. All unavailable doors remain closed and show “Coming soon”; the player cannot walk through them.
8. Lighting tracks `Europe/London` date/time appropriately; sound and music can be independently muted.
9. No real player data is fetched or changed. Existing Player Space, accounts and workflows remain untouched.
10. Documented desktop and supported mobile/PWA tests; no production deployment without explicit owner approval.

## Explicitly outside Batch 1
- Real player card or trophy synchronisation (future phase, not forgotten).
- Real user name greetings, personal photos or saved avatar variants.
- 3D wardrobe customisation, match simulation, football minigames, NPC voice or freeform AI.
- Opening changing rooms, trophy gallery or pitches.
- Multiplayer, chat, live player encounters and public release.

Decisions are based on the owner's 50 confirmed answers across three design rounds. This document resolves only implementation defaults (dimensions, NPC count, input details) that were not separately dictated. Revise those defaults if practical game testing justifies it.
