"use client";

import type { CSSProperties } from "react";
import { Hero } from "./Hero";
import { WashScene } from "./WashScene";
import { Services } from "./Services";
import { Packages } from "./Packages";
import { RainTest } from "./RainTest";
import { Process } from "./Process";
import { Studio } from "./Studio";
import { Reviews } from "./Reviews";
import { Faq } from "./Faq";
import { Book } from "./Book";
import { Visit } from "./Visit";
import { useT } from "@/lib/i18n";

const WORDS = ["Hand wash", "Paint correction", "Ceramic coating", "Interior detail", "Paint protection film", "Headlights", "Wheels"];

/** The homepage, shared by the concept site (/, /sr) and personalised previews (/for/<token>). */
export function HomeContent() {
  return (
    <>
      <Hero />
      <Ticker />
      <WashScene />
      <Services />
      <Packages />
      <RainTest />
      <Process />
      <Studio />
      <Reviews />
      <Faq />
      <Book />
      <Visit />
    </>
  );
}

function Ticker() {
  const t = useT();
  return (
    <div className="overflow-hidden border-y border-line bg-ink py-5" aria-hidden>
      <div className="marquee" style={{ "--dur": "45s" } as CSSProperties}>
        {[0, 1].map((c) => (
          <span key={c} className="flex shrink-0 items-center">
            {WORDS.map((w) => (
              <span key={w} className="flex items-center font-display text-2xl font-bold tracking-tight text-pearl/80 md:text-3xl">
                <span className="px-6">{t(w)}</span>
                <span className="text-volt">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
