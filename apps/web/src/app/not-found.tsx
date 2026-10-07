import { Seal } from "@akashi/brand/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-6 px-6 text-center">
      <Seal className="mx-auto size-16 text-muted-foreground" label={null} />
      <p className="label text-verdict-not-found">not_found</p>
      <h1 className="title text-6xl sm:text-7xl">No page here.</h1>
      <p className="text-muted-foreground">Nothing is served at this address. The desk is one click away.</p>
      <Link href="/" className="btn btn-go mx-auto">
        Back to the desk
      </Link>
    </main>
  );
}
