import type { Biz } from "./biz-core";
import { site } from "./site";

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** AutoWash (schema.org's detailing / car-care business) with hours, area and rating. */
export function businessSchema(biz: Biz) {
  const url = biz.lang === "sr" ? `${site.url}/sr` : site.url;
  return {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    "@id": `${url}#business`,
    name: biz.name,
    url,
    telephone: biz.phone,
    email: site.email,
    image: `${site.url}/opengraph-image`,
    priceRange: biz.lang === "sr" ? "RSD" : "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: biz.address.street,
      addressLocality: biz.address.city,
      addressRegion: biz.address.region || undefined,
      postalCode: biz.address.postal,
      addressCountry: biz.lang === "sr" ? "RS" : "US",
    },
    areaServed: biz.area,
    openingHoursSpecification: (biz.hours ?? [])
      .filter((h) => h.open && h.close)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${DAY[h.day]}`, opens: h.open, closes: h.close })),
    aggregateRating: biz.rating ? { "@type": "AggregateRating", ratingValue: biz.rating.value, reviewCount: biz.rating.count } : undefined,
    makesOffer: ["Hand wash", "Interior detailing", "Paint correction", "Ceramic coating", "Paint protection film", "Headlight restoration"].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  };
}
