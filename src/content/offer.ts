import type { StaticImageData } from "next/image";
import type { Lang } from "@/lib/biz-core";
import foamGt3 from "@/assets/photos/foam-gt3.jpg";
import interiorBrush from "@/assets/photos/interior-brush.jpg";
import polishBlack from "@/assets/photos/polish-black.jpg";
import beadsHood from "@/assets/photos/beads-hood.jpg";
import mirrorGloss from "@/assets/photos/mirror-gloss.jpg";
import tireBrush from "@/assets/photos/tire-brush.jpg";
import headlightHalo from "@/assets/photos/headlight-halo.jpg";
import interiorQuilted from "@/assets/photos/interior-quilted.jpg";

/**
 * What the studio sells. Lists are written per language (US dollars for English pages, dinars
 * for Serbian ones); short UI strings go through i18n/sr instead.
 */
type ByLang<T> = Record<Lang, T>;

export type Service = { name: string; line: string; from: string; time: string; photo: StaticImageData; alt: string };

const photos = [foamGt3, interiorBrush, polishBlack, beadsHood, mirrorGloss, tireBrush, headlightHalo, interiorQuilted];

const en: Omit<Service, "photo">[] = [
  { name: "Hand wash & decon", line: "Snow foam, two-bucket hand wash, iron remover and clay. Smooth as glass to the touch.", from: "from $79", time: "1.5 h", alt: "Snow foam sliding off a black sports car in the studio" },
  { name: "Interior deep clean", line: "Steam, hot-water extraction, leather cleaned and fed, every vent and seam brushed out.", from: "from $189", time: "4 h", alt: "A gloved hand brushing a dashboard clean" },
  { name: "Paint correction", line: "Machine polishing that removes swirls and light scratches instead of hiding them under wax.", from: "from $449", time: "1–2 days", alt: "Polishing black paint under studio light strips" },
  { name: "Ceramic coating", line: "A hard, glassy layer that holds the gloss for years and makes every wash take minutes.", from: "from $799", time: "1–2 days", alt: "Water beading on a coated dark blue hood" },
  { name: "Paint protection film", line: "Clear film on the hood, bumper and mirrors that takes the stone chips so the paint doesn't.", from: "from $1,450", time: "2 days", alt: "A glossy black mirror and door reflecting the studio" },
  { name: "Wheels & tires", line: "Barrels, faces and calipers deep cleaned, tires dressed satin, wheels coated if you like.", from: "from $69", time: "1 h", alt: "A gloved hand cleaning a tire with a soft brush" },
  { name: "Headlight restoration", line: "Yellow, cloudy lenses wet-sanded, polished and sealed so they stay clear.", from: "from $89", time: "1 h", alt: "Bright, clear headlights on a dark car" },
  { name: "Odor & pet hair", line: "Ozone for smoke and damp smells, and every last dog hair out of the carpet.", from: "from $59", time: "1–2 h", alt: "Clean black quilted leather seats" },
];

const sr: Omit<Service, "photo">[] = [
  { name: "Ručno pranje i dekontaminacija", line: "Aktivna pena, pranje iz dve kante, uklanjanje gvozdenih čestica i glina. Lak postaje gladak kao staklo.", from: "od 2.500 din", time: "1,5 h", alt: "Aktivna pena se sliva niz crni sportski automobil u studiju" },
  { name: "Dubinsko čišćenje enterijera", line: "Para, dubinsko pranje sedišta, koža očišćena i negovana, svaki ventilacioni otvor i šav iščetkan.", from: "od 7.000 din", time: "4 h", alt: "Ruka u rukavici četkom čisti instrument tablu" },
  { name: "Poliranje laka", line: "Mašinsko poliranje koje uklanja ogrebotine i „paukove mreže”, umesto da ih prikrije voskom.", from: "od 18.000 din", time: "1–2 dana", alt: "Poliranje crnog laka pod svetlima studija" },
  { name: "Keramička zaštita", line: "Tvrd, staklast sloj koji godinama čuva sjaj, a svako pranje svodi na par minuta.", from: "od 35.000 din", time: "1–2 dana", alt: "Kapi vode na tamnoplavoj haubi sa keramikom" },
  { name: "Zaštitna PPF folija", line: "Providna folija na haubi, braniku i retrovizorima koja prima udarce kamenčića umesto laka.", from: "od 90.000 din", time: "2 dana", alt: "Sjajni crni retrovizor i vrata u kojima se ogleda studio" },
  { name: "Felne i gume", line: "Felne, kočione čeljusti i unutrašnji deo felne dubinski očišćeni, gume negovane, felne zaštićene po želji.", from: "od 2.500 din", time: "1 h", alt: "Ruka u rukavici mekom četkom čisti gumu" },
  { name: "Poliranje farova", line: "Požuteli, zamućeni farovi brušeni, ispolirani i zaštićeni da ostanu providni.", from: "od 3.500 din", time: "1 h", alt: "Jarka, providna prednja svetla na tamnom automobilu" },
  { name: "Neprijatni mirisi i dlake", line: "Ozon za miris dima i vlage, i svaka dlaka ljubimca izvučena iz tepiha.", from: "od 2.000 din", time: "1–2 h", alt: "Čista crna prošivena kožna sedišta" },
];

