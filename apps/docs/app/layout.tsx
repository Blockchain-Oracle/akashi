import "./global.css";

import { BRAND } from "@akashi/brand";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.docs),
  title: { default: `${BRAND.name} ${BRAND.kanji} Docs`, template: `%s · ${BRAND.name} Docs` },
  description: "How to call Akashi's verification services (citations, code, live facts) through Pocket Network.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <RootProvider theme={{ defaultTheme: "light", enableSystem: false, storageKey: site.themeStorageKey }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
