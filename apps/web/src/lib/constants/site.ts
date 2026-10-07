import { publicEnv } from "../env"; // relative: next.config.ts imports this file, and aliases do not resolve there

export const SITE_URL = publicEnv.NEXT_PUBLIC_APP_URL;
export const DOCS_URL = publicEnv.NEXT_PUBLIC_DOCS_URL;
/** A page of the documentation (the docs host serves its landing at / and the pages under /docs). */
export const docsPage = (path = "") => `${DOCS_URL}/docs${path && `/${path}`}`;
export const REPO_URL = "https://github.com/Blockchain-Oracle/akashi";
export const POCKET_URL = "https://pocket.network";
/** The agent chat, on this app. */
export const AGENT_PATH = "/agent";
export const DESK_ANCHOR = "#desk";
export const THEME_STORAGE_KEY = "akashi-theme";
