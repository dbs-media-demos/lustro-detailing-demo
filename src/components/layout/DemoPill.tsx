"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { agencyName, agencyUrl } from "@/lib/site";
import { useBiz } from "@/components/preview/BizContext";

const KEY = "lustro-demo-pill-dismissed";

/** Small fixed pill that marks the site as a Scale by Noon concept. Dismissible for the session. */
export function DemoPill() {
  const biz = useBiz();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(KEY) === "1";
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is client-only
    if (!dismissed) setShow(true);
  }, []);
  if (!show) return null;
  const sr = biz.lang === "sr";
  return (
    <div
      className="anim-fade fixed bottom-[5.3rem] left-3 z-[66] flex items-center rounded-full border border-line-strong bg-carbon/90 pl-3.5 text-[0.72rem] text-pearl shadow-lg backdrop-blur md:bottom-4 md:left-4 md:pl-4 md:text-[0.78rem]"
      style={{ "--d": "2.5s" } as CSSProperties}
      data-no-translate
    >
      <a href={agencyUrl} className="inline-flex min-h-10 items-center gap-1.5 pr-1 hover:text-volt">
        <span className="inline-block max-w-[15rem] truncate align-bottom sm:max-w-none">
          {biz.preview ? (sr ? `Pregled za ${biz.shortName} · ` : `Preview for ${biz.shortName} · by `) : sr ? "Koncept sajt · " : "Concept site by "}
          <strong className="font-semibold">{agencyName}</strong> <span aria-hidden>↗</span>
        </span>
      </a>
      <button
        type="button"
        onClick={() => {
          setShow(false);
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {}
        }}
        aria-label={sr ? "Zatvori obaveštenje" : "Dismiss concept site notice"}
        className="flex h-10 w-10 items-center justify-center rounded-full text-pearl/70 hover:text-pearl"
      >
        <span aria-hidden className="text-base leading-none">
          ×
        </span>
      </button>
    </div>
  );
}
