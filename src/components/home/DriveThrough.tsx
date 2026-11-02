"use client";

import type { CSSProperties } from "react";
import { useT } from "@/lib/i18n";

const BODY = "M6 31c0-4 2-6 7-7l17-3c6-6 14-10 26-10h17c10 0 18 4 26 10l10 2c5 1 7 3 7 8v2H6z";
const GLASS = "M38 21c5-5 11-7 18-7h16c7 0 13 3 18 7z";

function Car({ clean }: { clean?: boolean }) {
  return (
    <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden>
      <path d={BODY} fill={clean ? "#0c0e11" : "#6b6152"} stroke={clean ? "rgba(238,240,242,0.45)" : "none"} strokeWidth="0.8" />
      <path d={GLASS} fill={clean ? "#1d2533" : "#4d463c"} />
      {clean ? (
        <>
          {/* a line of studio light along the fresh paint */}
          <path d="M20 25.5c14-2 40-3 80-1" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" fill="none" strokeLinecap="round" />
          <path d="M60 15.5h10" stroke="#d4fa4c" strokeOpacity="0.8" strokeWidth="1" strokeLinecap="round" />
        </>
      ) : (
        [14, 22, 47, 63, 78, 96, 104, 35].map((x, i) => <circle key={x} cx={x} cy={26 + (i % 3) * 2} r={0.9 + (i % 2) * 0.6} fill="#9a8e78" />)
      )}
      {[30, 92].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={33} r={6.5} fill={clean ? "#111317" : "#2a2722"} />
          <circle cx={cx} cy={33} r={3.4} fill="none" stroke={clean ? "rgba(238,240,242,0.55)" : "#5c5446"} strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  );
}

/**
 * A little drive-through under the address: a dusty car rolls into the studio bay and comes out
 * the other side gleaming. Two copies of the same moving car, each clipped to its half, so the
 * swap happens exactly under the bay. Pure CSS; reduced motion parks the car half way in.
 */
export function DriveThrough() {
  const t = useT();
  return (
    <div className="relative mt-16 h-36 overflow-hidden rounded-3xl border border-line bg-carbon md:h-32" role="img" aria-label={t("A dusty car drives into the studio and comes out gleaming")}>
      <span aria-hidden className="absolute inset-x-0 bottom-7 h-px bg-line-strong" />
      {[false, true].map((clean) => (
        <div key={String(clean)} aria-hidden className="absolute inset-0" style={{ clipPath: clean ? "inset(0 0 0 50%)" : "inset(0 50% 0 0)" }}>
          <div className="absolute inset-x-0 bottom-[1.1rem] h-12 [container-type:inline-size] md:h-14">
            <div className="drive-car h-full w-32 md:w-40">
              <Car clean={clean} />
            </div>
          </div>
        </div>
      ))}
      {/* the bay: a light bar overhead, two posts and a curtain of rinse water */}
      <div aria-hidden className="absolute bottom-7 left-1/2 h-[4.6rem] w-24 -translate-x-1/2 md:h-[5.4rem] md:w-28">
        <span className="absolute inset-x-0 top-0 h-1 rounded-full bg-volt shadow-[0_0_24px_rgba(212,250,76,0.55)]" />
        <span className="absolute bottom-0 left-0 top-0 w-px bg-pearl/25" />
        <span className="absolute bottom-0 right-0 top-0 w-px bg-pearl/25" />
        {[0.12, 0.3, 0.5, 0.68, 0.86].map((x, i) => (
          <span key={x} className="drive-drop absolute top-2 h-2.5 w-px rounded-full bg-[#cfe3ff]" style={{ left: `${x * 100}%`, "--d": `${i * 0.18}s` } as CSSProperties} />
        ))}
      </div>
      <span className="t-label absolute left-5 top-4 text-[0.62rem] text-mist">{t("In dusty")}</span>
      <span className="t-label absolute right-5 top-4 text-[0.62rem] text-volt">{t("Out gleaming")}</span>
    </div>
  );
}
