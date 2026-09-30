import { BRAND } from "@akashi/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <p className="mx-auto max-w-5xl px-6 py-8 font-mono text-xs text-muted-foreground">{BRAND.tagline}</p>
    </footer>
  );
}
