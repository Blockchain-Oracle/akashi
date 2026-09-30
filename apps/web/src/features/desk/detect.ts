/**
 * Deterministic routing (specs/web.md §4): identifiers and bibliography shapes are citations, code shapes are code,
 * everything else is a question about now. Pure functions: shared by the input's live chip and /api/desk.
 */
import type { DeskService } from "@/lib/constants/desk";

export type CheckLanguage = "python" | "typescript" | "javascript" | "go" | "rust";

// Identifiers are unambiguous: they win before any code heuristic (a DOI like 10.1016/S0140-6736(97)11096-0 is
// full of parentheses).
const CITATION_IDS = [
  /\b10\.\d{4,9}\/\S+/, // DOI
  /\barxiv:?\s*\d{4}\.\d{4,5}/i,
  /\bpmid:?\s*\d{5,9}\b/i,
  /\b\d{1,4}\s+(?:U\.\s?S\.|S\.\s?Ct\.|F\.\s?(?:2d|3d|4th)|F\.\s?Supp\.(?:\s?[23]d)?|L\.\s?Ed\.)\s+\d{1,5}\b/, // US reporters
  /^https?:\/\/\S+$/im,
];
const CODE_PATTERNS = [
  /^\s*(?:import|from)\s+[\w.]+/m,
  /\brequire\(\s*["'`]/,
  /^\s*(?:def|class|fn|func|function|const|let|var|use|package)\s+\w/m,
  /=>/,
  /^\s*(?:pip3?|npm|pnpm|yarn|cargo|go)\s+(?:install|i|add|get)\b/m,
];
// Bibliography shapes: weaker, so they come after the code patterns.
const CITATION_SHAPES = [/\b[A-Z][\w.'-]+ v\. [A-Z]/, /\(\s*(?:1[89]|20)\d{2}\s*\)/, /\bet al\.?/i];
const BRACE_DENSITY = 0.02;

function braceDensity(text: string): number {
  const braces = (text.match(/[{}();]/g) ?? []).length;
  return text.length ? braces / text.length : 0;
}

export function detect(input: string): DeskService {
  const text = input.trim();
  if (!text) return "now";
  if (CITATION_IDS.some((re) => re.test(text))) return "cite";
  if (CODE_PATTERNS.some((re) => re.test(text))) return "code";
  if (CITATION_SHAPES.some((re) => re.test(text))) return "cite";
  if (braceDensity(text) > BRACE_DENSITY) return "code";
  return "now";
}

export function detectLanguage(code: string): CheckLanguage {
  if (/^\s*package\s+\w+|^\s*func\s+\w+\(|import\s+"fmt"/m.test(code)) return "go";
  if (/^\s*use\s+\w+::|\bfn\s+\w+\(|\blet\s+mut\b/m.test(code)) return "rust";
  if (/^\s*(?:from\s+[\w.]+\s+)?import\s+[\w.]+\s*$|^\s*def\s+\w+\(|^\s*print\(/m.test(code)) return "python";
  if (/:\s*(?:string|number|boolean)\b|\binterface\s+\w+|\btype\s+\w+\s*=/.test(code)) return "typescript";
  return "javascript";
}

const INSTALL = /^\s*(pip3?|npm|pnpm|yarn|cargo|go)\s+(?:install|i|add|get)\s+(.+)$/m;
const ECOSYSTEM: Record<string, string> = { pip: "pypi", pip3: "pypi", npm: "npm", pnpm: "npm", yarn: "npm", cargo: "cargo", go: "go" };

/** "flask==3.0" → flask, "axios@1.7.9" → axios, "@scope/pkg@2" → @scope/pkg. */
function stripVersion(token: string): string {
  const name = token.split(/[=<>!~]=?/)[0] ?? token;
  const at = name.lastIndexOf("@");
  return at > 0 ? name.slice(0, at) : name;
}

/** "pip install reqeusts flask" → packages; anything else is a snippet. */
export function parseInstall(code: string): { ecosystem: string; name: string }[] | null {
  const text = code.trim();
  const m = INSTALL.exec(text);
  if (!m?.[1] || !m[2] || text.includes("\n")) return null;
  const ecosystem = ECOSYSTEM[m[1]] ?? "npm";
  return m[2]
    .split(/\s+/)
    .filter((t) => t && !t.startsWith("-"))
    .map((t) => ({ ecosystem, name: stripVersion(t) }));
}

/** One citation per non-empty line (numbered or bulleted lists are unwrapped). */
export function splitCitations(input: string): string[] {
  return input
    .split(/\n+/)
    // "1. ", "[2] ", "- " list markers need the space after them: "10.1016/…" is a DOI, not item 10
    .map((line) => line.replace(/^\s*(?:\[\d+\]|\d+[.)]|[-*•])\s+/, "").trim())
    .filter(Boolean);
}
