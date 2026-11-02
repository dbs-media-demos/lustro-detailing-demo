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
  alternates: { canonical: "/sr", languages: { "en-US": "/", "sr-Latn-RS": "/sr", "x-default": "/" } },
  openGraph: { title, description, url: "/sr", locale: "sr_RS" },
};

/** The concept studio in Serbian (Novi Beograd, dinars). */
export default function HomeSr() {
  return (
    <BizProvider biz={defaultBizSr}>
      <SiteChrome>
        <HomeContent />
      </SiteChrome>
      <JsonLd data={businessSchema(defaultBizSr)} />
    </BizProvider>
  );
}
