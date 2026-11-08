# STAR HQ — Initial implementation results and known limitations

Branch: \`feature/star-hq-reception-prototype\`
Date: 8 November 2026
Release status: **NOT deployed; not yet signed off by owner.**

## Implemented in actual code
- Separate private owner-only preview route \`/staff/star-hq-preview\` (not linked from Player Space); active-owner authorization is checked on the server using a verified Supabase JWT and \`staff_members\`.
- All gameplay data is a synthetic \`Alex\` fixture. No real player data, photos, trophy records or coaching records are fetched.
- Native **WebGL2 3D renderer** with actual geometry, perspective camera, depth testing and lighting. No static image pretending to be a game.
- Architectural reception shell with timber wall cladding, stone floor, official STAR logo image, reception counter, screens showing original football-inspired text, sofas, tables, plants, window frames, exterior 3D pitches/buildings and approximated UK local-time illumination.
- One manually modelled *procedural* teenage-style footballer, blonde ponytail, navy STAR-logo top, black shorts, black socks and black trainers; third-person full-body camera, smooth heading changes, walking and idle poses.
- Desktop keyboard/mouse camera controls; mobile joystick and camera swipe.
- Solid environment/door/lounge/desk collision boxes and collision-constrained movement.
- Mia, a fictional young adult receptionist (~22), brown hair in ponytail, navy STAR polo and smart dark trousers, script-based choices and desk-task hand gestures.
- Five fictional ambient characters with deterministic paths and idle phases.
- Closed changing rooms, trophy gallery and pitches, with optional “Coming soon” interaction.
- Mute switches for basic generated synthetic ambient music tones and sound effects; no media autoplay.
- WebGL-unavailable state and return to Staff Portal.

## Deliberately NOT implemented yet
- Photoreal rigged GLB characters, facial blend shapes or motion-captured animation. Current models are real 3D but **simple procedural meshes**, not representative of planned final graphical fidelity.
- Exact woven official STAR shirt texture: current top shows STAR's official logo on an approximate navy garment; final asset must be matched visually to approved training top.
- Broadcast women's football highlights: current screens show **original, copyright-safe inspirational text**, not licensed broadcast footage.
- Dynamic astronomical sunrise/sunset; current lighting samples Europe/London time using documented approximate time bands.
- Voice acting or full animation-captured dialogue; Mia currently talks via accessible HTML text choices with subtle 3D hand motions.
- Complex NPC behavioral AI, organic crowd navigation or fully articulated walking/IK. NPCs currently follow deterministic waypoint routines, and animated limb transforms are approximate.
- Exact 3D character/scene presentation checks on Android/iPhone hardware; runtime screenshots and device playtesting not yet performed.
- Public/player-facing access, live profile data, trophies/wardrobe synchronisation, room transitions, minigames or any real player writes.

## Deliberate technology tradeoff
The original roadmap proposed React Three Fiber (R3F) and rigged GLB assets. The first code pass uses **browser-native WebGL2** instead. This avoids introducing large new dependencies or modifying the existing site's \`package-lock.json\` before we can prove the owner-only prototype builds safely. It is real 3D rendering, but is a **functional mechanics/space proof**, not the proposed high-fidelity production engine. Replace or extend it with properly licensed rigged character/environment assets after an owner review of this proof and device testing.

## Verification
- Dedicated workflow \`.github/workflows/star-hq-prototype.yml\` runs:
  1. \`npm ci\`
  2. \`node --test scripts/test-star-hq-prototype.cjs\`
  3. \`npx tsc --noEmit\`
  4. \`npm run build\` (including existing player/staff regression tests)
- Initial workflow passed on commit \`8014549fee6748dcd785d7fbedd3297ae648d233\`: https://github.com/StarDevCentre/star-development-centre/actions/runs/42449213773
- Subsequent polishing commits must pass their own latest workflow before sign-off.
- No 3D browser screenshot, WebGL device FPS measurement, mobile usability inspection or Vercel deployment has been completed, so **do not call the visuals/device compatibility verified**.

## Owner review instructions (after an explicitly approved preview deployment)
1. Sign in to your STAR Staff Portal as an active owner.
2. Visit the non-production preview deployment's \`/staff/star-hq-preview\`.
3. Test movement, camera, Mia, closed doors and the Exit button on desktop and phone.
4. Report visual quality, model realism, animation and mobile responsiveness.
5. Do not merge to \`main\` or add Player Space entry until reviewed and approved.

## Security
Owner gate verifies the current Supabase session token via \`auth.getUser(token)\` on the server, then selects **only** the active matching owner in \`staff_members\` using the user's JWT and existing RLS. It does not grant new permissions or use a service role. A separate browser check protects the rendering UI; credentials never go into the scene. The route is noindexed and contains only generic fictional content. It remains separated from production until explicitly approved.
