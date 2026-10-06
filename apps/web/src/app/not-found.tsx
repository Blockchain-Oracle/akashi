import { Seal } from "@akashi/brand/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-6 px-6 text-center">
      <Seal className="mx-auto size-16 text-muted-foreground" label={null} />
      <p className="label text-verdict-not-found">not_found</p>
      <h1 className="font-display text-4xl font-bold tracking-[-0.025em]">No page at this address.</h1>
      <Link href="/" className="btn btn-marker mx-auto">
        Back to the desk
      </Link>
    </main>
  );
}
