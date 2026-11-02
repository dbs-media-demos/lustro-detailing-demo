"use client";

import Image from "next/image";
import garage from "@/assets/photos/garage-front.jpg";
import foam from "@/assets/photos/foam-sedan.jpg";
import polish from "@/assets/photos/polish-pad.jpg";
import beads from "@/assets/photos/beads-macro.jpg";
import { Reveal } from "@/components/ui/Reveal";
import { useT } from "@/lib/i18n";

const STEPS = [
  { photo: garage, time: "15 min", title: "Look under the lights", text: "We walk round the car with you under studio lights and a paint depth gauge, and agree a fixed price before anything touches it.", alt: "A black car's headlight in the dark studio" },
  { photo: foam, time: "1–2 h", title: "Wash & decontaminate", text: "Snow foam first, then a two-bucket hand wash, iron remover and clay. The grit comes off before anything rubs the paint.", alt: "Thick snow foam covering a black car" },
  { photo: polish, time: "4–12 h", title: "Correct", text: "Machine polishing, panel by panel, checked under different lights until the swirls are gone, not just hidden.", alt: "A gloved hand polishing a blue hood with a machine polisher" },
  { photo: beads, time: "Overnight", title: "Protect & hand back", text: "Sealant or ceramic coating, a final wipe-down, and a walk-round in the same light so you can see the difference for yourself.", alt: "Tight round water beads on coated blue paint" },
] as const;

/** Four steps as cards that stack on top of each other as you scroll (CSS sticky, no JS). */
export function Process() {
  const t = useT();
  return (
    <section aria-labelledby="process-title" className="relative bg-carbon px-[var(--gutter)] py-28 md:py-40">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+3rem)]">
            <Reveal>
              <p className="t-label text-volt">{t("05 — How it goes")}</p>
              <h2 id="process-title" className="t-display t-lg mt-5">
                {t("One car at a time.")}
              </h2>
              <p className="t-lead mt-6 max-w-sm">{t("No conveyor, no rushing. Each car gets its own bay, its own towels and the same person from start to finish.")}</p>
            </Reveal>
          </div>
        </div>
        <ol className="space-y-6 lg:col-span-8 lg:col-start-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="sticky" style={{ top: `calc(var(--header-h) + 1rem + ${i * 1.25}rem)` }}>
              <article className="grid overflow-hidden rounded-3xl border border-line bg-steel shadow-[0_-20px_60px_rgba(0,0,0,0.45)] md:grid-cols-[1.1fr_1fr]">
                <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[22rem]">
                  <Image src={s.photo} alt={t(s.alt)} fill sizes="(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-col p-7 md:p-9">
                  <p className="t-label flex justify-between text-mist">
                    <span className="text-volt">0{i + 1}</span>
                    <span>{t(s.time)}</span>
                  </p>
                  <h3 className="t-display t-sm mt-auto pt-10">{t(s.title)}</h3>
                  <p className="mt-4 text-mist">{t(s.text)}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
