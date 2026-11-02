"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import matte from "@/assets/photos/matte-studio.jpg";
import { useBiz } from "@/components/preview/BizContext";
import { PhoneIcon } from "@/components/layout/MobileBar";
import { Reveal } from "@/components/ui/Reveal";
import { packages, sizes } from "@/content/offer";
import { telOf } from "@/lib/biz-core";
import { useT } from "@/lib/i18n";

type Day = { key: string; label: string };

/** The next open days in the studio's time zone ("Tue 4 Nov"), worked out in the browser. */
function nextOpenDays(hours: { day: number; open: string | null }[] | null, timeZone: string, lang: "en" | "sr", count = 6): Day[] {
  const fmt = new Intl.DateTimeFormat(lang === "sr" ? "sr-Latn-RS" : "en-US", { weekday: "short", day: "numeric", month: "short", timeZone });
  const wd = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone });
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out: Day[] = [];
  for (let i = 0; i < 21 && out.length < count; i++) {
    const d = new Date(Date.now() + i * 86_400_000);
    const day = names.indexOf(wd.format(d));
    if (hours && !hours[day]?.open) continue;
    out.push({ key: d.toISOString().slice(0, 10), label: fmt.format(d).replace(/\.$/, "") });
  }
  return out;
}

/** A short booking request with a polished "sent" state. Demo: it validates but sends nothing. */
export function Book() {
  const biz = useBiz();
  const t = useT();
  const pk = packages[biz.lang];
  const sz = sizes[biz.lang];
  const [days, setDays] = useState<Day[]>([]);
  const [size, setSize] = useState(0);
  const [pkg, setPkg] = useState(pk[1].name);
  const [day, setDay] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ name: string; day: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dates depend on the visitor's clock
    setDays(nextOpenDays(biz.hours, biz.timezone, biz.lang));
  }, [biz.hours, biz.timezone, biz.lang]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const phone = String(f.get("phone") ?? "").replace(/\D/g, "");
    const car = String(f.get("car") ?? "").trim();
    const err: Record<string, string> = {};
    if (name.length < 2) err.name = t("Tell us your name");
    if (phone.length < 7) err.phone = t("We need a number to text you on");
    if (car.length < 2) err.car = t("Which car is it?");
    if (!day) err.day = t("Pick a day");
    setErrors(err);
    if (Object.keys(err).length) {
      (e.currentTarget.querySelector(`[name="${Object.keys(err)[0]}"]`) as HTMLElement | null)?.focus();
      return;
    }
    setSent({ name: name.split(" ")[0], day: days.find((d) => d.key === day)?.label ?? "" });
  };

  return (
    <section id="book" aria-labelledby="book-title" className="relative overflow-hidden bg-ink">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[60svh] lg:min-h-full">
          <Image src={matte} alt={t("A satin black car waiting in a bright, clean studio bay")} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,10,0.2),rgba(7,8,10,0.85))]" />
          <div className="absolute inset-x-0 bottom-0 p-[var(--gutter)] pb-12">
            <p className="t-label text-volt">{t("08 — Book")}</p>
            <h2 id="book-title" className="t-display t-lg mt-5 max-w-[12ch]">
              {t("Your car, the way it should look.")}
            </h2>
            {biz.phone && (
              <a href={telOf(biz)} className="mt-8 inline-flex items-center gap-3 text-lg font-semibold hover:text-volt">
                <PhoneIcon className="h-5 w-5" />
                <span>
                  {t("Rather call?")} <span data-no-translate>{biz.phoneDisplay}</span>
                </span>
              </a>
            )}
          </div>
        </div>

        <div className="px-[var(--gutter)] py-16 md:py-24 lg:px-16">
          {sent ? (
            <div role="status" className="anim-fade flex h-full flex-col justify-center">
              <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-volt text-ink">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="t-display t-md mt-8">{t("Thanks, {name}. You're on the list.", { name: sent.name })}</p>
              <p className="t-lead mt-5 max-w-md">{t("We'll text you within the hour to confirm {day} and the drop-off time.", { day: sent.day })}</p>
              <p className="mt-8 text-sm text-mist">{t("Concept site: nothing was actually sent.")}</p>
              <button type="button" onClick={() => setSent(null)} className="btn btn-ghost mt-10 self-start">
                {t("Book another car")}
              </button>
            </div>
          ) : (
            <Reveal>
              <form noValidate onSubmit={submit} className="space-y-8">
                <p className="t-lead">{t("Pick a day and we'll text you to confirm. No payment now.")}</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="name" label={t("Your name")} autoComplete="name" error={errors.name} />
                  <Field name="phone" label={t("Mobile")} type="tel" autoComplete="tel" error={errors.phone} />
                  <div className="sm:col-span-2">
                    <Field name="car" label={t("Car (make and model)")} placeholder={biz.lang === "sr" ? "npr. Golf 7, 2017" : "e.g. 2019 Honda Accord"} error={errors.car} />
                  </div>
                </div>

                <fieldset>
                  <legend className="t-label mb-3 text-mist">{t("Size")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {sz.map((s, i) => (
                      <Chip key={s} on={size === i} onClick={() => setSize(i)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="t-label mb-3 text-mist">{t("Package")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {[...pk.map((p) => p.name), t("Not sure yet")].map((n) => (
                      <Chip key={n} on={pkg === n} onClick={() => setPkg(n)}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </fieldset>

                <fieldset aria-describedby={errors.day ? "day-err" : undefined}>
                  <legend className="t-label mb-3 text-mist">{t("Day")}</legend>
                  <div className="flex min-h-11 flex-wrap gap-2">
                    {days.map((d) => (
                      <Chip key={d.key} on={day === d.key} onClick={() => setDay(d.key)} name="day">
                        {d.label}
                      </Chip>
                    ))}
                  </div>
                  {errors.day && (
                    <p id="day-err" className="mt-2 text-sm text-[#ff8a7a]">
                      {errors.day}
                    </p>
                  )}
                </fieldset>

                <button type="submit" className="btn btn-volt w-full sm:w-auto">
                  {t("Request this slot")}
                </button>
              </form>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ name, label, error, type = "text", autoComplete, placeholder }: { name: string; label: string; error?: string; type?: string; autoComplete?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="t-label text-mist">
        {label}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-err` : undefined}
        className={clsx("mt-2 block min-h-12 w-full border-b bg-transparent py-2 text-lg outline-none transition-colors placeholder:text-mist/50 focus:border-volt", error ? "border-[#ff8a7a]" : "border-line-strong")}
      />
      {error && (
        <span id={`${name}-err`} className="mt-2 block text-sm text-[#ff8a7a]">
          {error}
        </span>
      )}
    </div>
  );
}

function Chip({ on, onClick, children, name }: { on: boolean; onClick: () => void; children: React.ReactNode; name?: string }) {
  return (
    <button type="button" name={name} aria-pressed={on} onClick={onClick} className={clsx("min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors duration-300", on ? "border-volt bg-volt text-ink" : "border-line-strong text-pearl hover:border-pearl")}>
      {children}
    </button>
  );
}
