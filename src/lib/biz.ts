import { site } from "./site";
import type { Biz, DayHours } from "./biz-core";

export type { Biz } from "./biz-core";

function conceptBiz(lang: "en" | "sr"): Biz {
  const s = lang === "sr" ? site.rs : site.us;
  const a = s.address;
  const full = lang === "sr" ? `${a.street}, ${a.postal} ${a.city}` : `${a.street}, ${a.city}, ${a.region} ${a.postal}`;
  return {
    lang,
    name: site.legalName,
    shortName: site.name,
    tagline: null,
    area: s.area,
    phone: s.phone,
    phoneDisplay: s.phoneDisplay,
    address: { ...a, full },
    timezone: s.timezone,
    hours: s.hours.map((h): DayHours => ({ ...h })),
    hoursSummary: s.hoursSummary,
    rating: { ...site.rating },
    preview: false,
  };
}

/** The fictional studio as a Biz: what the concept site shows (previews swap in a real one). */
export const defaultBiz = conceptBiz("en");
/** The same studio in Novi Beograd, for the Serbian concept page (/sr). */
export const defaultBizSr = conceptBiz("sr");
