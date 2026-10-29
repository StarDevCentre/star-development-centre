# Learning hairstyle assets

Six transparent raster variants were made with the built-in image-generation tool from the existing `/player-space/hero-player-star-kit.webp` character. Original outputs were retained; project WebP assets were resized to 900×1350 and encoded at quality 90. Actual character, kit, pose and sticker references were visually checked together.

Shared prompt: "Use case: identity-preserve. Project character asset edit. Edit this exact illustrated STAR footballer to give her [STYLE]. Keep hair blonde/golden. CRITICAL: preserve the same face, pose, body proportions, exact shirt and all lettering/logo, football, hands, crown and star stickers, illustration style and alignment. Only change hairstyle. Maintain the original 2:3 portrait canvas framing and transparent background. No new text. This must be a production-ready matching hairstyle variant, not a collage. Preserve the exact locations of the head/face/body so existing skin and ball colour masks still align."

| Project asset | STYLE |
|---|---|
| `public/player-space/hero-high-bun.webp` | a high rounded bun with a few loose strands; remove the long ponytail entirely |
| `public/player-space/hero-double-braids.webp` | two distinct long braids falling behind the shoulders; remove the original ponytail entirely |
| `public/player-space/hero-half-up.webp` | half-up loose waves, the upper section tied back and lower hair falling naturally behind the shoulders |
| `public/player-space/hero-curly-ponytail.webp` | a high ponytail of clearly defined bouncy curls, with realistic illustrated curl texture instead of long waves |
| `public/player-space/hero-twisted-bun.webp` | clearly visible rope twists gathered into a compact bun; remove the original long ponytail entirely |
| `public/player-space/hero-short-crop.webp` | a short textured crop, neat sides with a textured top; remove all long hair entirely |

The existing canvas tint and football composition code still applies. SVG badges, profile frames and background patterns are code-native artwork, not generated raster assets.
