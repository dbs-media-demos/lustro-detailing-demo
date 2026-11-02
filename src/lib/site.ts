/**
 * Lustro Detail Studio: the fictional business behind the concept site. English pages put it in
 * Dallas; the Serbian concept page (/sr) puts the same studio in Novi Beograd. Both addresses,
 * phones and emails are invented.
 */
export const site = {
  name: "Lustro",
  legalName: "Lustro Detail Studio",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lustro-detailing-demo.vercel.app").replace(/\/$/, ""),
  email: "hello@lustrodetail.com",
  rating: { value: 4.9, count: 312 },
  us: {
    area: "Dallas",
    phone: "+12145550163",
    phoneDisplay: "(214) 555-0163",
    address: { street: "4180 Halcyon Row", city: "Dallas", region: "TX", postal: "75207" },
    timezone: "America/Chicago",
    // 0 = Sunday
    hours: [
      { day: 0, open: null, close: null },
      { day: 1, open: "08:00", close: "19:00" },
      { day: 2, open: "08:00", close: "19:00" },
      { day: 3, open: "08:00", close: "19:00" },
      { day: 4, open: "08:00", close: "19:00" },
      { day: 5, open: "08:00", close: "19:00" },
      { day: 6, open: "09:00", close: "17:00" },
    ],
    hoursSummary: "Mon–Fri 8–7 · Sat 9–5",
  },
  rs: {
    area: "Novi Beograd",
    phone: "+381110000000",
    phoneDisplay: "+381 11 000 0000",
    address: { street: "Svetlosna 7", city: "Novi Beograd", region: "", postal: "11070" },
    timezone: "Europe/Belgrade",
    hours: [
      { day: 0, open: null, close: null },
      { day: 1, open: "08:00", close: "20:00" },
      { day: 2, open: "08:00", close: "20:00" },
      { day: 3, open: "08:00", close: "20:00" },
      { day: 4, open: "08:00", close: "20:00" },
      { day: 5, open: "08:00", close: "20:00" },
      { day: 6, open: "09:00", close: "16:00" },
    ],
    hoursSummary: "Pon–Pet 8–20 · Sub 9–16",
  },
} as const;

export const agencyName = "Scale by Noon";
export const agencyUrl = "https://www.scalebynoon.com";

/** Demos stay out of search engines unless NEXT_PUBLIC_NOINDEX=false. */
export const noindex = process.env.NEXT_PUBLIC_NOINDEX !== "false";
