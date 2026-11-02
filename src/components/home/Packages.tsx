"use client";

import { useState } from "react";
import clsx from "clsx";
import { useBiz } from "@/components/preview/BizContext";
import { Reveal } from "@/components/ui/Reveal";
import { Roll } from "@/components/ui/Roll";
import { addOns, packages, sizes } from "@/content/offer";
import { useT } from "@/lib/i18n";

/** Three fixed-price packages; pick the car size and every price rolls to the new number. */
export function Packages() {
  const biz = useBiz();
  const t = useT();
  const [size, setSize] = useState(0);
  const list = packages[biz.lang];
  const sizeNames = sizes[biz.lang];

  return (
    <section id="packages" aria-labelledby="packages-title" className="relative overflow-hidden bg-carbon px-[var(--gutter)] py-28 md:py-40">
      <div aria-hidden className="hex-lights pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-[0.06] [mask-image:linear-gradient(180deg,black,transparent)]" />
      <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <p className="t-label text-volt">{t("03 — Prices")}</p>
          <h2 id="packages-title" className="t-display t-lg mt-5 max-w-[14ch]">
            {t("Fixed prices. No surprises at pick-up.")}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="t-label mb-3 text-mist" id="size-label">
            {t("Your car")}
          </p>
          <div role="radiogroup" aria-labelledby="size-label" className="inline-flex flex-wrap gap-1 rounded-full border border-line-strong bg-ink/60 p-1">
            {sizeNames.map((s, i) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === i}
                onClick={() => setSize(i)}
                className={clsx("min-h-11 rounded-full px-4 text-sm font-semibold transition-colors duration-300 sm:px-5", size === i ? "bg-pearl text-ink" : "text-mist hover:text-pearl")}
              >
                {s}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="relative mt-14 grid gap-4 lg:grid-cols-3">
        {list.map((p, i) => {
          const hot = Boolean(p.tag);
          return (
            <Reveal key={p.name} delay={i * 0.08} className={clsx("group relative flex flex-col overflow-hidden rounded-3xl border p-7 transition-transform duration-700 hover:-translate-y-1 md:p-9", hot ? "border-volt/60 bg-steel" : "border-line bg-ink/50")}>
              {hot && <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-volt/15 blur-3xl" />}
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-2xl font-bold tracking-tight">{p.name}</h3>
                {p.tag && <span className="t-label rounded-full bg-volt px-3 py-1.5 text-[0.62rem] text-ink">{p.tag}</span>}
              </div>
              <p className="t-label mt-2 text-mist">{p.time}</p>
              <p className="mt-10 font-display text-[3.4rem] font-extrabold leading-none tracking-[-0.04em] md:text-[4rem]">
                <Roll value={p.prices[size]} />
              </p>
              <p className="mt-2 text-sm text-mist">{sizeNames[size]}</p>
              <ul className="mt-8 space-y-3 border-t border-line pt-7 text-[0.95rem]">
                {p.includes.map((x) => (
                  <li key={x} className="flex gap-3">
                    <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-volt" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="m3 8.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={x.startsWith("Everything") || x.startsWith("Sve ") ? "text-mist" : ""}>{x}</span>
                  </li>
                ))}
              </ul>
              <a href="#book" className={clsx("btn mt-10", hot ? "btn-volt" : "btn-ghost")}>
                {t("Book {name}", { name: p.name })}
              </a>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="relative mt-12 flex flex-wrap items-center gap-3">
        <span className="t-label mr-2 text-mist">{t("Add-ons")}</span>
        {addOns[biz.lang].map((a) => (
          <span key={a.name} className="rounded-full border border-line px-4 py-2 text-sm">
            {a.name} <span className="text-mist">· {a.price}</span>
          </span>
        ))}
      </Reveal>
    </section>
  );
}
