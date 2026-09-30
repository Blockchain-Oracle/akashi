"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-6 px-6 text-center">
      <p className="font-mono text-xs tracking-widest text-verdict-unknown uppercase">unavailable</p>
      <h1 className="font-display text-3xl">This page failed to render.</h1>
      <button type="button" onClick={reset} className="text-primary underline underline-offset-4">
        Try again
      </button>
    </main>
  );
}
