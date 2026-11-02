import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-start justify-center px-[var(--gutter)]">
      <LogoMark className="h-12 w-12 text-pearl" />
      <p className="t-label mt-10 text-volt">404</p>
      <h1 className="t-display t-lg mt-4 max-w-[14ch]">This page washed off.</h1>
      <p className="t-lead mt-6 max-w-md">The link may be old, or the preview was removed.</p>
      <Link href="/" className="btn btn-volt mt-10">
        Back to the studio
      </Link>
    </main>
  );
}
