"use client";

import { useState, type CSSProperties, type PointerEvent } from "react";
import clsx from "clsx";
import { useBiz } from "@/components/preview/BizContext";
import { Reveal } from "@/components/ui/Reveal";
import { Roll } from "@/components/ui/Roll";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { addOns, packages, sizes } from "@/content/offer";
import { useT } from "@/lib/i18n";

/** How many swirl marks the inspection light finds after each package (wash only → corrected). */
const SWIRLS = [0.85, 0.32, 0];

/** Three fixed-price packages; pick the car size and every price rolls to the new number. */
export function Packages() {
  const biz = useBiz();
  const t = useT();
  const [size, setSize] = useState(0);

  // the inspection light follows the pointer over whichever card it's on
  const aim = (e: PointerEvent<HTMLDivElement>) => {
    const card = (e.target as Element).closest<HTMLElement>(".group");
    const light = card?.querySelector<HTMLElement>("[data-inspect]");
    if (!card || !light || e.pointerType !== "mouse") return;
    const r = card.getBoundingClientRect();
    light.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    light.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const list = packages[biz.lang];
  const sizeNames = sizes[biz.lang];

  return (
    <section id="packages" aria-labelledby="packages-title" className="relative overflow-hidden bg-carbon px-[var(--gutter)] py-28 md:py-40 phone:order-1 phone:py-10">
      <div aria-hidden className="hex-lights pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-[0.06] [mask-image:linear-gradient(180deg,black,transparent)]" />
      <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between phone:gap-5">
        <Reveal phone>
          <SectionLabel text={t("03 — Prices")} />
          <h2 id="packages-title" className="t-display t-lg mt-5 max-w-[14ch] phone:mt-2.5 phone:max-w-[20ch]">
            {t("Fixed prices. No surprises at pick-up.")}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="t-label mb-3 text-mist phone:mb-2" id="size-label">
            {t("Your car")}
          </p>
          <div role="radiogroup" aria-labelledby="size-label" className="inline-flex flex-wrap gap-1 rounded-full border border-line-strong bg-ink/60 p-1 phone:grid phone:w-full phone:max-w-md phone:grid-cols-3 phone:rounded-2xl">
            {sizeNames.map((s, i) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === i}
                onClick={() => setSize(i)}
                className={clsx("min-h-11 rounded-full px-4 text-sm font-semibold transition-colors duration-300 sm:px-5 phone:rounded-xl phone:px-1.5 phone:text-[0.8rem] phone:leading-tight", size === i ? "bg-pearl text-ink" : "text-mist hover:text-pearl")}
              >
                {s}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal className="relative mt-8 max-w-xl text-sm text-mist phone:mt-3.5 phone:text-[0.82rem] phone:leading-snug">
        <p>{t("Under the inspection light: swirl marks stay after a wash, fade under a sealant, and are gone after correction.")}</p>
      </Reveal>

      <div className="near-cards no-scrollbar relative mt-10 grid gap-4 lg:grid-cols-3 phone:-mx-[var(--gutter)] phone:mt-5 phone:flex phone:snap-x phone:snap-mandatory phone:gap-3 phone:overflow-x-auto phone:scroll-px-[var(--gutter)] phone:px-[var(--gutter)]" onPointerMove={aim}>
        {list.map((p, i) => {
          const hot = Boolean(p.tag);
          return (
            <Reveal key={p.name} delay={i * 0.08} className={clsx("group relative isolate flex flex-col overflow-hidden rounded-3xl border p-7 transition-transform duration-700 hover:-translate-y-1 md:p-9 phone:w-[clamp(15.5rem,82%,22rem)] phone:shrink-0 phone:snap-start phone:p-5", hot ? "border-volt/60 bg-steel" : "border-line bg-ink/50")}>
              {hot && <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-volt/15 blur-3xl phone:bg-[radial-gradient(closest-side,rgba(212,250,76,0.16),transparent)] phone:blur-none" />}
              <div aria-hidden className="absolute inset-0 -z-10">
                <div data-inspect className="absolute inset-0" style={{ "--swirl": SWIRLS[i] ?? 0 } as CSSProperties}>
                  <div className="inspect" />
                  <div className="inspect-swirls" />
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 phone:flex-wrap phone:gap-y-1.5">
                <h3 className="font-display text-2xl font-bold tracking-tight phone:text-[1.2rem] phone:leading-tight">{p.name}</h3>
                {p.tag && <span className="t-label rounded-full bg-volt px-3 py-1.5 text-[0.62rem] text-ink phone:shrink-0 phone:px-2.5 phone:py-1 phone:text-[0.58rem] phone:tracking-[0.08em]">{p.tag}</span>}
              </div>
              <p className="t-label mt-2 text-mist phone:mt-1">{p.time}</p>
              <p className="mt-10 flex items-baseline gap-1.5 font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] sm:text-[3.4rem] md:text-[4rem] phone:mt-4 phone:text-[clamp(1.6rem,8.6vw,2.3rem)]">
                {/* "60.000 din": the number rolls, the currency word sits smaller beside it */}
                <Roll value={p.prices[size].replace(/\s*din$/, "")} />
                {p.prices[size].endsWith("din") && <span className="text-lg tracking-normal text-mist">din</span>}
              </p>
              <p className="mt-2 text-sm text-mist phone:mt-0.5 phone:text-[0.8rem]">{sizeNames[size]}</p>
              <ul className="mt-8 space-y-3 border-t border-line pt-7 text-[0.95rem] phone:mb-4 phone:mt-3.5 phone:space-y-1.5 phone:pt-3.5 phone:text-[0.84rem] phone:leading-snug">
                {p.includes.map((x) => (
                  <li key={x} className="flex gap-3 phone:gap-2">
                    <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-volt phone:mt-0.5 phone:h-3.5 phone:w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="m3 8.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={x.startsWith("Everything") || x.startsWith("Sve ") ? "text-mist" : ""}>{x}</span>
                  </li>
                ))}
              </ul>
              <a href="#book" className={clsx("btn mt-10 phone:mt-auto phone:min-h-11 phone:whitespace-normal phone:text-center phone:text-sm phone:leading-tight", hot ? "btn-volt" : "btn-ghost")}>
                {t("Book {name}", { name: p.name })}
              </a>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="no-scrollbar relative mt-12 flex flex-wrap items-center gap-3 phone:-mx-[var(--gutter)] phone:mt-4 phone:flex-nowrap phone:gap-2 phone:overflow-x-auto phone:px-[var(--gutter)]">
        <span className="t-label mr-2 text-mist phone:mr-0 phone:shrink-0">{t("Add-ons")}</span>
        {addOns[biz.lang].map((a) => (
          <span key={a.name} className="rounded-full border border-line px-4 py-2 text-sm phone:shrink-0 phone:whitespace-nowrap phone:px-3 phone:py-1.5 phone:text-[0.8rem]">
            {a.name} <span className="text-mist">· {a.price}</span>
          </span>
        ))}
      </Reveal>
    </section>
  );
}