export const services: ByLang<Service[]> = {
  en: en.map((s, i) => ({ ...s, photo: photos[i] })),
  sr: sr.map((s, i) => ({ ...s, photo: photos[i] })),
};

/** Car sizes for the price toggle (index matches each package's price list). */
export const sizes: ByLang<string[]> = {
  en: ["Car", "SUV", "Truck / 3-row"],
  sr: ["Limuzina / hečbek", "SUV / karavan", "Kombi / pikap"],
};

export type Package = { name: string; tag?: string; time: string; prices: string[]; includes: string[] };

export const packages: ByLang<Package[]> = {
  en: [
    {
      name: "Refresh",
      time: "about 2 h",
      prices: ["$129", "$149", "$179"],
      includes: ["Snow foam & two-bucket hand wash", "Wheels, tires and arches", "Interior vacuum & wipe-down", "Glass inside and out", "Spray sealant (about a month)"],
    },
    {
      name: "Signature",
      tag: "Most booked",
      time: "about 5 h",
      prices: ["$289", "$339", "$389"],
      includes: ["Everything in Refresh", "Iron remover and clay bar", "Steam & extraction on seats and carpets", "Leather cleaned and conditioned", "Paint sealant that lasts 6 months"],
    },
    {
      name: "Correct & Coat",
      time: "2 days",
      prices: ["$1,190", "$1,390", "$1,590"],
      includes: ["Everything in Signature", "One-step paint correction", "5-year ceramic coating on the paint", "Wheels and glass coated", "A free check-up wash after a month"],
    },
  ],
  sr: [
    {
      name: "Osveženje",
      time: "oko 2 h",
      prices: ["3.500 din", "4.000 din", "5.000 din"],
      includes: ["Aktivna pena i ručno pranje iz dve kante", "Felne, gume i blatobrani", "Usisavanje i brisanje enterijera", "Stakla spolja i iznutra", "Brza zaštita laka (oko mesec dana)"],
    },
    {
      name: "Kompletan detailing",
      tag: "Najčešći izbor",
      time: "oko 5 h",
      prices: ["12.000 din", "14.000 din", "16.000 din"],
      includes: ["Sve iz paketa Osveženje", "Uklanjanje gvozdenih čestica i glina", "Dubinsko pranje sedišta i tepiha", "Koža očišćena i negovana", "Zaštita laka koja traje 6 meseci"],
    },
    {
      name: "Poliranje + keramika",
      time: "2 dana",
      prices: ["60.000 din", "70.000 din", "80.000 din"],
      includes: ["Sve iz Kompletnog detailinga", "Jednostepeno poliranje laka", "Keramička zaštita laka na 5 godina", "Zaštita felni i stakala", "Besplatno kontrolno pranje posle mesec dana"],
    },
  ],
};

export const addOns: ByLang<{ name: string; price: string }[]> = {
  en: [
    { name: "Headlight restoration", price: "$89" },
    { name: "Engine bay", price: "$79" },
    { name: "Ozone treatment", price: "$99" },
    { name: "Pet hair", price: "$49" },
    { name: "Glass coating", price: "$69" },
  ],
  sr: [
    { name: "Poliranje farova", price: "3.500 din" },
    { name: "Pranje motora", price: "2.500 din" },
    { name: "Ozonski tretman", price: "2.500 din" },
    { name: "Dlake ljubimaca", price: "2.000 din" },
    { name: "Keramika na staklima", price: "3.000 din" },
  ],
};

