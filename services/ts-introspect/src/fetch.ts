// Fetch an npm package's type files into memory: tarball when small, jsDelivr per-file when large.
import { extract } from "./tar.ts";
import {
  FETCH_TIMEOUT_MS, KEEP_FILE_RE, NPM_REGISTRY, TARBALL_MAX_COMPRESSED_BYTES, TARBALL_TIMEOUT_MS, USER_AGENT,
} from "./constants.ts";

export class NotFound extends Error {}

export interface VersionDoc {
  name: string;
  version: string;
  types?: string;
  typings?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  dist: { tarball: string; unpackedSize?: number };
}

async function get(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(timeoutMs) });
  if (res.status === 404) throw new NotFound(url);
  if (!res.ok) throw new Error(`upstream ${res.status} for ${url}`);
  return res;
}

export async function versionDoc(name: string, version: string): Promise<VersionDoc> {
  const path = name.startsWith("@") ? name.replace("/", "%2F") : name;
  return (await get(`${NPM_REGISTRY}/${path}/${encodeURIComponent(version)}`)).json() as Promise<VersionDoc>;
}

export interface TypeFiles {
  files: Map<string, string>; // path relative to the package root → text
  complete: boolean; // false when a crawl was cut short (deadline, file cap or failed fetches)
}

/** Type files for `doc`, streamed out of its tarball (only .d.ts + package.json are kept in memory). */
export async function typeFiles(doc: VersionDoc, _subpath = ""): Promise<TypeFiles> {
  const res = await get(doc.dist.tarball, TARBALL_TIMEOUT_MS);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > TARBALL_MAX_COMPRESSED_BYTES || !res.body) throw new Error(`tarball too large: ${declared} B`);
  const files = new Map<string, string>();
  for (const [path, text] of await extract(res.body, (p) => KEEP_FILE_RE.test(p))) {
    files.set(path.replace(/^[^/]+\//, ""), text); // tarballs nest everything under "package/"
  }
  return { files, complete: true };
}
