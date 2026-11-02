"use client";

import { useBiz } from "@/components/preview/BizContext";
import { Reveal } from "@/components/ui/Reveal";
import { faq } from "@/content/offer";
import { useT } from "@/lib/i18n";

/** Straight answers to what people ask on the phone. Native <details>, so it works without JS. */
export function Faq() {
  const biz = useBiz();
  const t = useT();
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-carbon px-[var(--gutter)] py-28 md:py-40">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="t-label text-volt">{t("07 — Questions")}</p>
          <h2 id="faq-title" className="t-display t-lg mt-5">
            {t("Good questions.")}
          </h2>
        </Reveal>
        <div className="border-t border-line lg:col-span-7 lg:col-start-6">
          {faq[biz.lang].map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <details className="group border-b border-line">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-6 py-6 text-lg font-semibold md:text-xl">
                  {f.q}
                  <span aria-hidden className="relative h-4 w-4 shrink-0">
                    <span className="absolute left-0 top-1/2 h-px w-4 bg-volt" />
                    <span className="absolute left-0 top-1/2 h-px w-4 rotate-90 bg-volt transition-transform duration-500 group-open:rotate-0" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 leading-relaxed text-mist">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
