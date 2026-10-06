import "@/styles/index.css";

import { BRAND } from "@akashi/brand";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { SITE_URL, THEME_STORAGE_KEY } from "@/lib/constants/site";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} ${BRAND.kanji} · the fact-checker agents call first`, template: `%s · ${BRAND.name}` },
  description:
    "Pay-per-call checks for what AI agents claim: citations, code and live facts, each answer with its sources, " +
    "its age and whether the sources agree. On Pocket Network.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-marker focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-marker-foreground"
        >
          Skip to the desk
        </a>
        {/* next-themes sets the class before first paint: light unless the visitor chose midnight */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey={THEME_STORAGE_KEY}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
