"use client";

import Image from "next/image";
import garage from "@/assets/photos/garage-front.jpg";
import foam from "@/assets/photos/foam-sedan.jpg";
import polish from "@/assets/photos/polish-pad.jpg";
import beads from "@/assets/photos/beads-macro.jpg";
import { useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Roll } from "@/components/ui/Roll";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useArrive } from "@/components/ui/useArrive";
import { useT } from "@/lib/i18n";

/** Paint depth at each step, in microns: correction takes a few off, the coating adds one back. */
const DEPTH = [
  { um: 118, note: "Measured on every panel" },
  { um: 118, note: "Nothing taken off" },
  { um: 115, note: "3 µm of clear coat, no more" },
  { um: 116, note: "+1 µm of ceramic on top" },
] as const;

const STEPS = [
  { photo: garage, time: "15 min", title: "Look under the lights", text: "We walk round the car with you under studio lights and a paint depth gauge, and agree a fixed price before anything touches it.", alt: "A black car's headlight in the dark studio" },
  { photo: foam, time: "1–2 h", title: "Wash & decontaminate", text: "Snow foam first, then a two-bucket hand wash, iron remover and clay. The grit comes off before anything rubs the paint.", alt: "Thick snow foam covering a black car" },
  { photo: polish, time: "4–12 h", title: "Correct", text: "Machine polishing, panel by panel, checked under different lights until the swirls are gone, not just hidden.", alt: "A gloved hand polishing a blue hood with a machine polisher" },
  { photo: beads, time: "Overnight", title: "Protect & hand back", text: "Sealant or ceramic coating, a final wipe-down, and a walk-round in the same light so you can see the difference for yourself.", alt: "Tight round water beads on coated blue paint" },
] as const;

/**
 * Four steps as cards that stack on top of each other as you scroll (CSS sticky). Each card
 * carries a paint depth gauge that reads its value as the card arrives. On phones nothing pins:
 * the cards are a swipeable row with the gauges already read.
 */
export function Process() {
  const t = useT();
  return (
    <section aria-labelledby="process-title" className="relative bg-carbon px-[var(--gutter)] py-28 md:py-40 phone:order-3 phone:py-10">
      <div className="grid gap-12 lg:grid-cols-12 phone:gap-5">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)] phone:static">
            <Reveal phone>
              <SectionLabel text={t("05 — How it goes")} />
              <h2 id="process-title" className="t-display t-lg mt-5 phone:mt-2.5">
                {t("One car at a time.")}
              </h2>
              <p className="t-lead mt-6 max-w-sm phone:mt-2.5">{t("No conveyor, no rushing. Each car gets its own bay, its own towels and the same person from start to finish.")}</p>
            </Reveal>
          </div>
        </div>
        <ol className="no-scrollbar space-y-6 lg:col-span-8 lg:col-start-5 phone:relative phone:-mx-[var(--gutter)] phone:flex phone:snap-x phone:snap-mandatory phone:gap-3 phone:space-y-0 phone:overflow-x-auto phone:scroll-px-[var(--gutter)] phone:px-[var(--gutter)]">
          {STEPS.map((s, i) => (
            <Step key={s.title} s={s} i={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({ s, i }: { s: (typeof STEPS)[number]; i: number }) {
  const t = useT();
  const ref = useRef<HTMLLIElement>(null);
  useArrive(ref, "gauge-wait", undefined, "0px 0px -30% 0px");
  const d = DEPTH[i];
  return (
    <li ref={ref} className="sticky phone:static phone:w-[clamp(15.5rem,70%,20rem)] phone:shrink-0 phone:snap-start" style={{ top: `calc(var(--header-h) + 1rem + ${i * 1.25}rem)` }}>
      <article className="grid overflow-hidden rounded-3xl border border-line bg-steel shadow-[0_-20px_60px_rgba(0,0,0,0.45)] md:grid-cols-[1.1fr_1fr] phone:h-full phone:grid-cols-1 phone:grid-rows-[auto_1fr] phone:rounded-2xl phone:shadow-none">
        <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[22rem] phone:aspect-[16/9] phone:min-h-0">
          <Image src={s.photo} alt={t(s.alt)} fill sizes="(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 66vw" className="object-cover" />
        </div>
        <div className="flex flex-col p-7 md:p-9 phone:p-4">
          <p className="t-label flex justify-between text-mist">
            <span className="text-volt">0{i + 1}</span>
            <span>{t(s.time)}</span>
          </p>
          <h3 className="t-display t-sm mt-auto pt-10 phone:mt-0 phone:pt-2.5 phone:text-[0.98rem]">{t(s.title)}</h3>
          <p className="mt-4 text-mist phone:mt-1.5 phone:text-[0.84rem] phone:leading-snug">{t(s.text)}</p>
          <div className="mt-7 border-t border-line pt-5 phone:mt-auto phone:pt-2.5">
            <p className="t-label flex items-baseline justify-between text-[0.64rem] text-mist">
              <span>{t("Paint depth")}</span>
              <span className="text-pearl">
                <Roll value={String(d.um)} className="font-display text-xl font-extrabold tracking-tight" /> µm
              </span>
            </p>
            <span aria-hidden className="mt-2 block h-1 overflow-hidden rounded-full bg-pearl/10">
              <span className="gauge-bar block h-full origin-left rounded-full bg-volt" style={{ transform: `scaleX(${d.um / 140})` }} />
            </span>
            <p className="mt-2 text-xs text-mist">{t(d.note)}</p>
          </div>
        </div>
      </article>
    </li>
  );
}
