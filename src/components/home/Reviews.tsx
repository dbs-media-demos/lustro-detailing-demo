"use client";

import { useRef, type CSSProperties } from "react";
import clsx from "clsx";
import { useBiz } from "@/components/preview/BizContext";
import { Reveal } from "@/components/ui/Reveal";
import { useArrive } from "@/components/ui/useArrive";
import { reviews } from "@/content/offer";
import { initialsOf, num } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";

/** Google-style rating summary and review cards. The reviews are samples and say so. */
export function Reviews() {
  const biz = useBiz();
  const t = useT();
  const list = reviews[biz.lang];
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="relative bg-ink px-[var(--gutter)] py-28 md:py-40">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="t-label text-volt">{t("06 — Reviews")}</p>
          <h2 id="reviews-title" className="t-display t-md mt-5">
            {t("Clean enough to photograph in the driveway.")}
          </h2>
          {biz.rating && (
            <div className="mt-10 flex items-center gap-5 rounded-3xl border border-line p-6">
              <GoogleG />
              <div>
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-5xl font-extrabold tracking-tight">{num(biz, biz.rating.value)}</span>
                  <BuffedStars />
                </p>
                <p className="mt-1 text-sm text-mist">{t("{count} Google reviews", { count: biz.rating.count })}</p>
              </div>
            </div>
          )}
          <p className="t-label mt-6 text-[0.64rem] text-mist">{t("Sample reviews, for this concept site")}</p>
        </Reveal>

        <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {list.map((r, i) => (
            <Reveal as="li" key={r.name} delay={(i % 2) * 0.08} className={clsx("flex flex-col rounded-3xl border border-line bg-carbon p-6 md:p-7", i % 2 === 1 && "sm:translate-y-10")}>
              <div className="flex items-center gap-3">
                <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-steel-2 text-sm font-bold">
                  {initialsOf(r.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.name}</p>
                  <p className="truncate text-xs text-mist">
                    {r.car} · {r.when}
                  </p>
                </div>
                <GoogleG small />
              </div>
              <p className="mt-4 text-volt" aria-label={t("5 out of 5 stars")}>
                ★★★★★
              </p>
              <p className="mt-3 leading-relaxed text-pearl/90">{r.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** The rating's stars, buffed to a shine one by one by a small spinning polisher pad as they arrive. */
function BuffedStars() {
  const ref = useRef<HTMLSpanElement>(null);
  useArrive(ref, "buff-wait", "buffed");
  return (
    <span ref={ref} aria-hidden className="relative inline-flex text-xl">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="buff-star w-[1.1em] text-center" style={{ "--d": `${0.3 + i * 0.26}s` } as CSSProperties}>
          ★
        </span>
      ))}
      <span className="buff-pad absolute -top-[0.15em] left-0 h-[1.3em] w-[1.3em]">
        <span className="block h-full w-full rounded-full border border-pearl/50 bg-[repeating-conic-gradient(rgba(238,240,242,0.85)_0_12deg,rgba(212,250,76,0.7)_12deg_24deg)] shadow-[0_6px_18px_rgba(0,0,0,0.6)]" />
      </span>
    </span>
  );
}

function GoogleG({ small }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={small ? "h-5 w-5" : "h-10 w-10"} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
