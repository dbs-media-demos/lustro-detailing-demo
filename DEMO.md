# Lustro Detail Studio (Scale by Noon demo)

- Niche: Car detailing, paint correction & ceramic coating   (Scale by Noon site industry id: not on the site yet; closest is auto-repair)
- Market / city: US – Dallas, TX (English, dollars) and RS – Novi Beograd (`/sr`, dinars)
- Languages: en + sr (one homepage; Serbian is rendered on the server from `src/i18n/sr.ts`)
- Live URL: not deployed yet (owner decides after review)
- Repo: local only
- Folder: DBS Media Portfolio/Demo Websites/car-detailing
- Dev: `npm run dev -- --port 4222` (CRM launch config `demo-car-detailing`)
- Stack: Next.js 16.3.6, React 19.2.8, Tailwind v4, GSAP (helpers), Lenis
- Palette: #07080A ink · #0E1013 carbon · #171A1F steel · #9AA2AB mist · #EEF0F2 pearl · #D4FA4C volt (the one loud colour)
- Fonts: Syne 700/800 (display), Manrope (body), IBM Plex Mono (labels); all with latin-ext
- Routes: `/` (EN), `/sr` (SR), `/for/<token>` (CRM previews, EN or SR by the lead), 404, robots, sitemap, manifest, OG image

## Sections
1. **Hero**: a black car in a dark studio; a band of light keeps sweeping over the paint and through the "left the showroom." headline. Live open badge, rating.
2. **The wash** (signature): a pinned scroll scene over a dusty hood. Snow foam slides down over the dirt, a rinse sheet sweeps it off left to right, water beads roll away and a highlight crosses the clean paint while a gloss meter climbs 14 → 96 GU. Before the rinse you can wipe the dust off with the cursor (or a sideways swipe on phones).
3. **Services**: eight rows with prices and times; on desktop a photo of the service floats after the cursor.
4. **Prices**: three fixed-price packages; pick Car / SUV / Truck and every price rolls like an odometer. Add-ons.
5. **Ceramic 50/50 rain test**: rain on a dark panel split by a strip of masking tape. Bare side: flat puddles that stay. Coated side: round beads that merge and roll off. Drag the tape; move the cursor to tilt the panel.
6. **How it goes**: four steps on cards that stack as you scroll.
7. **Inside the studio**: two rows of photos drifting in opposite directions.
8. **Reviews**: Google-style rating and cards (sample reviews, labelled as samples; no staff names).
9. **FAQ**, **Book** (validated request form with the next open days, success state, sends nothing), **Visit** (address, hours, open badge; drawn map on the concept, real Google map on previews).

## Personalised previews
- Shared kit from the other demos: `src/lib/biz-core.ts`, `src/lib/biz.ts`, `src/lib/preview.ts`, `src/components/preview/*`, `src/app/for/[token]`.
- Unlike the older demos (DOM translation after load), every string goes through `t()` (`src/lib/i18n.ts`), so Serbian pages are Serbian in the server HTML. Lists with prices live per language in `src/content/offer.ts`.
- `copy(window.__untranslated())` on a Serbian page lists strings missing from `i18n/sr.ts` plus any visible text that still reads as English. Empty on `/sr` and on a Serbian preview (2026-11-02).

## Notes
- Fictional business: 4180 Halcyon Row, Dallas, TX 75207, (214) 555-0163 / Svetlosna 7, 11070 Novi Beograd, +381 11 000 0000; hello@lustrodetail.com. The concept's "Get directions" points at the neighbourhood, never a real business.
- Photos: Unsplash, re-graded by `scripts/grade.mjs` (raw downloads in `scripts/raw`, git-ignored). Sources in `src/assets/photos/SOURCES.md`.
- Reduced motion: no pinning or scrubbing; the wash panel sits half rinsed (before/after) and can still be wiped; the rain panel is one still frame.
