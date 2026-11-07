import clsx from "clsx";

/** "03 — Prices". Phones show the sections in another order, so the number stays off there. */
export function SectionLabel({ text, className }: { text: string; className?: string }) {
  const [n, name] = text.split(" — ");
  return (
    <p className={clsx("t-label text-volt", className)}>
      <span className="phone:hidden">{n} — </span>
      {name}
    </p>
  );
}
