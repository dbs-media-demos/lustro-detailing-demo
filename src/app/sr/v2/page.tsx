import type { Metadata } from "next";
import { BizProvider } from "@/components/preview/BizContext";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { HomeContent } from "@/components/home/HomeContent";
import { JsonLd } from "@/components/ui/JsonLd";
import { defaultBizSr } from "@/lib/biz";
import { businessSchema } from "@/lib/schema";
import { site } from "@/lib/site";

const title = `${site.legalName} | Auto detailing, poliranje i keramika, Novi Beograd`;
const description = "Od ručnog pranja do poliranja i keramičke zaštite, u osvetljenom studiju na Novom Beogradu. Fiksne cene po veličini auta, većina automobila gotova istog dana.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/sr", languages: { "en-US": "/v2", "sr-Latn-RS": "/sr/v2" } },
  // the same page as /sr with a lighter hero: /sr is the one to index
  robots: { index: false, follow: true },
  openGraph: { title, description, url: "/sr", locale: "sr_RS" },
};

/** The Serbian concept without the 3D hero (see /v2). */
export default function HomeSrV2() {
  return (
    <BizProvider biz={defaultBizSr}>
      <SiteChrome>
        <HomeContent hero="2d" />
      </SiteChrome>
      <JsonLd data={businessSchema(defaultBizSr)} />
    </BizProvider>
  );
}
