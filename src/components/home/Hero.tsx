"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import studioCar from "@/assets/photos/studio-car.jpg";
import studioCarPhone from "@/assets/photos/studio-car-phone.jpg";
import heroWork from "@/assets/photos/polish-black.jpg";
import { useBiz } from "@/components/preview/BizContext";
import { PhoneIcon } from "@/components/layout/MobileBar";
import { OpenBadge } from "@/components/ui/OpenBadge";
import { num, telOf } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";
import { isPhone, prefersReducedMotion } from "@/lib/motion";
import { after3DGate } from "@/lib/three-gate";
import type { Studio } from "@/components/fx/car3d/StudioScene";

const MODEL = "/models/lustro-car.glb?v=1";
const EMPTY = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

/**
 * Desktop: a real-time 3D studio (three.js, behind the gate in lib/three-gate). A gloss-black car
 * under a big softbox; an inspection light arch passes over it once on arrival, then scroll runs
 * the arch down the car while the camera glides along the flank, and the cursor leans the camera
 * so the reflections slide over the paint. Until then (and for anything that fails the gate:
 * tablets, reduced motion, Save-Data, no WebGL) a still rendered from the same scene sits in the
 * server HTML, framed identically, and the canvas fades in over it.
 *
 * Phones: zero bytes of three.js. A detailer at work on black paint, the service and town as the
 * headline, the rating and a Call button with the number on it. After load the photo crossfades
 * once to the phone still of the same 3D car (done within 5 s, or skipped).
 *
 * The headline, text and buttons are never animated in, on any screen.
 */
