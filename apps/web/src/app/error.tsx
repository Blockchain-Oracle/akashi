"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-6 px-6 text-center">
      <p className="label text-verdict-unknown">unavailable</p>
      <h1 className="title text-6xl sm:text-7xl">This page failed.</h1>
      <p className="text-muted-foreground">Something broke while rendering. Trying again usually works.</p>
      <button type="button" onClick={reset} className="btn btn-ink mx-auto">
        Try again
      </button>
    </main>
  );
}
