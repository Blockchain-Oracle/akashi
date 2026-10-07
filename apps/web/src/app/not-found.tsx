import Link from "next/link";

import { SiteHeader } from "@/components/shell/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[680px] flex-col items-center px-4 py-32 text-center">
        <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">404</p>
        <h1 className="display mt-4 text-5xl">Nothing here.</h1>
        <p className="mt-4 text-lg text-muted-foreground">That page is not part of the catalog.</p>
        <Link href="/tools" className="mt-8 rounded-md bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-hover">
          Browse the tools
        </Link>
      </main>
    </>
  );
}
