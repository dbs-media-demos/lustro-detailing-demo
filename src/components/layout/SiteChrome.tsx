"use client";

import { useEffect, type ReactNode } from "react";
import { useBiz } from "@/components/preview/BizContext";
import { NearScreen } from "@/components/ui/NearScreen";
import { useT } from "@/lib/i18n";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBar } from "./MobileBar";
import { DemoPill } from "./DemoPill";

/** Header, the page, footer, the phone bar and the demo pill, in the business's language. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const biz = useBiz();
  const t = useT();
  useEffect(() => {
    // Only when it differs: even the same value makes the browser restyle the whole page.
    const lang = biz.lang === "sr" ? "sr-Latn" : "en-US";
    if (document.documentElement.lang !== lang) document.documentElement.lang = lang;
  }, [biz.lang]);
  return (
    <>
      <a href="#main" className="btn btn-volt fixed left-3 top-3 z-[300] -translate-y-24 focus:translate-y-0">
        {t("Skip to content")}
      </a>
      <Header />
      <main id="main" className="phone:flex phone:flex-col">{children}</main>
      <NearScreen height={556}>
        <Footer />
      </NearScreen>
      <MobileBar />
      <DemoPill />
    </>
  );
}
