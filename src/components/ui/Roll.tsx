import clsx from "clsx";

/**
 * A price that rolls like an odometer when it changes ("$289" → "$339"): every digit is a
 * column of 0–9 that slides to its value; other characters stay put. Each slot is sized by the
 * real digit (invisible, in flow), so wide display faces never clip.
 */
export function Roll({ value, className }: { value: string; className?: string }) {
  return (
    <span className={clsx("inline-flex", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex leading-[1.15]">
        {[...value].map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={i} className="relative inline-block overflow-hidden">
              <span className="invisible">{ch}</span>
              <span className="roll-col absolute inset-x-0 top-0 flex flex-col items-center transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateY(${-Number(ch) * 1.15}em)`, transitionDelay: `${i * 40}ms` }}>
                {"0123456789".split("").map((d) => (
                  <span key={d} className="block h-[1.15em]">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i} className="whitespace-pre">
              {ch}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
