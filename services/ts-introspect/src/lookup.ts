// Walk a dotted symbol through the type checker. Three-valued: reaching `any`/error types answers "unknown".
import ts from "typescript";
import { ENTRY_FILE, MAX_OVERLOADS, MAX_SIBLINGS, MAX_SIGNATURE_CHARS } from "./constants.ts";
import type { Built } from "./program.ts";

export type Exists = "yes" | "no" | "unknown";

export interface Answer {
  symbol: string;
  exists: Exists;
  kind?: string;
  signature?: string;
  overloads: string[];
  defined_in?: string;
  siblings: string[];
  suggest_for?: string;
  reason?: string;
}

const F = ts.SymbolFlags;

function clip(text: string): string {
  return text.length > MAX_SIGNATURE_CHARS ? `${text.slice(0, MAX_SIGNATURE_CHARS - 1)}…` : text;
}

function kindOf(sym: ts.Symbol): string {
  const f = sym.flags;
  if (f & F.Method) return "method";
  if (f & F.Function) return "function";
  if (f & F.Class) return "class";
  if (f & F.Interface) return "interface";
  if (f & F.TypeAlias) return "type";
  if (f & F.Enum) return "enum";
  if (f & (F.Module | F.NamespaceModule | F.ValueModule)) return "namespace";
  if (f & F.Property) return "property";
  if (f & (F.Variable | F.BlockScopedVariable)) return "const";
  return "symbol";
}

