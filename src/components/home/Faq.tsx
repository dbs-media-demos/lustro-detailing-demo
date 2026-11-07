"use client";

import { useBiz } from "@/components/preview/BizContext";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { faq } from "@/content/offer";
import { useT } from "@/lib/i18n";

/**
 * Straight answers to what people ask on the phone. Native <details>, so it works without JS; an
 * answer opens behind a drying blade, a bright line that pulls across it like water off glass.
 */
export function Faq() {
  const biz = useBiz();
  const t = useT();
  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-carbon px-[var(--gutter)] py-28 md:py-40 phone:order-8 phone:bg-ink phone:py-10">
      <div className="grid gap-12 lg:grid-cols-12 phone:gap-4">
        <Reveal phone className="lg:col-span-4">
          <SectionLabel text={t("07 — Questions")} />
          <h2 id="faq-title" className="t-display t-lg mt-5 phone:mt-2.5">
            {t("Good questions.")}
          </h2>
        </Reveal>
        <div className="border-t border-line lg:col-span-7 lg:col-start-6">
          {faq[biz.lang].map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <details className="group border-b border-line">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-6 py-6 text-lg font-semibold md:text-xl phone:gap-4 phone:py-3 phone:text-[0.95rem] phone:leading-snug">
                  {f.q}
                  <span aria-hidden className="relative h-4 w-4 shrink-0">
                    <span className="absolute left-0 top-1/2 h-px w-4 bg-volt" />
                    <span className="absolute left-0 top-1/2 h-px w-4 rotate-90 bg-volt transition-transform duration-500 group-open:rotate-0" />
                  </span>
                </summary>
                <div className="blade relative">
                  <p className="max-w-2xl pb-7 leading-relaxed text-mist phone:pb-4 phone:text-[0.9rem] phone:leading-snug">{f.a}</p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