/** Sample reviews (marked as samples on the page): first name + initial, the car, the job. */
export const reviews: ByLang<{ name: string; car: string; text: string; when: string }[]> = {
  en: [
    { name: "Marcus T.", car: "2021 Tahoe", when: "2 weeks ago", text: "Three kids and a golden retriever had destroyed the third row. It came back smelling new, and they found two lost AirPods while they were at it." },
    { name: "Priya S.", car: "Model 3, Midnight Silver", when: "1 month ago", text: "They showed me the swirls under their lights before quoting, then again after the correction. Night and day. Rain just runs off it now." },
    { name: "Jordan K.", car: "F-150 Lariat", when: "3 weeks ago", text: "Booked the Signature at 7 am, had the truck back by lunch. Fixed price on the website was exactly what I paid." },
    { name: "Elena R.", car: "2016 Lexus RX", when: "2 months ago", text: "My headlights were so yellow I thought I needed new ones. Eighty-nine dollars later they look factory fresh." },
    { name: "Chris D.", car: "BMW M240i", when: "1 week ago", text: "Five-year coating plus film on the front. Six months in, a rinse at home is all it needs. Worth every cent." },
    { name: "Dana W.", car: "Honda Odyssey", when: "5 days ago", text: "Spilled a whole smoothie in the back. They got it out of the carpet and the seat belts, and they texted me photos as they went." },
  ],
  sr: [
    { name: "Marko P.", car: "Škoda Octavia karavan", when: "pre 2 nedelje", text: "Dvoje dece i pas su uništili zadnja sedišta. Auto je vraćen kao nov, bez mirisa, i još su našli izgubljene slušalice." },
    { name: "Jelena S.", car: "Audi A4, metalik siva", when: "pre mesec dana", text: "Pod njihovim svetlima su mi pokazali sve ogrebotine pre ponude, pa opet posle poliranja. Razlika je ogromna, kiša se sad samo sliva." },
    { name: "Nikola R.", car: "VW Golf 7", when: "pre 3 nedelje", text: "Doneo sam auto u 8, pokupio u podne. Cena sa sajta je bila tačno ona koju sam platio." },
    { name: "Ana M.", car: "Toyota RAV4", when: "pre 2 meseca", text: "Farovi su bili toliko žuti da sam mislila da moram da kupim nove. Posle poliranja izgledaju kao iz fabrike." },
    { name: "Stefan J.", car: "BMW serija 3", when: "pre nedelju dana", text: "Keramika na 5 godina i folija na prednjem delu. Posle šest meseci dovoljno je samo da ga isperem. Vredi svakog dinara." },
    { name: "Milica D.", car: "Peugeot 3008", when: "pre 5 dana", text: "Prosuo mi se ceo sok pozadi. Izvukli su ga iz tepiha i pojaseva, i slali su mi slike dok su radili." },
  ],
};

export const faq: ByLang<{ q: string; a: string }[]> = {
  en: [
    { q: "How long will my car be with you?", a: "A Refresh takes about two hours and the Signature about five, so most cars go home the same day. Paint correction and ceramic coating need two days: the coating has to cure indoors overnight." },
    { q: "Can I wait while you work?", a: "For a Refresh, yes: there's a lounge with coffee and Wi-Fi. For anything longer we'll drop you nearby or text you when it's ready." },
    { q: "Sealant or ceramic coating: what's the difference?", a: "A sealant is a slick layer that lasts months. A ceramic coating bonds to the clear coat and lasts years, resists chemicals and keeps the gloss. If you keep the car more than a year, the coating is cheaper per month." },
    { q: "Will polishing take out every scratch?", a: "Swirls and light scratches, yes. If a scratch catches your fingernail it's through the clear coat; we'll show you under the lights and tell you honestly what will and won't come out before you pay." },
    { q: "Do you come to me?", a: "Washes and interior details, yes, within about 15 miles. Correction and coatings need the studio's lights and a dust-free bay, so those happen here." },
    { q: "Do I pay up front?", a: "Nothing up front for washes and details: you pay when you've seen the car. Coatings and film take a 20% deposit to hold two days in the studio." },
  ],
  sr: [
    { q: "Koliko dugo auto ostaje kod vas?", a: "Osveženje traje oko dva sata, a Kompletan detailing oko pet, pa većina automobila ide kući istog dana. Poliranje i keramika traju dva dana jer keramika mora da se stvrdne preko noći u zatvorenom." },
    { q: "Mogu li da sačekam dok radite?", a: "Za Osveženje može: imamo salon sa kafom i internetom. Za duže poslove vas odvezemo do grada ili vam pošaljemo poruku kad je auto spreman." },
    { q: "Zaštita laka ili keramika: koja je razlika?", a: "Zaštita (sealant) je klizav sloj koji traje mesecima. Keramika se vezuje za lak i traje godinama, otporna je na hemikalije i čuva sjaj. Ako auto zadržavate duže od godinu dana, keramika je isplativija po mesecu." },
    { q: "Da li poliranje skida svaku ogrebotinu?", a: "Sitne ogrebotine i „paukove mreže” da. Ako ogrebotinu osetite noktom, prošla je kroz lak; pokazaćemo vam je pod svetlima i iskreno reći šta može, a šta ne može da se ukloni, pre nego što platite." },
    { q: "Da li dolazite na adresu?", a: "Pranje i čišćenje enterijera da, u krugu od oko 20 km. Poliranje i keramika zahtevaju svetla studija i prostor bez prašine, pa se rade kod nas." },
    { q: "Da li se plaća unapred?", a: "Za pranje i detailing ništa unapred: plaćate kad vidite auto. Za keramiku i foliju uzimamo depozit od 20% da bismo rezervisali dva dana u studiju." },
  ],
};
