import "@/styles/index.css";

import { BRAND } from "@akashi/brand";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { SITE_URL, THEME_STORAGE_KEY } from "@/lib/constants/site";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name} ${BRAND.kanji} · verification APIs for agents`, template: `%s · ${BRAND.name}` },
  description:
    "Pay-per-call checks for what AI agents claim: citations, code and live facts, each answer with its sources, " +
    "its age and whether the sources agree. On Pocket Network.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        {/* next-themes sets the class before first paint: washi (light) unless the visitor chose sumi */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey={THEME_STORAGE_KEY}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
