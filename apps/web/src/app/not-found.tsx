import { Seal } from "@akashi/brand/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-6 px-6 text-center">
      <Seal className="mx-auto size-16 text-muted-foreground" label={null} />
      <p className="font-mono text-xs tracking-widest text-verdict-not-found uppercase">not_found</p>
      <h1 className="font-display text-3xl">No page at this address.</h1>
      <Link href="/" className="text-primary underline underline-offset-4">
        Back to Akashi
      </Link>
    </main>
  );
}
