"use client";

import { useBiz } from "@/components/preview/BizContext";
import { telOf } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";

/** Thumb-reach Call + Book bar on phones, with the number on the button. Opaque: nothing shows through. */
export function MobileBar() {
  const biz = useBiz();
  const t = useT();
  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] hidden grid-cols-[1.12fr_1fr] gap-2 border-t border-line bg-ink p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] phone:grid">
      {biz.phone ? (
        <a href={telOf(biz)} aria-label={t("Call {phone}", { phone: biz.phoneDisplay })} className="btn btn-ghost min-h-12 w-full gap-2 px-2 text-[0.84rem] tabular-nums" data-no-translate>
          <PhoneIcon className="h-4 w-4 shrink-0" />
          {biz.phoneDisplay}
        </a>
      ) : (
        <a href="#visit" className="btn btn-ghost min-h-12 w-full">
          {t("Visit")}
        </a>
      )}
      <a href="#book" className="btn btn-volt min-h-12 w-full px-2 text-[0.84rem]">
        {t("Book a detail")}
      </a>
    </div>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 3.5h3.2l1.6 4.3-2 1.4a12 12 0 0 0 7 7l1.4-2 4.3 1.6V19a1.8 1.8 0 0 1-1.9 1.8A16.5 16.5 0 0 1 3.2 5.4 1.8 1.8 0 0 1 5 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}
