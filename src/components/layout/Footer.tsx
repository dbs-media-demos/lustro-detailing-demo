"use client";

import { LogoMark } from "@/components/brand/Logo";
import { useBiz } from "@/components/preview/BizContext";
import { telOf } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";
import { agencyName, agencyUrl, site } from "@/lib/site";
import { NAV } from "./nav";

export function Footer() {
  const biz = useBiz();
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink px-[var(--gutter)] pb-28 pt-20 md:pb-10">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="flex items-center gap-3" data-no-translate>
            <LogoMark className="h-10 w-10 text-pearl" />
            <span className="font-display text-2xl font-extrabold tracking-tight">{biz.name}</span>
          </p>
          <p className="mt-5 max-w-sm text-mist">{t("Detailing, paint correction and ceramic coating. One car at a time, under proper light.")}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:col-span-7">
          <div>
            <p className="t-label text-mist">{t("Visit")}</p>
            {biz.address.full && (
              <address className="mt-4 not-italic leading-relaxed" data-no-translate>
                {biz.address.full}
              </address>
            )}
            {biz.hoursSummary && (
              <p className="mt-2 text-mist" data-no-translate>
                {biz.hoursSummary}
              </p>
            )}
          </div>
          <div>
            <p className="t-label text-mist">{t("Contact")}</p>
            <ul className="mt-4 space-y-2" data-no-translate>
              {biz.phone && (
                <li>
                  <a href={telOf(biz)} className="hover:text-volt">
                    {biz.phoneDisplay}
                  </a>
                </li>
              )}
              {!biz.preview && (
                <li>
                  <a href={`mailto:${site.email}`} className="hover:text-volt">
                    {site.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="t-label text-mist">{t("On this page")}</p>
            <ul className="mt-4 space-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-volt">
                    {t(n.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p aria-hidden className="t-display pointer-events-none mt-16 select-none whitespace-nowrap text-[22vw] leading-[0.8] text-pearl/[0.04]" data-no-translate>
        {biz.shortName}
      </p>

      <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-mist sm:flex-row sm:justify-between">
        <p data-no-translate>
          © {year} {biz.name}
        </p>
        <p>
          {t("Design & development:")}{" "}
          <a href={agencyUrl} className="text-pearl hover:text-volt" data-no-translate>
            {agencyName}
          </a>
        </p>
      </div>
    </footer>
  );
}
