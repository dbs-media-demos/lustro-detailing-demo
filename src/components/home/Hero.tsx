"use client";

import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import heroWide from "@/assets/photos/sedan-dark.jpg";
import heroTall from "@/assets/photos/hero-studio.jpg";
import { useBiz } from "@/components/preview/BizContext";
import { OpenBadge } from "@/components/ui/OpenBadge";
import { num } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";

/**
 * A black car in a dark studio, with a band of light that keeps sweeping across the paint.
 * Wide screens get the sedan with room for the headline; phones get the tall studio shot.
 * The intro is CSS-only so the headline paints before any JavaScript runs.
 */
export function Hero() {
  const biz = useBiz();
  const t = useT();
  const alt = t("A gloss-black car under the lights of a dark detailing studio");
  const common = { alt, sizes: "100vw", quality: 75 };
  const { props: { srcSet: wide } } = getImageProps({ ...common, src: heroWide });
  const { props: { srcSet: tall, ...img } } = getImageProps({ ...common, src: heroTall, loading: "eager" });

  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden px-[var(--gutter)] pb-24 pt-32 md:pb-16">
      <div className="anim-zoom absolute inset-0 -z-20 md:left-[34%] lg:left-[38%]">
        <picture>
          <source media="(min-width: 768px)" srcSet={wide} sizes="100vw" />
          <source media="(max-width: 767px)" srcSet={tall} sizes="100vw" />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
          <img {...img} className="h-full w-full object-cover object-[50%_70%] md:object-[50%_62%]" fetchPriority="high" />
        </picture>
      </div>
      {/* the light band sweeping over the paint */}
      <div aria-hidden className="hero-sweep absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,8,10,0.5)_0%,rgba(7,8,10,0.1)_22%,rgba(7,8,10,0.6)_45%,rgba(7,8,10,0.95)_78%)] md:bg-[linear-gradient(90deg,rgba(7,8,10,1)_0%,rgba(7,8,10,0.9)_34%,rgba(7,8,10,0.2)_52%,rgba(7,8,10,0)_70%),linear-gradient(0deg,rgba(7,8,10,0.85)_0%,rgba(7,8,10,0)_40%)]" />

      <div className="max-w-[80rem]">
        <p className="t-label anim-fade flex flex-wrap items-center gap-x-3 gap-y-2 text-mist" style={{ "--d": "0.1s" } as CSSProperties}>
          <span className="inline-block h-px w-8 bg-volt" aria-hidden />
          <span>{t("Detail studio")}</span>
          <span aria-hidden>·</span>
          <span data-no-translate>{biz.area}</span>
        </p>
        <h1 id="hero-title" className="t-display t-xl mt-6">
          {biz.tagline ? (
            <span className="anim-rise block">{biz.tagline}</span>
          ) : (
            <>
              <span className="anim-rise block" style={{ "--d": "0.15s" } as CSSProperties}>
                {t("Like it just")}
              </span>
              <span className="anim-rise t-gloss block pb-[0.08em]" style={{ "--d": "0.28s" } as CSSProperties}>
                {t("left the showroom.")}
              </span>
            </>
          )}
        </h1>
        <p className="t-lead anim-fade mt-7 max-w-xl" style={{ "--d": "0.55s" } as CSSProperties}>
          {t("Hand wash to paint correction and ceramic coating, in a lit studio in {area}. Fixed prices by car size, and most cars go home the same day.", { area: biz.area })}
        </p>
        <div className="anim-fade mt-9 flex flex-wrap gap-3" style={{ "--d": "0.7s" } as CSSProperties}>
          <a href="#book" className="btn btn-volt">
            {t("Book a detail")}
            <Arrow />
          </a>
          <a href="#packages" className="btn btn-ghost">
            {t("See prices")}
          </a>
        </div>
      </div>

      <div className="anim-fade mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6 text-sm" style={{ "--d": "0.9s" } as CSSProperties}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {biz.rating && (
            <p className="flex items-center gap-2">
              <span className="text-volt" aria-hidden>
                ★★★★★
              </span>
              <span>
                <strong className="font-semibold">{num(biz, biz.rating.value)}</strong>{" "}
                <span className="text-mist">· {t("{count} Google reviews", { count: biz.rating.count })}</span>
              </span>
            </p>
          )}
          <OpenBadge className="text-mist" />
        </div>
        <dl className="t-label hidden gap-8 text-[0.66rem] text-mist md:flex">
          <div>
            <dt>{t("Gloss after")}</dt>
            <dd className="mt-1 text-sm text-pearl">96 GU</dd>
          </div>
          <div>
            <dt>{t("Coating")}</dt>
            <dd className="mt-1 text-sm text-pearl">{t("5 years")}</dd>
          </div>
          <div>
            <dt>{t("Cars a day")}</dt>
            <dd className="mt-1 text-sm text-pearl">{t("Six, max")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
