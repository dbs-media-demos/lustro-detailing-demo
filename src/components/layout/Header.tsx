"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Logo } from "@/components/brand/Logo";
import { useBiz } from "@/components/preview/BizContext";
import { telOf } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";
import { NAV } from "./nav";

/** Transparent over the hero, smoked glass once the page scrolls (opaque on phones). Phones get a full-screen menu. */
export function Header() {
  const biz = useBiz();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const home = biz.preview ? "#top" : biz.lang === "sr" ? "/sr" : "/";

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-[70] border-b transition-[background-color,backdrop-filter,border-color] duration-500 phone:duration-150",
        scrolled || open ? "border-line bg-ink/70 backdrop-blur-xl phone:bg-ink phone:backdrop-blur-none" : "border-transparent",
      )}
    >
      <div className="flex h-[var(--header-h)] items-center justify-between gap-4 px-[var(--gutter)]">
        <a href={home} className="relative z-10 min-w-0" aria-label={`${biz.shortName}, ${t("home")}`} data-no-translate>
          <Logo name={biz.shortName} sub={biz.preview ? undefined : "Detail Studio"} className="block truncate" />
        </a>

        <nav aria-label={t("Main")} className="hidden lg:block">
          <ul className="flex items-center gap-8 text-sm text-pearl/80">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="transition-colors hover:text-volt">
                  {t(n.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
          {!biz.preview && (
            <div className="t-label hidden items-center rounded-full border border-line p-1 text-[0.65rem] sm:flex" role="group" aria-label={t("Language")}>
              <Link href="/" hrefLang="en" aria-current={biz.lang === "en" ? "true" : undefined} className={clsx("rounded-full px-2.5 py-1.5", biz.lang === "en" ? "bg-pearl text-ink" : "text-mist hover:text-pearl")}>
                EN
              </Link>
              <Link href="/sr" hrefLang="sr" aria-current={biz.lang === "sr" ? "true" : undefined} className={clsx("rounded-full px-2.5 py-1.5", biz.lang === "sr" ? "bg-pearl text-ink" : "text-mist hover:text-pearl")}>
                SR
              </Link>
            </div>
          )}
          {biz.phone && (
            <a href={telOf(biz)} className="hidden text-sm font-semibold tabular-nums xl:block" data-no-translate>
              {biz.phoneDisplay}
            </a>
          )}
          <a href="#book" className="btn btn-volt hidden min-h-11 px-5 text-sm sm:inline-flex">
            {t("Book a detail")}
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu"
            aria-label={open ? t("Close menu") : t("Open menu")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong lg:hidden"
          >
            <span aria-hidden className="relative block h-3 w-5">
              <span className={clsx("absolute left-0 h-[1.5px] w-5 bg-pearl transition-all duration-500", open ? "top-1.5 rotate-45" : "top-0")} />
              <span className={clsx("absolute left-0 h-[1.5px] w-5 bg-pearl transition-all duration-500", open ? "top-1.5 -rotate-45" : "top-3")} />
            </span>
          </button>
        </div>
      </div>

      <div id="menu" hidden={!open} className="fixed inset-x-0 bottom-0 top-[var(--header-h)] overflow-y-auto bg-ink px-[var(--gutter)] pb-10 pt-8 lg:hidden">
        <ul className="space-y-1">
          {NAV.map((n, i) => (
            <li key={n.href} className="anim-rise" style={{ "--d": `${0.04 * i}s` } as CSSProperties}>
              <a href={n.href} onClick={() => setOpen(false)} className="t-display block py-2 text-[2.6rem]">
                {t(n.label)}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#book" onClick={() => setOpen(false)} className="btn btn-volt">
            {t("Book a detail")}
          </a>
          {biz.phone && (
            <a href={telOf(biz)} className="btn btn-ghost" data-no-translate>
              {biz.phoneDisplay}
            </a>
          )}
        </div>
        {!biz.preview && (
          <p className="t-label mt-10 flex gap-6 text-mist">
            <Link href="/" hrefLang="en" className={biz.lang === "en" ? "text-pearl" : ""}>
              English
            </Link>
            <Link href="/sr" hrefLang="sr" className={biz.lang === "sr" ? "text-pearl" : ""}>
              Srpski
            </Link>
          </p>
        )}
      </div>
    </header>
  );
}
