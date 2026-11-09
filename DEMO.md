# Lustro Detail Studio (Scale by Noon demo)

- Niche: Car detailing, paint correction & ceramic coating   (Scale by Noon site industry id: not on the site yet; closest is auto-repair)
- Market / city: US – Dallas, TX (English, dollars) and RS – Novi Beograd (`/sr`, dinars)
- Languages: en + sr (one homepage; Serbian is rendered on the server from `src/i18n/sr.ts`)
- Live URL: not deployed yet (owner decides after review)
- Repo: local only
- Folder: DBS Media Portfolio/Demo Websites/car-detailing
- Dev: `npm run dev -- --port 4222` (CRM launch config `demo-car-detailing`)
- Stack: Next.js 16.3.6, React 19.2.8, Tailwind v4, GSAP (helpers), Lenis, three.js 0.187 (desktop hero only)
- Palette: #07080A ink · #0E1013 carbon · #171A1F steel · #9AA2AB mist · #EEF0F2 pearl · #D4FA4C volt (the one loud colour)
- Fonts: Syne 700/800 (display), Manrope (body), both one local variable subset file with Latin + Latin Extended-A (`src/assets/fonts`, cut from the Google Fonts sources with fonttools); IBM Plex Mono (labels, above phone width only)
- Routes: `/` (EN), `/sr` (SR), `/for/<token>` (CRM previews, EN or SR by the lead), 404, robots, sitemap, manifest, OG image

## Sections
1. **Hero** (3D, desktop): a real-time gloss-black car in a dark detail studio (three.js). On arrival an inspection light arch passes over the car once and the lamps blink; scrolling runs the arch from the front wheels to past the tail while the camera glides down the flank, and the cursor leans the camera so the reflections slide over the paint. Live open badge, rating, Book + the phone number.
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