function isAny(type: ts.Type): boolean {
  return (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0;
}

class Walker {
  private readonly checker: ts.TypeChecker;

  constructor(checker: ts.TypeChecker) {
    this.checker = checker;
  }

  resolveAlias(sym: ts.Symbol): ts.Symbol {
    return sym.flags & F.Alias ? this.checker.getAliasedSymbol(sym) : sym;
  }

  /** Children visible under `sym`: namespace exports, static members, instance members, value properties. */
  children(sym: ts.Symbol): { members: Map<string, ts.Symbol>; opaque: boolean } {
    const c = this.checker;
    const s = this.resolveAlias(sym);
    const members = new Map<string, ts.Symbol>();
    // An alias TS could not resolve lands on its internal "unknown" symbol (no declarations): we can't see inside.
    let opaque = !s.declarations?.length;
    const add = (list: readonly ts.Symbol[]) => { for (const m of list) if (!members.has(m.name)) members.set(m.name, m); };
    if (s.flags & (F.Module | F.NamespaceModule | F.ValueModule)) add(c.getExportsOfModule(s));
    // Value side first: for a class that is its static side (NextResponse.json is the static, not Response#json).
    if (s.flags & F.Value && s.valueDeclaration) {
      const valueType = c.getTypeOfSymbolAtLocation(s, s.valueDeclaration);
      opaque ||= isAny(valueType);
      add(c.getPropertiesOfType(c.getApparentType(valueType)));
    }
    if (s.flags & (F.Class | F.Interface)) {
      const declared = c.getDeclaredTypeOfSymbol(s);
      opaque ||= isAny(declared);
      add(c.getPropertiesOfType(declared));
    }
    if (s.flags & F.TypeAlias) {
      const aliased = c.getDeclaredTypeOfSymbol(s);
      opaque ||= isAny(aliased);
      add(c.getPropertiesOfType(aliased));
    }
    return { members, opaque };
  }

  describe(name: string, sym: ts.Symbol): Pick<Answer, "kind" | "signature" | "overloads"> {
    const c = this.checker;
    const s = this.resolveAlias(sym);
    const kind = kindOf(s);
    const decl = s.valueDeclaration ?? s.declarations?.[0];
    if (s.flags & (F.Function | F.Method) || (decl && s.flags & F.Property)) {
      const type = decl ? c.getTypeOfSymbolAtLocation(s, decl) : c.getDeclaredTypeOfSymbol(s);
      const sigs = type.getCallSignatures();
      if (sigs.length > 0) {
        const rendered = sigs.slice(0, MAX_OVERLOADS).map((sig) => clip(`${name}${c.signatureToString(sig)}`));
        return { kind: sigs.length && kind === "property" ? "method" : kind, signature: rendered[0], overloads: rendered.slice(1) };
      }
      return { kind, signature: clip(`${name}: ${c.typeToString(type)}`), overloads: [] };
    }
    if (s.flags & F.Class) return { kind, signature: `class ${name}`, overloads: [] };
    if (s.flags & F.Interface) return { kind, signature: `interface ${name}`, overloads: [] };
    if (s.flags & F.TypeAlias) {
      return { kind, signature: clip(`type ${name} = ${c.typeToString(c.getDeclaredTypeOfSymbol(s))}`), overloads: [] };
    }
    if (decl && s.flags & F.Value) {
      return { kind, signature: clip(`${name}: ${c.typeToString(c.getTypeOfSymbolAtLocation(s, decl))}`), overloads: [] };
    }
    return { kind, overloads: [] };
  }
}

function moduleSymbol(built: Built): ts.Symbol | undefined {
  const checker = built.program.getTypeChecker();
  const entry = built.program.getSourceFile(ENTRY_FILE);
  const decl = entry?.statements.find(ts.isImportDeclaration);
  if (!decl) return undefined;
  // getExportsOfModule() already follows `export =`, so the module symbol itself is enough.
  return checker.getSymbolAtLocation(decl.moduleSpecifier);
}

export function lookup(built: Built, pkg: string, symbol: string, aliasRetry = true): Answer {
  const checker = built.program.getTypeChecker();
  const walker = new Walker(checker);
  const base: Answer = { symbol, exists: "unknown", overloads: [], siblings: [] };
  const mod = moduleSymbol(built);
  if (!mod) return { ...base, reason: "no_type_definitions" };
  const tokens = symbol.split(".").filter(Boolean);
  const pkgBase = pkg.split("/").pop() ?? pkg;
  // "axios.get" / "axios.fetchJson": a leading package name means the default export (or the namespace itself).
  // `export = X` modules (lodash, many @types): the exported value/namespace X is what callers see.
  const exportEquals = mod.exports?.get("export=" as ts.__String);
  let current: ts.Symbol = exportEquals ? walker.resolveAlias(exportEquals) : mod;
  let path = pkg;
  const camel = pkgBase.replace(/[-_.]+(\w)/g, (_, ch: string) => ch.toUpperCase()); // left-pad → leftPad
  // With `export = fn`, the module *is* that value: its own name, "default" or the package's camelCase name refer to it.
  if (exportEquals && [current.name, "default", camel].includes(tokens[0]) && !walker.children(current).members.has(tokens[0])) {
    tokens.shift();
  } else if (tokens[0] === pkg || tokens[0] === pkgBase || tokens[0] === camel) {
    tokens.shift();
    const def = checker.getExportsOfModule(mod).find((e) => e.name === "default");
    if (def && !exportEquals) current = def;
  }
  if (tokens.length === 0) return { ...base, exists: "yes", ...walker.describe(pkgBase, current), defined_in: pkg };
  for (let i = 0; i < tokens.length; i += 1) {
    const name = tokens[i];
    const { members, opaque } = walker.children(current);
    let next = members.get(name);
    if (!next && i === 0) {
      // Also try the default export's members (e.g. "get" on axios' default instance).
      const def = checker.getExportsOfModule(mod).find((e) => e.name === "default");
      if (def) next = walker.children(def).members.get(name);
    }
    if (!next && i === 0 && aliasRetry && tokens.length > 1) {
      // `import _ from "lodash"; _.chunk` / `import * as z from "zod"`: treat an unknown first token as the
      // import alias and resolve the rest from the package root.
      const rest = lookup(built, pkg, tokens.slice(1).join("."), false);
      if (rest.exists !== "no") return { ...rest, symbol, reason: rest.reason ?? `treated '${name}' as the import alias` };
    }
    if (!next) {
      const siblings = [...members.keys()].filter((k) => !k.startsWith("__")).slice(0, MAX_SIBLINGS);
      if (opaque) return { ...base, reason: "resolves_to_any", defined_in: path, siblings };
      // Never claim "does not exist" from a partial view of the package's types.
      if (!built.complete) return { ...base, reason: "type_files_incomplete", defined_in: path, siblings };
      return { ...base, exists: "no", defined_in: path, siblings, suggest_for: name };
    }
    current = next;
    path = `${path}.${name}`;
  }
  if (!walker.resolveAlias(current).declarations?.length) {
    return { ...base, reason: "unresolved_reexport", defined_in: path };
  }
  return { ...base, exists: "yes", ...walker.describe(tokens.at(-1)!, current), defined_in: path };
}
