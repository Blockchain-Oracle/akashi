"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-6 px-6 text-center">
      <p className="label text-verdict-unknown">unavailable</p>
      <h1 className="font-display text-4xl font-bold tracking-[-0.025em]">This page failed to render.</h1>
      <button type="button" onClick={reset} className="btn btn-ink mx-auto">
        Try again
      </button>
    </main>
  );
}