## 3D hero (owner's 3D pass, 9 Nov 2026)
- Why this idea: a detailer sells reflections. Gloss-black paint under studio light is what every detailing studio photographs, and the one thing the lead's customers judge. The light arch is the inspection tunnel detailers use to find swirls, so the moving element belongs to the trade, not a generic sweep.
- Scene: `src/components/fx/car3d/StudioScene.ts`, plain three.js. Room baked once into the reflections (big overhead softbox, two long side strips, low kickers); the arch is analytic (closest point on each segment to the reflected ray, widened by roughness) and injected into the clearcoat and glass, so it moves without re-baking anything. Soft contact shadows baked once (depth from below, two blur widths) on a faint light pool. Panel edges fade the arch where the normal turns inside a pixel (otherwise every panel gets a white outline). Renders only when something changes, only while the hero is on screen and the tab visible; pixel count capped.
- Loading: `src/lib/three-gate.ts` (same as landscaping). Only after `load` + idle, only for `(min-width: 1024px) and (hover: hover) and (pointer: fine)`, no reduced motion, no Save-Data, WebGL2. Then `import()` of the scene and `fetch` of the model run side by side. Nothing else imports three.js.
- Smooth start (owner's pass, 9 Nov 2026): the still stays until the scene is ready. The setup runs in small steps with idle breaks; the room and shadow bakes have their shaders compiled in the background first (`precompile`, KHR_parallel_shader_compile), meshopt decodes in workers, then `compileAsync` on the whole scene, textures uploaded a few at a time and one frame drawn while the canvas is still invisible, and only then the fade. On this PC (RTX 5070) the canvas is in 0.3-0.9 s after `load` with no long tasks (one of about 140 ms on Chrome's very first WebGL context in a session, the GPU process starting up).
- Weak machines keep the still, for the whole visit (`sessionStorage` `lustro:no3d`, set by `mark3DOff()` in three-gate): a short CPU probe in the gate before three.js is fetched (median of five runs over 2.5 ms; 0.9 ms here, 3.5 ms at Chrome's 4x slowdown), `failIfMajorPerformanceCaveat` plus a software-renderer check (SwiftShader, llvmpipe, Basic Render), and a 2 s watch from the first frame: under 45 fps, any frame over 100 ms, or over 3 ms of the scene's own work per frame (1 ms here, 8 ms at 4x) fades the canvas back to the still and frees the renderer. Marks `3d:first-frame`, `3d:watch-ok` / `3d:slow` (with fps, cost, worst frame) show what happened. Pixel ratio capped at 1.5. Phones, tablets and reduced motion keep the still (zero bytes of three.js; measured on the production build).
- Still: `src/assets/photos/studio-car.jpg` (desktop) and `studio-car-phone.jpg` are rendered from the same scene by `scripts/car-stills.mjs`. The canvas crops its frame exactly like `object-fit: cover` (`DESKTOP_FRAME`; below a 3:2 hero both move the crop right, see `.hero-still` in globals.css), so the swap is invisible. Re-run the script after touching a pose, a frame or the lighting.
- Model: "Car Concept", Khronos glTF Sample Assets, CC BY 4.0 (after "Free Concept Car 004" by Unity Fan, CC0): a made-up car, no carmaker's design or badge. Khronos/3D Commerce logos and the plate removed (the licence excludes them). `scripts/car-model.mjs` strips, simplifies (body panels untouched) and meshopt-compresses it: 11.8 MB → `public/models/lustro-car.glb` 1.1 MB, about 0.77 MB gzipped, cached for a year (`?v=1` in Hero.tsx: bump it when the file changes). The footer carries the CC BY credit line.
- No second 3D section: the ceramic rain test is already the hands-on scene for coating and the wash is the pinned one; a second WebGL scene would add weight, not an idea.
- The hero heading, text and buttons are never animated in (only the stats row fades). Short laptop screens (≤ 820 px tall, `short:` variant) get tighter hero spacing so the concept pill never covers the rating.

## Phones (owner's decision, 7 Nov 2026)
Phone mode = below 768 px or any touch screen: Tailwind's `phone:` variant (`globals.css`) and `isPhone()` (`lib/motion.ts`) are the same test. At 1024 px and up nothing changed.
- First screen: a detailer at work (`polish-black.jpg`), "Car detailing in {area}." (`Auto detailing, {area}.`), stars + count + Google, a Call button with the number on it, and prices peeking in below. The CRM tagline moves to the line under the headline. No intro animation. After `load`, the photo crossfades once (1.4 s) to the still of the desktop's 3D car (`studio-car-phone.jpg`, about 14 KB); skipped if the page loaded late or the still lands after 3.6 s, and with reduced motion. The photo stays the LCP.
- Bottom bar: number + Book, opaque. Header opaque once scrolled. The concept pill sits on the hero photo and scrolls away with it.
- Order on phones (`phone:order-*`, desktop's stays): hero, prices, reviews, how it goes, the wash, services, ceramic, studio, FAQ, book, visit. Section numbers ("03 —") are hidden there (`SectionLabel`).
- Nothing pinned: the wash scene is `WashStacked` (same words, no canvas); process cards, price cards and the studio photos are swipe rows.
- What moves: tap feedback, one fade-and-rise per section (`<Reveal phone>`), the swipe rows, the price picker and the rain tape (the rain only falls for a moment on arrival and while the tape moves), and the one niche touch: dust rinses off the wash photo as the gloss meter climbs 14 to 96 (`useArrive(..., onPhones)`, transform only). The other touches show their finished state.
- Lenis and GSAP load on desktop only (`SmoothScroll`).
- Loading: every block below the hero sits in `components/ui/NearScreen.tsx`. The browser skips its style and layout (`content-visibility`, `.near` in `globals.css`) and React leaves its server HTML alone until it's near the screen. Use `<Activity>` + `lazy` there, not `<Suspense>` + `use()`: Suspense moves big blocks to the end of the HTML for a script to swap back, and `use()` can stall hydration for good. Each `height` is that block's content height at 375 px without its padding, so update it when a block changes a lot. Until the fonts land, phones use plain Arial instead of next/font's `local(Arial)` fallback, which reads the font file again for every text size.

## Personalised previews
- Shared kit from the other demos: `src/lib/biz-core.ts`, `src/lib/biz.ts`, `src/lib/preview.ts`, `src/components/preview/*`, `src/app/for/[token]`.
- Unlike the older demos (DOM translation after load), every string goes through `t()` (`src/lib/i18n.ts`), so Serbian pages are Serbian in the server HTML. Lists with prices live per language in `src/content/offer.ts`.
- `copy(window.__untranslated())` on a Serbian page lists strings missing from `i18n/sr.ts` plus any visible text that still reads as English. Empty on `/sr` and on a Serbian preview (2026-11-02).

## Notes
- Fictional business: 4180 Halcyon Row, Dallas, TX 75207, (214) 555-0163 / Svetlosna 7, 11070 Novi Beograd, +381 11 000 0000; hello@lustrodetail.com. The concept's "Get directions" points at the neighbourhood, never a real business.
- Photos: Unsplash, re-graded by `scripts/grade.mjs` (raw downloads in `scripts/raw`, git-ignored). Sources in `src/assets/photos/SOURCES.md`.
- Reduced motion: no pinning or scrubbing; the wash panel sits half rinsed (before/after) and can still be wiped; the rain panel is one still frame.
