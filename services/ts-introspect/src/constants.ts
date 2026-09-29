// ts-introspect constants (specs/backend.md §3.2; sources-code-reality-check.md measurements).
export const PORT = Number(process.env.PORT ?? 3000);
export const NPM_REGISTRY = "https://registry.npmjs.org";

// Tarballs are streamed and filtered, so size matters only for download time (next@15: ~25 MB compressed).
export const TARBALL_MAX_COMPRESSED_BYTES = 80 * 1024 * 1024;
export const TARBALL_TIMEOUT_MS = 30_000; // background builds; foreground callers get `pending` first
export const FETCH_TIMEOUT_MS = 5_000;
export const MAX_DEPENDENCY_PACKAGES = 8; // dependency typings loaded so re-exported types resolve
export const MAX_DEPENDENCY_DEPTH = 2;
export const PROGRAM_CACHE_SIZE = 4; // LRU of compiled programs; one next@15 program ≈ 150 MB RSS (measured)
export const MAX_SYMBOLS_PER_REQUEST = 50;
export const MAX_REQUEST_BYTES = 65_536;
export const MAX_SIGNATURE_CHARS = 500;
export const MAX_OVERLOADS = 5;
export const MAX_SIBLINGS = 400;

export const VIRTUAL_ROOT = "/v";
export const ENTRY_FILE = `${VIRTUAL_ROOT}/__akashi_entry__.ts`;
export const TYPE_FILE_RE = /\.d\.(m|c)?ts$/;
export const KEEP_FILE_RE = /(\.d\.(m|c)?ts|(^|\/)package\.json)$/;
export const USER_AGENT = "akashi-ts-introspect/1.0 (+https://github.com/Blockchain-Oracle/akashi)";
