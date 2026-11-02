"use client";

import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import pressure from "@/assets/photos/pressure-wash.jpg";
import rinse from "@/assets/photos/rinse-coupe.jpg";
import tan from "@/assets/photos/interior-tan.jpg";
import cloth from "@/assets/photos/microfiber.jpg";
import wheel from "@/assets/photos/wheel-wash.jpg";
import led from "@/assets/photos/headlight-led.jpg";
import foamSuv from "@/assets/photos/foam-suv.jpg";
import matte from "@/assets/photos/matte-studio.jpg";
import reflection from "@/assets/photos/reflection.jpg";
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
          shots.map((s) => (
            <div key={`${copy}-${s.alt}`} className={`relative aspect-[4/3] shrink-0 overflow-hidden rounded-2xl ${s.w}`} aria-hidden={copy === 1 || undefined}>
              <Image src={s.src} alt={copy ? "" : t(s.alt)} fill sizes="(min-width: 768px) 30rem, 19rem" className="object-cover" />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

/** Inside the studio: two rows of photos drifting past in opposite directions. */
export function Studio() {
  const t = useT();
  return (
    <section aria-label={t("Inside the studio")} className="space-y-3 overflow-hidden bg-carbon pb-28 md:space-y-4 md:pb-40">
      <Row shots={ROW_A} dur="70s" />
      <Row shots={ROW_B} dur="60s" reverse />
    </section>
  );
}
