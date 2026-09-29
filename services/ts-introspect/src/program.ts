// Build a TypeScript Program over an in-memory node_modules so TS's own resolver (exports, typesVersions,
// types, @types) decides what a package exports — exactly what a user's editor would see.
import { existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import ts from "typescript";
import {
  ENTRY_FILE, MAX_DEPENDENCY_DEPTH, MAX_DEPENDENCY_PACKAGES, PROGRAM_CACHE_SIZE, TYPE_FILE_RE, VIRTUAL_ROOT,
} from "./constants.ts";
import { NotFound, typeFiles, versionDoc } from "./fetch.ts";

const LIB_DIR = dirname(ts.getDefaultLibFilePath({}));
const BARE_IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*|<reference\s+types=)["']([^"'./][^"']*)["']/g;

export interface Built {
  program: ts.Program;
  version: string;
  typesFrom: string; // the package itself or "@types/<name>"
  complete: boolean; // every type file loaded — otherwise "no" answers are downgraded to "unknown"
}

function packageRoot(name: string): string {
  return `${VIRTUAL_ROOT}/node_modules/${name}`;
}

function bareName(spec: string): string {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function typesPackageName(name: string): string {
  return `@types/${name.startsWith("@") ? name.slice(1).replace("/", "__") : name}`;
}

async function load(files: Map<string, string>, name: string, range: string): Promise<boolean> {
  const doc = await versionDoc(name, range.replace(/^[\^~>=<\s]+/, "") || "latest").catch(() => versionDoc(name, "latest"));
  for (const [rel, text] of (await typeFiles(doc)).files) files.set(`${packageRoot(name)}/${rel}`, text);
  return [...files.keys()].some((k) => k.startsWith(packageRoot(name) + "/") && TYPE_FILE_RE.test(k));
}

async function addDependencies(files: Map<string, string>, name: string, depth: number, seen: Set<string>): Promise<void> {
  if (depth > MAX_DEPENDENCY_DEPTH) return;
  const manifest = JSON.parse(files.get(`${packageRoot(name)}/package.json`) ?? "{}") as {
    dependencies?: Record<string, string>; peerDependencies?: Record<string, string>;
  };
  const declared = { ...manifest.peerDependencies, ...manifest.dependencies };
  const wanted = new Set<string>();
  for (const [path, text] of files) {
    if (!path.startsWith(packageRoot(name) + "/") || !TYPE_FILE_RE.test(path)) continue;
    for (const m of text.matchAll(BARE_IMPORT_RE)) wanted.add(bareName(m[1]));
  }
  for (const dep of wanted) {
    if (seen.size >= MAX_DEPENDENCY_PACKAGES || seen.has(dep) || dep === name || dep.startsWith("node:")) continue;
    seen.add(dep);
    try {
      const hasTypes = await load(files, dep, declared[dep] ?? "latest");
      if (!hasTypes) await load(files, typesPackageName(dep), "latest");
      await addDependencies(files, dep, depth + 1, seen);
    } catch {
      // Missing dependency typings → affected symbols resolve to `any` → reported as "unknown", never "no".
    }
  }
}

function host(files: Map<string, string>, options: ts.CompilerOptions): ts.CompilerHost {
  const base = ts.createCompilerHost(options, true);
  const readVirtual = (p: string) => files.get(p);
  const isLib = (p: string) => p.startsWith(LIB_DIR);
  return {
    ...base,
    getSourceFile: (p, lang) => {
      const text = readVirtual(p) ?? (isLib(p) && existsSync(p) ? readFileSync(p, "utf8") : undefined);
      return text === undefined ? undefined : ts.createSourceFile(p, text, lang, true);
    },
    fileExists: (p) => files.has(p) || (isLib(p) && existsSync(p)),
    readFile: (p) => readVirtual(p) ?? (isLib(p) && existsSync(p) ? readFileSync(p, "utf8") : undefined),
    directoryExists: (d) => isLib(d) || [...files.keys()].some((k) => k.startsWith(d.endsWith("/") ? d : d + "/")),
    getDirectories: () => [],
    realpath: (p) => p,
    getCurrentDirectory: () => VIRTUAL_ROOT,
    writeFile: () => {},
  };
}

const cache = new Map<string, Built>();

export async function build(spec: string, version: string): Promise<Built> {
  // "next/server" → fetch package "next", but import the "next/server" subpath exactly as user code would.
  const name = bareName(spec);
  const key = `${spec}@${version}`;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit); // LRU touch
    return hit;
  }
  const doc = await versionDoc(name, version); // throws NotFound for unknown package/version
  const files = new Map<string, string>();
  const fetched = await typeFiles(doc);
  for (const [rel, text] of fetched.files) files.set(`${packageRoot(name)}/${rel}`, text);
  let typesFrom = name;
  if (![...files.keys()].some((k) => TYPE_FILE_RE.test(k))) {
    typesFrom = typesPackageName(name);
    try {
      await load(files, typesFrom, "latest");
    } catch (err) {
      if (!(err instanceof NotFound)) throw err;
    }
  }
  await addDependencies(files, typesFrom, 1, new Set([name, typesFrom]));
  files.set(ENTRY_FILE, `import * as __akashi_ns from ${JSON.stringify(spec)};\nexport { __akashi_ns };\n`);
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ["lib.es2023.d.ts", "lib.dom.d.ts"], types: [], noEmit: true, skipLibCheck: true, strict: true,
    esModuleInterop: true, allowSyntheticDefaultImports: true,
  };
  const program = ts.createProgram([ENTRY_FILE], options, host(files, options));
  const built = { program, version: doc.version, typesFrom, complete: fetched.complete };
  cache.set(key, built);
  if (cache.size > PROGRAM_CACHE_SIZE) cache.delete(cache.keys().next().value!);
  return built;
}
