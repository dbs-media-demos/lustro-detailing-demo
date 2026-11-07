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
- Fonts: Syne 700/800 (display), Manrope (body), both one local variable subset file with Latin + Latin Extended-A (`src/assets/fonts`, cut from the Google Fonts sources with fonttools); IBM Plex Mono (labels, above phone width only)
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

## One detailing touch per section (round 2)
- Ticker: the separators are water beads.
- Services: each name arrives hazy and a microfibre pass (bright edge) wipes it to gloss.
- Prices: an inspection light over the cards (follows the mouse, sits still on phones); swirl marks show as broken rings around it: plenty on Refresh, faint on Signature, none on Correct & Coat.
- How it goes: every step card carries a paint depth gauge that reads its microns as it arrives (118 → 118 → 115 → 116 µm).
- Inside the studio: the photos arrive dull and come up rich one by one, like conditioned leather.
- Reviews: a small spinning polisher pad buffs the five rating stars to a shine.
- FAQ: answers open behind a drying blade, a bright line pulling across like water off glass.
- Book: sending the request fires a foam-cannon burst that rinses away to the confirmation.
- Visit: a little drive-through: a dusty car rolls into the studio bay and comes out gleaming.
- All of them use `components/ui/useArrive.ts` (before-state only below the fold, after hydration) or plain CSS; with reduced motion everything shows its finished state.

## Phones (owner's decision, 7 Nov 2026)
Phone mode = below 768 px or any touch screen: Tailwind's `phone:` variant (`globals.css`) and `isPhone()` (`lib/motion.ts`) are the same test. At 1024 px and up nothing changed.
- First screen: a detailer at work (`polish-black.jpg`), "Car detailing in {area}." (`Auto detailing, {area}.`), stars + count + Google, a Call button with the number on it, and prices peeking in below. The CRM tagline moves to the line under the headline. No intro animation.
- Bottom bar: number + Book, opaque. Header opaque once scrolled. The concept pill sits on the hero photo and scrolls away with it.
- Order on phones (`phone:order-*`, desktop's stays): hero, prices, reviews, how it goes, the wash, services, ceramic, studio, FAQ, book, visit. Section numbers ("03 —") are hidden there (`SectionLabel`).
- Nothing pinned: the wash scene is `WashStacked` (same words, no canvas); process cards, price cards and the studio photos are swipe rows.
- What moves: tap feedback, one fade-and-rise per section (`<Reveal phone>`), the swipe rows, the price picker and the rain tape (the rain only falls for a moment on arrival and while the tape moves), and the one niche touch: dust rinses off the wash photo as the gloss meter climbs 14 to 96 (`useArrive(..., onPhones)`, transform only). The other touches show their finished state.
- Lenis and GSAP load on desktop only (`SmoothScroll`).

## Personalised previews
- Shared kit from the other demos: `src/lib/biz-core.ts`, `src/lib/biz.ts`, `src/lib/preview.ts`, `src/components/preview/*`, `src/app/for/[token]`.
- Unlike the older demos (DOM translation after load), every string goes through `t()` (`src/lib/i18n.ts`), so Serbian pages are Serbian in the server HTML. Lists with prices live per language in `src/content/offer.ts`.
- `copy(window.__untranslated())` on a Serbian page lists strings missing from `i18n/sr.ts` plus any visible text that still reads as English. Empty on `/sr` and on a Serbian preview (2026-11-02).

## Notes
- Fictional business: 4180 Halcyon Row, Dallas, TX 75207, (214) 555-0163 / Svetlosna 7, 11070 Novi Beograd, +381 11 000 0000; hello@lustrodetail.com. The concept's "Get directions" points at the neighbourhood, never a real business.
- Photos: Unsplash, re-graded by `scripts/grade.mjs` (raw downloads in `scripts/raw`, git-ignored). Sources in `src/assets/photos/SOURCES.md`.
- Reduced motion: no pinning or scrubbing; the wash panel sits half rinsed (before/after) and can still be wiped; the rain panel is one still frame.
