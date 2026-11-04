# Organisation promotion artwork

The school/club promotion toolkit has two independent designs. Both retain saved organisation names, logos, colours and organisation-specific referral URLs. STAR is the supporting football development partner. The social graphic remains a 1080-square PNG using the approved public `star-home-cinematic.webp` photograph.

## Child-focused A4 poster

`lib/organisationPoster.ts` produces an exact 210 × 297 mm SVG master with 10 mm safe margins on all sides. The design reuses Player Space's existing `hero-player-star-kit.webp` illustration, navy/red/gold palette, paper labels, football/star line icons, dotted texture and cut-paper treatment. Child-facing copy leads with “Your game. Your way.”; a separate parent/carer area offers the free assessment. No player records or private photographs are used. All images are embedded as PNG data URLs; logo artwork is preserved.

The download is a single-page PDF with an exact A4 MediaBox. The browser renders the master at 2480 × 3508 (approximately 300 dpi), embeds a quality-100 JPEG using the small local `organisationPosterPdf` writer, and downloads it without contacting an external conversion service. No additional dependency is required. The printable canvas is white with all important content within the safe margins. Print portrait at actual size (100%).

The CTA is “Book a free assessment”. Supporting text explains that scanning sends a request through the verified parent referral flow and STAR confirms time and venue. The free 30-minute assessment matches the existing first-session offer; ongoing coaching is separate. The QR retains organisation attribution. No booking is automatically created.

## Typography and validation

Headlines use outlined Barlow Condensed 900 glyphs to avoid installed-font or SVG-image font-loading differences. `lib/organisationArtworkFont.json` derives from `public/fonts/barlow-condensed-900-latin.woff2`, copyright 2017 The Barlow Project Authors, licensed under `public/fonts/barlow-condensed-OFL.txt`. Regenerate with `python scripts/export-organisation-artwork-font.py` (fonttools and brotli). Body and organisation name text use Arial/sans-serif with bounded wrapping for long/unbroken names. Export-only modules are loaded on demand.

Validation: TypeScript and production build; SVG and final PDF page rendered and visually inspected; PDF parser confirms one A4 page; QR decoded from the PDF render in greyscale at full and screen-size A4 resolution; organisation header variants with a logo and long names inspected. No browser/usability tests or database changes.
