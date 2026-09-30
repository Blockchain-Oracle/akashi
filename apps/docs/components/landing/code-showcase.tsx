"use client";

// Several files side by side: tabs, shiki highlighting and copy (the Script Copy pattern, via Logos Kit docs).
import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

import { cn } from "@/lib/cn";

import { BorderBeam } from "./border-beam";

const COPIED_MS = 1500;
const BEAM_SIZE = 260;
const BEAM_DURATION_S = 14;

export interface ShowcaseFile {
  name: string;
  lang: string;
  code: string;
}

export function CodeShowcase({ files }: { files: ShowcaseFile[] }) {
  const [active, setActive] = useState(0);
  const [html, setHtml] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all(
      files.map((f) =>
        codeToHtml(f.code, { lang: f.lang, themes: { light: "github-light", dark: "github-dark-default" }, defaultColor: false }),
      ),
    ).then((h) => live && setHtml(h));
    return () => {
      live = false;
    };
  }, [files]);

  const file = files[active] ?? files[0];
  if (!file) return null;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-fd-border bg-fd-card">
      <BorderBeam size={BEAM_SIZE} duration={BEAM_DURATION_S} />
      <div className="flex items-center justify-between border-fd-border border-b px-3">
        <div className="flex overflow-x-auto">
          {files.map((f, i) => (
            <button
              key={f.name}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 px-3 py-3 font-mono text-xs transition-colors",
                i === active ? "text-fd-foreground" : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              {f.name}
              {i === active ? <motion.span layoutId="code-tab" className="absolute inset-x-2 -bottom-px h-px bg-fd-foreground" /> : null}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Copy code"
          onClick={() => {
            void navigator.clipboard.writeText(file.code);
            setCopied(true);
            setTimeout(() => setCopied(false), COPIED_MS);
          }}
          className="rounded-lg p-2 text-fd-muted-foreground transition hover:bg-fd-secondary hover:text-fd-foreground active:scale-95"
        >
          {copied ? <Check className="size-4 text-verdict-verified" /> : <Copy className="size-4" />}
        </button>
      </div>
      {html[active] ? (
        // Shiki's HTML for the fixed strings passed in (no visitor input).
        <div
          className="ak-code overflow-x-auto p-5 font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html[active] }}
        />
      ) : (
        <pre className="overflow-x-auto p-5 font-mono text-[13px] text-fd-muted-foreground leading-relaxed">{file.code}</pre>
      )}
    </div>
  );
}
