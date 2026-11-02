/**
 * The Lustro mark: a rounded paint panel with one diagonal highlight cut through it, the
 * reflection you see on a freshly corrected hood. The wordmark is set in Syne.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="currentColor" />
      <path d="M7 24.5 21.5 7.5h4L11 24.5z" fill="var(--volt)" />
      <path d="M14.5 24.5 25 12.2v4.6l-6.3 7.7z" fill="var(--ink)" opacity="0.55" />
    </svg>
  );
}

export function Logo({ name = "Lustro", sub, className }: { name?: string; sub?: string; className?: string }) {
  return (
    <span className={className}>
      <span className="flex items-center gap-2.5">
        <LogoMark className="h-8 w-8 shrink-0 text-pearl" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.15rem] font-extrabold tracking-[-0.03em]">{name}</span>
          {sub && <span className="t-label mt-1 text-[0.58rem] text-mist">{sub}</span>}
        </span>
      </span>
    </span>
  );
}
