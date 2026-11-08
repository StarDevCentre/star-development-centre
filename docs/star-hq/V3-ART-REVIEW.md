# STAR HQ v3 — Academy Art Recovery and Owner Review

Date: 8 November 2026
Branch: `feature/star-hq-v3-academy-art`
Parent: `feature/star-hq-v2-visual-rebuild`
Status: **owner-only preview for visual review, not production approved**.

## Why v3 exists
Android screenshots of v2 showed: a brunette character wearing a purple tunic and trousers rather than STAR training kit, Mia appearing as a tiny head behind an oversized desk, mismatched casual/business NPCs, disproportionately large STAR wall art, and under-furnished academy spaces. V3 addresses those specific visual failures without replacing the movement, camera, conversations, sound, access gate or existing Player Space.

## Actual v3 modifications
1. Replaces the generic casual female player with a commercially permitted **Rocketbox female athlete** model. Mia and coach use a separate female athlete base, the administrator a male athlete, and the two fictional young academy players use athlete rigs at appropriate game scale. Parent remains a non-coaching adult.
2. Clones skeletal rigs correctly using Three.js SkeletonUtils so reused model families animate independently.
3. Builds STAR-inspired **skinned outfit overlays** by selecting real vertices from the licensed rig: navy football top, dark shorts, skin-toned knees/thighs and dark socks. Unlike primitive body shapes, overlays inherit the character's bone weights and walk animation. These are **working customisable interim garments**, not an exact replica of the official training top's bespoke sewing/print.
4. Recolours the original player's hair alpha texture to a blonde shade, preserving alpha and hair detail when the browser permits readback, and adds a small head-bone-attached ponytail.
5. Repositions Mia beside the reception welcome console, in clear view of approaching players, and lowers/refines the adjoining desk. Updates actual collision boxes and interaction target accordingly; she remains the sole interactive NPC.
6. Reduces the logo artwork within a restrained premium wall frame. Replaces the sparse scene with wayfinding, honour displays (fictional), acoustic slats, seating, lighting accents and lounge furniture. No licensed footage is claimed.
7. Retains an optional owner-only synthetic Alex preview; no actual player data read/write, no public launch or production changes.

## Source licences
The model proxy remains allowlisted at `/api/star-hq/v2-assets/[name]` and serves Microsoft Rocketbox 2020 MIT-licensed model files, with the licence text retained in `docs/star-hq/V2-ASSET-PROVENANCE.md`. New original sources:
- Player and academy player A: https://models.codelove.in/models/sports-female-01/
- Mia, coach and academy player B: https://models.codelove.in/models/sports-female-02/
- Administrator: https://models.codelove.in/models/sports-male-01/
- Parent and compatible animation clips: unchanged from v2.

Do not infer that the models depict real STAR members or girls registered on the site.

## Tests and acceptance gates
- Dedicated GitHub Actions branch workflow: `npm ci`, old v1 and v2 checks, new `scripts/test-star-hq-v3.cjs`, `npx tsc --noEmit`, full `npm run build`.
- HTTP smoke test now downloads and parses all seven rigged characters and the key female animations from the production-mode Next.js preview server, verifies GLB format and MIT metadata and rejects unknown asset names.
- Confirm on **Android device**: no purple tunic, recognisably sports-clothed blonde player with ponytail, Mia visible with natural dimensions, readable correct STAR logo (not cropped or mirrored), full interaction/closed doors/camera/joystick, no NPC sinking or clipping, tolerable performance and stable loading.
- This iteration may still need significant further graphical refinement: exact official training top and sewn garment texture mapping, proper football footwear, natural ponytail physics, facial detail, reception architectural accuracy and NPC idle gestures are **not certified** until visual review. This branch is not ready for a player launch.

## Production controls
- Pull request stays draft until owner review.
- No merge into `main`, no production deployment and no modifications to existing Player Space modules, login linking, player accounts or achievements.
