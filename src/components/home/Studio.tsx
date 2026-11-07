"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef, type CSSProperties } from "react";
import pressure from "@/assets/photos/pressure-wash.jpg";
import rinse from "@/assets/photos/rinse-coupe.jpg";
import tan from "@/assets/photos/interior-tan.jpg";
import cloth from "@/assets/photos/microfiber.jpg";
import wheel from "@/assets/photos/wheel-wash.jpg";
import led from "@/assets/photos/headlight-led.jpg";
import foamSuv from "@/assets/photos/foam-suv.jpg";
import matte from "@/assets/photos/matte-studio.jpg";
import reflection from "@/assets/photos/reflection.jpg";
import { Reveal } from "@/components/ui/Reveal";
import { useArrive } from "@/components/ui/useArrive";
import { useT } from "@/lib/i18n";

type Shot = { src: StaticImageData; alt: string; w: string };
const ROW_A: Shot[] = [
  { src: pressure, alt: "Rinsing a black coupe with a pressure washer", w: "w-[19rem] md:w-[30rem]" },
  { src: tan, alt: "Tan leather seats after a deep clean", w: "w-[15rem] md:w-[22rem]" },
  { src: led, alt: "LED headlight glowing in the dark", w: "w-[17rem] md:w-[26rem]" },
  { src: cloth, alt: "A microfiber towel resting on gloss-black paint", w: "w-[15rem] md:w-[22rem]" },
  { src: matte, alt: "A satin black car in a bright white studio", w: "w-[19rem] md:w-[30rem]" },
];
const ROW_B: Shot[] = [
  { src: wheel, alt: "Brushing a wheel clean under running suds", w: "w-[15rem] md:w-[22rem]" },
  { src: reflection, alt: "Studio lights reflected in freshly polished paint", w: "w-[19rem] md:w-[30rem]" },
  { src: foamSuv, alt: "An SUV covered in snow foam", w: "w-[17rem] md:w-[26rem]" },
  { src: rinse, alt: "Hand washing a black sedan outdoors", w: "w-[19rem] md:w-[28rem]" },
];

function Row({ shots, reverse, dur }: { shots: Shot[]; reverse?: boolean; dur: string }) {
  const t = useT();
  return (
    <div className="overflow-hidden">
      <div className="marquee gap-3 md:gap-4" data-reverse={reverse || undefined} style={{ "--dur": dur } as CSSProperties}>
        {[0, 1].map((copy) =>
          shots.map((s, i) => (
            <div key={`${copy}-${s.alt}`} className={`relative aspect-[4/3] shrink-0 overflow-hidden rounded-2xl ${s.w}`} aria-hidden={copy === 1 || undefined}>
              <Image src={s.src} alt={copy ? "" : t(s.alt)} fill sizes="(min-width: 768px) 30rem, 19rem" className="object-cover" />
              <span aria-hidden className="film film-sat" style={{ "--d": `${0.25 + i * 0.35}s` } as CSSProperties} />
              <span aria-hidden className="film" style={{ "--d": `${0.25 + i * 0.35}s` } as CSSProperties} />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

/**
 * Inside the studio: two rows of photos drifting past in opposite directions. They arrive dull
 * and come up rich one by one, the way leather looks after it's been cleaned and fed.
 * On phones it's one row you swipe yourself, with the next photo half showing.
 */
export function Studio() {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  useArrive(ref, "studio-dull", undefined, "0px 0px -25% 0px");
  return (
    <section ref={ref} aria-label={t("Inside the studio")} className="overflow-hidden bg-carbon pb-28 md:pb-40 phone:order-7 phone:py-10">
      <div className="space-y-3 md:space-y-4 phone:hidden">
        <Row shots={ROW_A} dur="70s" />
        <Row shots={ROW_B} dur="60s" reverse />
      </div>
      <div className="hidden phone:block">
        <Reveal phone className="px-[var(--gutter)]">
          <p className="t-label text-volt">{t("Inside the studio")}</p>
        </Reveal>
        <div className="no-scrollbar mt-3.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)]">
          {[...ROW_A, ...ROW_B].map((s) => (
            <div key={s.alt} className="relative aspect-[4/3] w-[min(62vw,18rem)] shrink-0 snap-start overflow-hidden rounded-2xl">
              <Image src={s.src} alt={t(s.alt)} fill sizes="(max-width: 767px) 62vw, 18rem" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
