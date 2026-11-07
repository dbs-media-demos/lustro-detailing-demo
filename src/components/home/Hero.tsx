"use client";

import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import heroWide from "@/assets/photos/sedan-dark.jpg";
import heroWork from "@/assets/photos/polish-black.jpg";
import { useBiz } from "@/components/preview/BizContext";
import { PhoneIcon } from "@/components/layout/MobileBar";
import { OpenBadge } from "@/components/ui/OpenBadge";
import { num, telOf } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";

/**
 * A black car in a dark studio, with a band of light that keeps sweeping across the paint.
 * Wide screens get the sedan with room for the headline; phones get a detailer at work on black
 * paint, the service and town as the headline, the rating and a Call button with the number on it.
 * Phones have no intro at all; on desktop it's CSS-only so the headline paints before any JavaScript.
 */
export function Hero() {
  const biz = useBiz();
  const t = useT();
  const alt = t("A gloss-black car under the lights of a dark detailing studio");
  const common = { alt, sizes: "100vw", quality: 75 };
  const { props: { srcSet: wide } } = getImageProps({ ...common, src: heroWide });
  const { props: { srcSet: work, ...img } } = getImageProps({ ...common, src: heroWork, loading: "eager" });
  // Phones top out at 1080w: sharp on a 3x screen and well under 100 KB.
  const workPhone = work?.split(", ").filter((c) => parseInt(c.split(" ")[1]) <= 1080).join(", ");
  const rating = biz.rating && (
    <>
      <span className="text-volt" aria-hidden>
        ★★★★★
      </span>
      <span>
        <strong className="font-semibold">{num(biz, biz.rating.value)}</strong>{" "}
        <span className="text-mist">· {t("{count} Google reviews", { count: biz.rating.count })}</span>
      </span>
    </>
  );

  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden px-[var(--gutter)] pb-24 pt-32 md:pb-16 phone:min-h-0 phone:justify-start phone:pb-7 phone:pt-[calc(var(--hero-photo)-2.75rem)]">
      <div className="anim-zoom absolute inset-0 -z-20 md:left-[34%] lg:left-[38%] phone:bottom-auto phone:left-0 phone:h-[var(--hero-photo)]">
        <picture>
          <source media="(max-width: 767.98px)" srcSet={workPhone} sizes="100vw" />
          <source media="(hover: none)" srcSet={work} sizes="100vw" />
          <source media="(min-width: 768px)" srcSet={wide} sizes="100vw" />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
          <img {...img} className="h-full w-full object-cover object-[50%_62%] phone:object-[50%_14%]" fetchPriority="high" />
        </picture>
      </div>
      {/* the light band sweeping over the paint */}
      <div aria-hidden className="hero-sweep absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,8,10,1)_0%,rgba(7,8,10,0.9)_34%,rgba(7,8,10,0.2)_52%,rgba(7,8,10,0)_70%),linear-gradient(0deg,rgba(7,8,10,0.85)_0%,rgba(7,8,10,0)_40%)] phone:bottom-auto phone:h-[var(--hero-photo)] phone:bg-[linear-gradient(180deg,rgba(7,8,10,0.6)_0%,rgba(7,8,10,0.05)_30%,rgba(7,8,10,0.1)_55%,rgba(7,8,10,1)_100%)]" />

      <div className="max-w-[80rem] phone:flex phone:flex-col">
        <p className="t-label anim-fade flex flex-wrap items-center gap-x-3 gap-y-2 text-mist" style={{ "--d": "0.1s" } as CSSProperties}>
          <span className="inline-block h-px w-8 bg-volt" aria-hidden />
          <span>{t("Detail studio")}</span>
          <span aria-hidden>·</span>
          <span data-no-translate>{biz.area}</span>
        </p>
        <h1 id="hero-title" className="t-display t-xl mt-6 phone:mt-2.5">
          <span className="hidden phone:block" data-no-translate>
            {biz.area ? t("Car detailing in {area}.", { area: biz.area }) : t("Car detailing.")}
          </span>
          <span className="phone:hidden">
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
          </span>
        </h1>
        <p className="mt-1.5 hidden font-display text-[1.02rem] font-bold leading-snug tracking-[-0.01em] text-mist phone:block">{biz.tagline ?? `${t("Like it just")} ${t("left the showroom.")}`}</p>
        {rating && <p className="mt-3 hidden items-center gap-2 text-sm phone:flex">{rating}</p>}
        <div className="mt-4 hidden phone:block">
          {biz.phone ? (
            <a href={telOf(biz)} className="btn btn-volt w-full tabular-nums" data-no-translate>
              <PhoneIcon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              {t("Call")} {biz.phoneDisplay}
            </a>
          ) : (
            <a href="#book" className="btn btn-volt w-full">
              {t("Book a detail")}
              <Arrow />
            </a>
          )}
        </div>
        <div className="mt-3 hidden h-5 phone:block">
          <OpenBadge className="whitespace-nowrap text-[0.82rem] text-mist" />
        </div>
        <p className="t-lead anim-fade mt-7 max-w-xl phone:order-1 phone:mt-3.5" style={{ "--d": "0.55s" } as CSSProperties}>
          {t("Hand wash to paint correction and ceramic coating, in a lit studio in {area}. Fixed prices by car size, and most cars go home the same day.", { area: biz.area })}
        </p>
        <div className="anim-fade mt-9 flex flex-wrap gap-3 phone:hidden" style={{ "--d": "0.7s" } as CSSProperties}>
          <a href="#book" className="btn btn-volt">
            {t("Book a detail")}
            <Arrow />
          </a>
          <a href="#packages" className="btn btn-ghost">
            {t("See prices")}
          </a>
        </div>
        <a href="#packages" className="order-2 mt-2 hidden min-h-9 items-center gap-2 self-start text-sm font-semibold text-pearl phone:inline-flex">
          {t("See prices")}
          <Arrow />
        </a>
      </div>

      <div className="anim-fade mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6 text-sm phone:hidden" style={{ "--d": "0.9s" } as CSSProperties}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {rating && <p className="flex items-center gap-2">{rating}</p>}
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
