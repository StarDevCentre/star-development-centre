# Prestige P02–P05

Completes the five-card Prestige collection. IDs 57–60 follow P01 (56) sequentially. P01 keeps its original frozen prerequisites 1–55. Awards remain permanent. Each new story has ten sections, approximately 1,300 words, ten four-option questions, a 10/10 pass requirement and a 20-minute unsuccessful-attempt cooldown. Server answer keys remain private.

| Card | Story | Words | Unlock |
|---|---|---:|---|
| P02 | Football Against the Odds | 1319 | Earn P01 |
| P03 | The Right to Play | 1305 | Earn P02 |
| P04 | Beyond the Trophy | 1294 | Earn P03 |
| P05 | Her Game, Her Future | 1332 | Earn P04 |

Historical source links are included in each story. P05 distinguishes imagined coaching situations from historical evidence. Artwork is explicitly labelled conceptual: sapphire/copper repaired globe (P02), emerald/platinum open gate (P03), ruby/gold trophy and community pitch (P04), teal/amethyst book opening into a pitch (P05). No generated documentary people or invented historical kits.

Eight 1024×1536 faces generated using the built-in image tool with the STAR logo and existing P01 as references. Prompt set: one portrait front and one reverse per theme, ornate engraved metallic frame, jewel corners, exact title/number/motto, symbolic central scene, four thematic lines on reverse. Optimised WebP assets are in `public/player-space/history/specials/prestige-p02` through `prestige-p05`, with `-front.webp` and `-back.webp` suffixes.

The review companion at `public/player-space/history/prestige-final-stories.md` contains the four full stories, all forty questions and sources, without answer keys. It is an editorial review copy, not the award route. The in-app older-player catalogue uses the sequential locks; owner preview can inspect all stories without granting an award. Younger players continue to receive their separate Sparks edition.

Validation: catalogue tests cover five cards, assets, question counts, word counts, sequential locks, permanent awards and age separation. Transactional database tests exercise skip attempts, incomplete submissions, 9/10 failures, cooldown enforcement, successful awards and replay protection for each card, alongside the existing access-control suite. Synthetic records roll back.
