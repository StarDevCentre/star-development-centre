# Football History Ultimate Challenges

Added 11 November 2026. Catalogue: `lib/content/football-history-ultimates.json`.

- UC01 / database card 42: Denmark 1971; 879-word story in seven sections.
- UC02 / database card 43: Arsenal 2007; 864-word story in seven sections.
- Seven questions per card, four options each, seven correct required. Server answer positions remain in the private SQL catalogue.
- Existing 20-minute failed-attempt cooldown, linked player/guardian checks, immutable earned awards and the age 11+ edition boundary remain enforced.
- Existing five-question editions still require 5/5 and permit three options.
- Separate Ultimate shelf; special shelf now uses catalogue membership rather than a ten-card slice so SE11 is included.
- New structured story headings and timelines; all historical sources are linked within each card.

## Validation

Applied `denmark_1971_and_arsenal_2007_ultimate_history_cards` migration. Expanded rollback-only `supabase/tests/player_football_history_rls.sql` passed: answer-count/range/null validation, 6/7 cooldown, retry expiry, 7/7 award, replay, age and cross-family isolation, all previous five-question and special editions, birthday keepsakes. Synthetic fixtures fully roll back. No usability tests.

## Artwork

Front/back PNGs generated using built-in image generation, with the official supplied STAR logo as reference. Optimised WebP exports (Denmark 800×1200; revised Arsenal 1024×1536) in `public/player-space/history/specials`.

Denmark: engraved platinum, Danish red/white and Mexican sunbursts, imagined historical player with the 1970 Azteca panorama as architectural reference. Arsenal (revised): modern scarlet, midnight navy and polished chrome, photorealistic reconstructed adult players celebrating in the yellow/dark 2007 FA Cup-final kit, four angular achievement tiles. Historical illustrations are not archival photographs or claimed portraits.

Arsenal front prompt: portrait premium collectible, ULTIMATE CHALLENGE UC02, ARSENAL 2007 / THE QUADRUPLE, actual STAR mark, red/white women footballers, North London architecture, four competition medallions, 7 QUESTIONS / 7/7 TO EARN. Back prompt: matching ruby/silver, perfect league record (22 wins, 119 scored, ten conceded, 66 points), Scott’s Swedish goal and 1–0 European aggregate, four major titles and Smith/Ludlow’s FA Cup braces.

Arsenal source caution: the club’s 2006–07 annual report misattributes the FA Cup final’s last two goals. The catalogue follows UEFA’s contemporary match report: Kelly Smith and Jayne Ludlow scored two each. The FA’s league table supplies the final league numbers. Dates of trophy completion and completion of the league programme are distinguished.

## Arsenal artwork revision · 11 November 2026

Owner requested a modern visual style and improved image quality appropriate to 2007. Both faces are replaced through the versioned `arsenal-2007-uc02-modern-v2` slug, avoiding reuse of cached original art. Retain UC02/card 43, the story, all question positions and earned progress. No database change.

Built-in image generation: front prompt requests sharp photorealistic digital reconstruction, natural adult players celebrating in period red/white clothing, polished scarlet/navy/chrome and angular foil framing, official STAR mark, bold condensed sans-serif title and four competition tiles. Reverse uses matching modern glasslike panels, large 22/22 statistics and the original validated historical copy. No antique filigree, engraving, parchment, serif lettering or claimed archival photography. Exports preserve native generated resolution in high-quality WebP. Original art remains available for rollback.

Validation: catalogue comparison confirms only Arsenal artwork metadata changed; Denmark, both stories and all questions are identical. Both generated faces visually inspected for typography, identity and factual copy.

## Arsenal kit correction · 11 November 2026

Owner requires the actual kit worn in 2007. The illustrated celebration is now tied specifically to the FA Cup final on 7 May 2007: golden yellow Nike shirts, dark anthracite curved shoulder panels and V-neck trim, centrally positioned Arsenal crest, black Fly Emirates sponsor, final embroidery, dark shorts. Reference photograph inspected at full resolution from The FA’s official final archive, with an Arsenal Pictures match photo confirming the shorts and side panels.

Sources: https://www.thefa.com/competitions/the-womens-fa-cup/womens-fa-cup-finals ; reference image https://thefa.shorthandstories.com/a-list-of-all-womens-fa-cup-final-results/assets/U1bEthTcph/2560-arsenal-2007-2560x1440.jpg ; Arsenal Pictures https://www.arsenalpics.com/arsenal-women/arsenal-ladies-v-charlton-fa-cup-final-2006-07/kelly-smith-celebrates-scoring-arsenals-1st-goal-455322.html . Reference photos are used for kit details; the card remains labelled a historical reconstruction.

Built-in image edit: preserve modern v2 card design, typography, six imagined players, poses and lighting; replace only their shirts and shorts to match the authentic 2007 final references, including Nike/crest/sponsor placement and the dark curved shoulder panels. Front exported at native resolution. Versioned slug `arsenal-2007-uc02-kit-v3` refreshes the artwork; back is byte-identical to modern v2. Story, quiz and stored awards are unchanged. No database changes or usability tests.

Final finishing pass adds the red E.ON/FA Cup sleeve patches on exposed right sleeves. Both kit references and the final generated face were inspected visually before export.
