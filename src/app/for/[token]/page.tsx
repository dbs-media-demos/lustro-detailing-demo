import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";
import { previewBiz } from "@/lib/preview";
import { L } from "@/lib/biz-core";

// Always the CRM's current data: an edit there shows on the next reload
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const biz = await previewBiz((await params).token);
  const robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  if (!biz) return { title: "Preview not found", robots };
  const place = [biz.address.city || biz.area, biz.address.region].filter(Boolean).join(", ");
  const title = L(biz, `${biz.name} | Car Detailing & Ceramic Coating in ${place || biz.area}`, `${biz.name} | Auto detailing i keramika, ${place || biz.area}`);
  const description = L(
    biz,
    `Hand wash, interior detailing, paint correction and ceramic coating in ${biz.area}. Fixed prices by car size. Call ${biz.phoneDisplay || "us"} or book online.`,
    `Ručno pranje, dubinsko čišćenje enterijera, poliranje i keramička zaštita — ${biz.area}. Fiksne cene po veličini auta. Pozovite ${biz.phoneDisplay || "nas"} ili zakažite onlajn.`,
  );
  return {
    title: { absolute: title },
    description,
    robots,
    alternates: { canonical: null },
    openGraph: { type: "website", siteName: biz.name, title, description, images: [] },
    twitter: { card: "summary", title, description },
  };
}

export default async function PreviewPage({ params }: Props) {
  const biz = await previewBiz((await params).token);
  if (!biz) notFound();
  return <HomeContent />;
}