export function Hero() {
  const biz = useBiz();
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [xfade, setXfade] = useState(false);

  // The 3D studio: only after load, only past the gate, three.js fetched inside the callback.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !canvas) return;
    let studio: Studio | null = null;
    let disposed = false;
    const off: (() => void)[] = [];
    const cancel = after3DGate(async () => {
      try {
        // the model downloads alongside the chunk, not after it
        const model = fetch(MODEL).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))));
        const [{ createStudio }, buf] = await Promise.all([import("@/components/fx/car3d/StudioScene"), model]);
        if (disposed) return;
        const progress = () => Math.min(1, Math.max(0, window.scrollY / Math.max(1, section.offsetHeight)));
        studio = await createStudio(canvas, { model: buf, progress, onFirstFrame: () => setLive(true) });
        if (disposed) {
          studio.dispose();
          return;
        }
        const s = studio;
        const intro = window.setTimeout(() => s.intro(), 900);
        off.push(() => window.clearTimeout(intro));
        const onScroll = () => {
          // the stage drifts at a third of the page's speed, so the car stays a little longer
          stage.style.transform = `translate3d(0, ${Math.min(window.scrollY, section.offsetHeight) * 0.32}px, 0)`;
          s.setProgress(progress());
        };
        const onPointer = (e: PointerEvent) => s.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
        const onResize = () => s.resize();
        const io = new IntersectionObserver(([entry]) => s.setVisible(entry.isIntersecting && !document.hidden));
        const onVis = () => s.setVisible(!document.hidden && section.getBoundingClientRect().bottom > 0);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("pointermove", onPointer, { passive: true });
        window.addEventListener("resize", onResize);
        document.addEventListener("visibilitychange", onVis);
        io.observe(section);
        onScroll();
        off.push(() => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("pointermove", onPointer);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVis);
          io.disconnect();
          stage.style.transform = "";
        });
      } catch {
        // no WebGL or no model after all: the still stays
      }
    });
    return () => {
      disposed = true;
      cancel();
      off.forEach((f) => f());
      studio?.dispose();
    };
  }, []);

  // Phones: one crossfade from the detailer to the 3D car, only if the still lands in time.
  useEffect(() => {
    if (!isPhone() || prefersReducedMotion()) return;
    const go = () => {
      if (performance.now() < 2600) setXfade(true);
    };
    if (document.readyState === "complete") go();
    else {
      window.addEventListener("load", go, { once: true });
      return () => window.removeEventListener("load", go);
    }
  }, []);

  const alt = t("A gloss-black car under the lights of a dark detailing studio");
  const { props: { srcSet: wide, sizes: wideSizes } } = getImageProps({ alt, src: studioCar, sizes: "100vw", quality: 75 });
  const { props: { srcSet: work, ...img } } = getImageProps({ alt, src: heroWork, sizes: "100vw", quality: 75, loading: "eager" });
  const { props: { srcSet: carPhone } } = getImageProps({ alt: "", src: studioCarPhone, sizes: "100vw", quality: 75 });
  // Phones top out at 1080w: sharp on a 3x screen and well under 100 KB.
  const cap = (s?: string) => s?.split(", ").filter((c) => parseInt(c.split(" ")[1]) <= 1080).join(", ");
  const rating = biz.rating && (
    <>
      <span className="text-volt" aria-hidden>
        ★★★★★
      </span>
      <span>
        <strong className="font-semibold">{num(biz, biz.rating.value)}</strong>{" "}
        <span className="text-mist">· {t("{count} Google reviews", { count: biz.rating.count })}</span>
      </span>
    </>
  );

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden px-[var(--gutter)] pb-24 pt-32 md:pb-16 short:pb-20 short:pt-24 phone:min-h-0 phone:justify-start phone:pb-7 phone:pt-[calc(var(--hero-photo)-2.75rem)]"
    >
      <div ref={stageRef} className="hero-stage absolute inset-0 -z-20 will-change-transform phone:bottom-auto phone:h-[var(--hero-photo)] phone:will-change-auto">
        <picture>
          <source media="(max-width: 767.98px)" srcSet={cap(work)} sizes="100vw" />
          <source media="(hover: none)" srcSet={work} sizes="100vw" />
          <source media="(min-width: 768px)" srcSet={wide} sizes={wideSizes} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
          <img {...img} className="hero-still h-full w-full object-cover object-[60%_50%] phone:object-[50%_14%]" fetchPriority="high" />
        </picture>
        {/* phones: the same car the desktop renders live, crossfading in once over the detailer */}
        {xfade && (
          <picture>
            <source media="(max-width: 767.98px), (hover: none)" srcSet={cap(carPhone)} sizes="100vw" />
            <img
              src={EMPTY}
              alt=""
              decoding="async"
              className="hero-xfade absolute inset-0 h-full w-full object-cover object-[50%_42%]"
              onLoad={(e) => e.currentTarget.currentSrc !== EMPTY && performance.now() < 3600 && e.currentTarget.classList.add("is-in")}
            />
          </picture>
        )}
        <canvas ref={canvasRef} aria-hidden className={`absolute inset-0 h-full w-full transition-opacity duration-700 phone:hidden ${live ? "opacity-100" : "opacity-0"}`} />
      </div>
      {/* the light band sweeping over the still, until the live scene takes over */}
      <div aria-hidden className={`hero-sweep absolute inset-0 -z-10 transition-opacity duration-700 phone:hidden ${live ? "opacity-0" : ""}`} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,8,10,0.92)_0%,rgba(7,8,10,0.7)_30%,rgba(7,8,10,0)_52%),linear-gradient(0deg,rgba(7,8,10,0.9)_0%,rgba(7,8,10,0)_34%)] phone:bottom-auto phone:h-[var(--hero-photo)] phone:bg-[linear-gradient(180deg,rgba(7,8,10,0.6)_0%,rgba(7,8,10,0.05)_30%,rgba(7,8,10,0.1)_55%,rgba(7,8,10,1)_100%)]" />

      <div className="max-w-[80rem] phone:flex phone:flex-col">
        <p className="t-label flex flex-wrap items-center gap-x-3 gap-y-2 text-mist">
          <span className="inline-block h-px w-8 bg-volt" aria-hidden />
          <span>{t("Detail studio")}</span>
          <span aria-hidden>·</span>
          <span data-no-translate>{biz.area}</span>
        </p>
        <h1 id="hero-title" className="t-display t-xl mt-6 max-w-[10.5em] short:mt-4 phone:mt-2.5 phone:max-w-none">
          <span className="hidden phone:block" data-no-translate>
            {biz.area ? t("Car detailing in {area}.", { area: biz.area }) : t("Car detailing.")}
          </span>
          <span className="phone:hidden">
            {biz.tagline ? (
              <span className="block">{biz.tagline}</span>
            ) : (
              <>
                <span className="block">{t("Like it just")}</span>
                <span className="t-gloss block pb-[0.08em]">{t("left the showroom.")}</span>
              </>
            )}
          </span>
        </h1>
        <p className="mt-1.5 hidden font-display text-[1.02rem] font-bold leading-snug tracking-[-0.01em] text-mist phone:block">{biz.tagline ?? `${t("Like it just")} ${t("left the showroom.")}`}</p>
        {rating && <p className="mt-3 hidden items-center gap-2 text-sm phone:flex">{rating}</p>}
        <div className="mt-4 hidden phone:block">
          {biz.phone ? (
            <a href={telOf(biz)} className="btn btn-volt w-full tabular-nums" data-no-translate>
              <PhoneIcon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              {t("Call")} {biz.phoneDisplay}
            </a>
          ) : (
            <a href="#book" className="btn btn-volt w-full">
              {t("Book a detail")}
              <Arrow />
            </a>
          )}
        </div>
        <div className="mt-3 hidden h-5 phone:block">
          <OpenBadge className="whitespace-nowrap text-[0.82rem] text-mist" />
        </div>
        <p className="t-lead mt-7 max-w-xl short:mt-5 phone:order-1 phone:mt-3.5">
          {t("Hand wash to paint correction and ceramic coating, in a lit studio in {area}. Fixed prices by car size, and most cars go home the same day.", { area: biz.area })}
        </p>
        <div className="mt-9 flex flex-wrap gap-3 short:mt-7 phone:hidden">
          <a href="#book" className="btn btn-volt">
            {t("Book a detail")}
            <Arrow />
          </a>
          {biz.phone ? (
            <a href={telOf(biz)} className="btn btn-ghost tabular-nums" data-no-translate>
              <PhoneIcon className="h-4 w-4 shrink-0" />
              {biz.phoneDisplay}
            </a>
          ) : (
            <a href="#packages" className="btn btn-ghost">
              {t("See prices")}
            </a>
          )}
        </div>
        <a href="#packages" className="order-2 mt-2 hidden min-h-9 items-center gap-2 self-start text-sm font-semibold text-pearl phone:inline-flex">
          {t("See prices")}
          <Arrow />
        </a>
      </div>

      <div className="anim-fade mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6 text-sm short:mt-8 short:pt-5 phone:hidden" style={{ "--d": "0.4s" } as CSSProperties}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {rating && <p className="flex items-center gap-2">{rating}</p>}
          <OpenBadge className="text-mist" />
        </div>
        <dl className="t-label hidden gap-8 text-[0.66rem] text-mist md:flex">
          <div>
            <dt>{t("Gloss after")}</dt>
            <dd className="mt-1 text-sm text-pearl">96 GU</dd>
          </div>
          <div>
            <dt>{t("Coating")}</dt>
            <dd className="mt-1 text-sm text-pearl">{t("5 years")}</dd>
          </div>
          <div>
            <dt>{t("Cars a day")}</dt>
            <dd className="mt-1 text-sm text-pearl">{t("Six, max")}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
