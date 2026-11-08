# STAR HQ v2 — Rigged Asset Sources and Rebuild Status

Status: **Owner-only preview in development. No production release.**
Date: 8 November 2026
Parent: `feature/star-hq-reception-prototype`
Branch: `feature/star-hq-v2-visual-rebuild`

## Licensing and verified source

The v2 human cast uses the [CodeLove 3D Models](https://models.codelove.in/) distribution of **Microsoft Rocketbox** textured 3D humans. The actual GLB asset metadata inspected on 8 November 2026 says **Copyright (c) 2020 Microsoft. MIT License.** The models and animations are rigged: the adults contain ~80 bones and each has ~7,000–9,000 triangles. The humanoid motion library includes idle, look-around, talk and walk.

Catalog/source pages:
- https://models.codelove.in/llms/rigged-adults.md
- https://models.codelove.in/llms/rigged-children.md
- https://models.codelove.in/llms/rigged-professions.md
- https://models.codelove.in/license/

Assets loaded via the allowlisted same-origin proxy `app/api/star-hq/v2-assets/[name]/route.ts`:
- Footballer: `female-adult-03.glb` (scaled to a fictional ~1.63m teenage-style model)
- Mia: `business-female-01.glb` (scaled to ~1.69m; realistic young-adult professional)
- Coach: `female-adult-05.glb`
- Academy players: `female-child-01.glb`, `female-child-02.glb`
- Parent: `male-adult-02.glb`
- Administrator: `business-male-01.glb`
- Motion clips: `f_idle_neutral_01`, `f_walk_neutral_01`, `f_idle_look_around_01`, `f_gestic_talk_neutral_01`, `m_idle_neutral_01`, `m_walk_neutral_01`.

The proxy sends model requests from STAR's server rather than connecting the visitor's browser directly to a third-party host. It accepts only hard-coded names and checks the GLB magic and file size; it is **not** a generic external URL proxy.

### MIT Licence acknowledgement
Copyright (c) 2020 Microsoft.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Technical visual upgrade

V2 is a different renderer from V1:
- Replaces the hand-assembled sphere/cylinder `StarHQRenderer.ts` runtime with `components/star-hq-v2/StarHQRenderer.js`, using pinned **three@0.187.0**.
- Loads actual skinned human meshes and the intended compatible motion clips through GLTFLoader + MeshoptDecoder.
- Maintains the working V1 controller, camera follow, collision and dialogue logic.
- Rebuilds the reception architecture in real 3D using bevelled geometry, a brushed-stone procedural texture, timber grain, glass glazing, more natural furniture scale, STAR-branded back wall, more balanced lighting and an outdoor training pitch vista.
- Renders the authentic STAR logo on a camera-facing 3D panel, avoiding the V1 mirrored-UV error.
- Cleans up the mobile heads-up display. Sound/music/restart settings live behind one Settings control rather than covering the room.

## Important remaining art limitations / review gates

1. The 3D humans are **licensed mid-poly rigged bases**, not commissioned photographic digital humans. They should look substantially more human than v1, but their actual fidelity **must be visually reviewed on Android** before approving. No claims of photoreal appearance without screenshots and user review.
2. The base models may wear the wrong outfit. V2 includes a STAR badge and configurable palette where feasible, but exact official STAR training top, black shorts/socks/trainers, and Mia's polo are still dependent on a commissioned/customised rigged outfit or verified UV texture edit. **Do not call the outfits exact yet.**
3. Facial expressions and blonde ponytail are not visually signed off; the source model's hair may need further reshaping/retexturing.
4. The original women's football screen artwork is generic text/motion-inspired signage only. Actual women's football footage requires licensed media.
5. Walk animations are supplied by a compatible external skeleton library, but final clip retargeting, stride realism, performance, and mobile controls require device testing.
6. Main Player Space is not changed. No real player data, photographs, credentials, achievements or account-based greetings flow into the preview.
7. The provisional use of the proxy depends on the model host's continued availability; before production, either verify reliable hosting/availability or self-host immutable licensed assets.
8. Time-based interior lighting uses `Europe/London` with approximate daylight windows; no precise astronomical sunrise calculation yet.

**Do not merge to main or deploy to production until the owner explicitly approves the realistic character and interior design on a working preview.**
