"use client";

import { LogoMark } from "@/components/brand/Logo";
import { useBiz } from "@/components/preview/BizContext";
import { areasOf, telOf } from "@/lib/biz-core";
import { inlineLogo } from "@/lib/logo";
import { useT } from "@/lib/i18n";
import { agencyName, agencyUrl, site } from "@/lib/site";
import { NAV } from "./nav";

export function Footer() {
  const biz = useBiz();
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink px-[var(--gutter)] pb-28 pt-20 md:pb-10 phone:pb-24 phone:pt-10">
      <div className="grid gap-12 md:grid-cols-12 phone:gap-7">
        <div className="md:col-span-5">
          {biz.logo ? (
            <p className="flex" data-no-translate>
              <span role="img" aria-label={biz.name} className="biz-logo h-12 max-w-[20rem] text-pearl phone:h-10" dangerouslySetInnerHTML={{ __html: inlineLogo(biz.logo.svg) }} />
            </p>
          ) : (
            <p className="flex items-center gap-3" data-no-translate>
              <LogoMark className="h-10 w-10 text-pearl" />
              <span className="font-display text-2xl font-extrabold tracking-tight">{biz.name}</span>
            </p>
          )}
          <p className="mt-5 max-w-sm text-mist phone:mt-3 phone:text-sm">{t("Detailing, paint correction and ceramic coating. One car at a time, under proper light.")}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm max-sm:grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-3 md:col-span-7">
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
            {biz.preview && areasOf(biz).length > 0 && (
              <p className="mt-4 text-mist">
                {t("Cars come in from")} <span data-no-translate>{areasOf(biz).join(" · ")}</span>
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

      <p aria-hidden className="t-display pointer-events-none mt-16 select-none whitespace-nowrap text-[22vw] leading-[0.8] text-pearl/[0.04] phone:hidden" data-no-translate>
        {biz.shortName}
      </p>

      <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-mist sm:flex-row sm:justify-between">
        <p data-no-translate>
          © {year} {biz.name}
        </p>
        {/* the hero car's licence (CC BY 4.0) asks for this line */}
        <p>
          {t("3D car:")}{" "}
          <a href="https://sketchfab.com/3d-models/free-1975-porsche-911-930-turbo-8568d9d14a994b9cae59499f0dbed21e" className="hover:text-pearl" rel="noopener" target="_blank" data-no-translate>
            1975 Porsche 911 (930) Turbo, Karol Miklas
          </a>
          ,{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" className="hover:text-pearl" rel="noopener license" target="_blank" data-no-translate>
            CC BY 4.0
          </a>
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
