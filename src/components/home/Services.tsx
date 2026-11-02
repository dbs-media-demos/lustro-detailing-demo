"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import clsx from "clsx";
import { useBiz } from "@/components/preview/BizContext";
import { Reveal } from "@/components/ui/Reveal";
import { services, type Service } from "@/content/offer";
import { useArrive } from "@/components/ui/useArrive";
import { useT } from "@/lib/i18n";
import { isTouch, prefersReducedMotion } from "@/lib/gsap";

/**
 * The menu as a list of rows. On desktop a photo of the service floats after the cursor and
 * the row's name slides over; on phones every row carries its own thumbnail.
 */
export function Services() {
  const biz = useBiz();
  const t = useT();
  const list = services[biz.lang];
  const [active, setActive] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const float = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const f = float.current;
    if (!w || !f || isTouch()) return;
    const still = prefersReducedMotion();
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    const tick = () => {
      x += (tx - x) * (still ? 1 : 0.14);
      y += (ty - y) * (still ? 1 : 0.14);
      const tilt = still ? 0 : Math.max(-8, Math.min(8, (tx - x) * 0.05));
      f.style.transform = `translate3d(${x}px,${y}px,0) rotate(${tilt}deg)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      const r = w.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    w.addEventListener("pointermove", move);
    return () => {
      w.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="services" aria-labelledby="services-title" className="relative bg-ink px-[var(--gutter)] py-28 md:py-40">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <Reveal className="md:col-span-7">
          <p className="t-label text-volt">{t("02 — Services")}</p>
          <h2 id="services-title" className="t-display t-lg mt-5">
            {t("Everything a car needs.")} <span className="text-mist">{t("Nothing it doesn't.")}</span>
          </h2>
        </Reveal>
        <Reveal className="md:col-span-4 md:col-start-9" delay={0.1}>
          <p className="t-lead">{t("Every job starts the same way: we look at the paint together under proper light, and you get a fixed price before anything touches the car.")}</p>
        </Reveal>
      </div>

      <div ref={wrap} className="relative mt-16 md:mt-24" onPointerLeave={() => setActive(null)}>
        <ul className="border-t border-line">
          {list.map((s, i) => (
            <ServiceRow key={s.name} s={s} i={i} active={active === i} onActive={() => setActive(i)} />
          ))}
        </ul>

        <div ref={float} aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block">
          <div className={clsx("relative -ml-[9rem] -mt-[6.5rem] h-[13rem] w-[18rem] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 transition-[opacity,scale] duration-500", active === null ? "scale-90 opacity-0" : "scale-100 opacity-100")}>
            {list.map((s, i) => (
              <Image key={s.name} src={s.photo} alt="" fill sizes="288px" className={clsx("object-cover transition-opacity duration-500", active === i ? "opacity-100" : "opacity-0")} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** One service. Its name starts hazy and a microfibre pass (a bright edge) wipes it to gloss as the row arrives. */
function ServiceRow({ s, i, active, onActive }: { s: Service; i: number; active: boolean; onActive: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  useArrive(ref, "wipe-dull");
  return (
    <li ref={ref} className="border-b border-line" onPointerEnter={onActive}>
      <a href="#book" className="group grid grid-cols-[2.2rem_1fr_auto] items-center gap-x-4 gap-y-2 py-6 md:grid-cols-[4rem_1.1fr_1fr_8rem_6rem] md:gap-8 md:py-8" onFocus={onActive}>
        <span className="t-label self-start pt-1.5 text-mist md:self-center md:pt-0">{String(i + 1).padStart(2, "0")}</span>
        <span className={clsx("font-display text-[1.45rem] font-bold leading-tight tracking-[-0.02em] transition-transform duration-500 md:text-[2.1rem]", active && "md:translate-x-3")}>
          <span className="wipe-text" style={{ "--d": "0.1s" } as CSSProperties}>
            {s.name}
          </span>
        </span>
        <span className="relative row-span-2 h-16 w-16 overflow-hidden rounded-xl md:hidden">
          <Image src={s.photo} alt="" fill sizes="64px" className="object-cover" />
        </span>
        <span className="col-start-2 text-sm leading-relaxed text-mist md:col-start-auto md:text-[0.95rem]">{s.line}</span>
        <span className="col-start-2 flex gap-4 text-sm md:col-start-auto md:block md:text-right">
          <span className={clsx("font-semibold transition-colors duration-500", active && "md:text-volt")}>{s.from}</span>
          <span className="text-mist md:hidden">· {s.time}</span>
        </span>
        <span className="t-label hidden text-right text-mist md:block">{s.time}</span>
      </a>
    </li>
  );
}
