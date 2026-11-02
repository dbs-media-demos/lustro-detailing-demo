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
      <svg width="0" height="0" className="absolute">
        <defs>
          <radialGradient id="bead" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#d4fa4c" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="#1d2410" stopOpacity="0.4" />
            <stop offset="1" stopColor="#d4fa4c" stopOpacity="0.7" />
          </radialGradient>
        </defs>
      </svg>
      <div className="marquee" style={{ "--dur": "45s" } as CSSProperties}>
        {[0, 1].map((c) => (
          <span key={c} className="flex shrink-0 items-center">
            {WORDS.map((w) => (
              <span key={w} className="flex items-center font-display text-2xl font-bold tracking-tight text-pearl/80 md:text-3xl">
                <span className="px-6">{t(w)}</span>
                <Bead />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The separator: a single water bead with a highlight, the way rain sits on a coated panel. */
function Bead() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 md:h-5 md:w-5" aria-hidden>
      <ellipse cx="11" cy="12.5" rx="7" ry="5.5" fill="#000" opacity="0.5" />
      <circle cx="10" cy="10" r="7" fill="url(#bead)" stroke="rgba(212,250,76,0.85)" strokeWidth="1" />
      <ellipse cx="7.6" cy="7.2" rx="2.2" ry="1.5" fill="#fff" opacity="0.95" />
    </svg>
  );
}
