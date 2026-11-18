import type { Metadata } from "next";
import { BizProvider } from "@/components/preview/BizContext";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { HomeContent } from "@/components/home/HomeContent";
import { JsonLd } from "@/components/ui/JsonLd";
import { defaultBiz } from "@/lib/biz";
import { businessSchema } from "@/lib/schema";
import { site } from "@/lib/site";

const title = `${site.legalName} | Car Detailing & Ceramic Coating in Dallas, TX`;
const description = "Hand wash to paint correction and ceramic coating, in a lit studio in Dallas. Fixed prices by car size, most cars back the same day. Book in a minute.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/", languages: { "en-US": "/v2", "sr-Latn-RS": "/sr/v2" } },
  // the same page as / with a lighter hero: / is the one to index
  robots: { index: false, follow: true },
  openGraph: { title, description, url: "/", locale: "en_US" },
};

/** The homepage without the 3D hero: the 2D swirl check instead, zero three.js (the hero switch in HomeContent). */
export default function HomeV2() {
  return (
    <BizProvider biz={defaultBiz}>
      <SiteChrome>
        <HomeContent hero="2d" />
      </SiteChrome>
      <JsonLd data={businessSchema(defaultBiz)} />
    </BizProvider>
  );
}
