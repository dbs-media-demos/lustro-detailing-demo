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
  alternates: { canonical: "/", languages: { "en-US": "/", "sr-Latn-RS": "/sr", "x-default": "/" } },
  openGraph: { title, description, url: "/", locale: "en_US" },
};

export default function Home() {
  return (
    <BizProvider biz={defaultBiz}>
      <SiteChrome>
        <HomeContent />
      </SiteChrome>
      <JsonLd data={businessSchema(defaultBiz)} />
    </BizProvider>
  );
}
