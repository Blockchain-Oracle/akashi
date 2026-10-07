import { publicEnv } from "../env"; // relative: next.config.ts imports this file, and aliases do not resolve there

export const SITE_NAME = "Akashi";
export const SITE_URL = publicEnv.NEXT_PUBLIC_APP_URL;
export const DOCS_URL = publicEnv.NEXT_PUBLIC_DOCS_URL;
/** The public gateway agents call (free reads + x402-paid runs). */
export const GATEWAY_URL = publicEnv.NEXT_PUBLIC_API_URL;
/** A page of the documentation (the docs host serves its landing at / and the pages under /docs). */
export const docsPage = (path = "") => `${DOCS_URL}/docs${path && `/${path}`}`;
export const REPO_URL = "https://github.com/Blockchain-Oracle/akashi";
export const SKILL_URL = `${SITE_URL}/SKILL.md`;
export const SKILL_COMMAND = `set up ${SKILL_URL}`;
export const POCKET_URL = "https://pocket.network";
export const POCKET_SERVICE_ID = "tool-router";
export const X402_URL = "https://www.x402.org";
export const THEME_STORAGE_KEY = "akashi-theme";

export const NAV = [
  { label: "Home", href: "/" },
  { label: "Tools", href: "/tools" },
  { label: "Agent", href: "/agent" },
  { label: "Docs", href: DOCS_URL },
] as const;

/** Catalog reads are revalidated this often (seconds): the catalog only changes on deploy, health every run. */
export const CATALOG_REVALIDATE_S = 300;
