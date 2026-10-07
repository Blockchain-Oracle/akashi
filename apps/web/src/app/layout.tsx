import "@/styles/index.css";

import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/lib/constants/site";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · every tool your agent needs, on Pocket Network`, template: `%s · ${SITE_NAME}` },
  description:
    "One endpoint, every tool: live web search, page extraction, cited answers, research papers, weather, FX, " +
    "packages and more. Your agent discovers and inspects tools for free and pays per call in USDC over x402; " +
    "every run is a Pocket Network relay.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
