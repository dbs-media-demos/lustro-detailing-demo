"use client";

import { useBiz } from "@/components/preview/BizContext";
import { PreviewMap, directionsUrl } from "@/components/preview/PreviewMap";
import { OpenBadge } from "@/components/ui/OpenBadge";
import { Reveal } from "@/components/ui/Reveal";
import { DAY_NAMES, dayRange, telOf, weekFromMonday } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";

/** Address, live open badge, the week's hours and a map: the real one on previews, a drawn one on the concept. */
export function Visit() {
  const biz = useBiz();
  const t = useT();
  // The concept studio is fictional: its directions point at the neighbourhood, never a real business
  const directions = biz.preview ? directionsUrl(biz) : `https://www.google.com/maps/search/${encodeURIComponent(biz.lang === "sr" ? "Novi Beograd" : "Design District, Dallas, TX")}`;
  return (
    <section id="visit" aria-labelledby="visit-title" className="bg-ink px-[var(--gutter)] py-28 md:py-40">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="t-label text-volt">{t("09 — Visit")}</p>
          <h2 id="visit-title" className="t-display t-lg mt-5">
            {t("Drop it off.")} <span className="text-mist">{t("Pick it up gleaming.")}</span>
          </h2>
          {biz.address.full && (
            <address className="mt-8 text-xl not-italic leading-snug" data-no-translate>
              {biz.address.full}
            </address>
          )}
          <OpenBadge className="mt-6 text-sm" />
          {biz.hours && (
            <dl className="mt-6 max-w-sm space-y-2 text-sm">
              {weekFromMonday(biz.hours).map((h) => (
                <div key={h.day} className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-mist">{DAY_NAMES[biz.lang][h.day]}</dt>
                  <dd className="tabular-nums">{dayRange(h, biz.lang)}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={directions} className="btn btn-ghost" target="_blank" rel="noreferrer">
              {t("Get directions")}
            </a>
            {biz.phone && (
              <a href={telOf(biz)} className="btn btn-ghost" data-no-translate>
                {biz.phoneDisplay}
              </a>
            )}
          </div>
        </Reveal>
        <Reveal className="lg:col-span-7" delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-carbon">{biz.preview ? <PreviewMap biz={biz} /> : <DrawnMap area={biz.area} />}</div>
        </Reveal>
      </div>
    </section>
  );
}

/** A stylised night map of the neighbourhood for the fictional studio (no real address on it). */
function DrawnMap({ area }: { area: string }) {
  return (
    <svg viewBox="0 0 800 600" className="absolute inset-0 h-full w-full" role="img" aria-label={area}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d4fa4c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#d4fa4c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="#0b0d10" />
      <path d="M-20 470 C 140 430 220 520 380 470 S 640 380 820 420 L 820 520 C 640 480 520 560 380 560 S 120 520 -20 560 Z" fill="#101722" />
      <g stroke="#1c2027" strokeWidth="2">
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`v${i}`} x1={i * 54 + 10} y1="0" x2={i * 54 - 40} y2="600" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 52 + 12} x2="800" y2={i * 52 - 18} />
        ))}
      </g>
      <g fill="none" stroke="#2a3038" strokeWidth="9" strokeLinecap="round">
        <path d="M-10 120 C 200 160 360 200 820 150" />
        <path d="M250 -10 C 300 200 360 380 330 610" />
      </g>
      <path d="M-10 330 C 220 300 520 320 820 260" fill="none" stroke="#3a414b" strokeWidth="14" strokeLinecap="round" />
      <circle cx="420" cy="270" r="140" fill="url(#glow)" className="motion-safe:animate-pulse" />
      <circle cx="420" cy="270" r="9" fill="#d4fa4c" />
      <circle cx="420" cy="270" r="22" fill="none" stroke="#d4fa4c" strokeOpacity="0.5" />
      <text x="446" y="262" fill="#eef0f2" fontFamily="var(--font-syne)" fontSize="26" fontWeight="800">
        Lustro
      </text>
      <text x="446" y="290" fill="#9aa2ab" fontFamily="var(--font-plex-mono)" fontSize="14" letterSpacing="2">
        {area.toUpperCase()}
      </text>
    </svg>
  );
}
