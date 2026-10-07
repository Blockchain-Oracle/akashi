import "server-only";

import { generateText, type LanguageModel } from "ai";

import {
  FALLBACK_TITLE_MAX,
  NEW_CHAT_TITLE,
  TITLE_MAX,
  TITLE_MAX_TOKENS,
  TITLE_SOURCE_MAX_CHARS,
  TITLE_TIMEOUT_MS,
} from "@/lib/constants/agent";

const ELLIPSIS = "…";
const MIN_WORD_CUT = FALLBACK_TITLE_MAX / 2; // cut at a word boundary only when that keeps at least half the width
const QUOTES = /["'“”‘’`]/g;
const TRAILING_STOP = /[.。!?]+$/;

const flatten = (text: string): string => text.replace(/\s+/g, " ").trim();

/** The first user text, cut at a word boundary: what the sidebar shows until the model names the chat. */
export function fallbackTitle(text: string): string {
  const flat = flatten(text);
  if (!flat) return NEW_CHAT_TITLE;
  if (flat.length <= FALLBACK_TITLE_MAX) return flat;
  const cut = flat.slice(0, FALLBACK_TITLE_MAX);
  const atWord = cut.lastIndexOf(" ");
  return `${(atWord > MIN_WORD_CUT ? cut.slice(0, atWord) : cut).trimEnd()}${ELLIPSIS}`;
}

/** Six words from the model, falling back to the cut text on any failure so a title never blocks a reply. */
export async function generateTitle(model: LanguageModel, firstUserText: string): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      instructions:
        "Name this chat for a sidebar: at most six words, no quotes, no trailing period, in the language of the message. Reply with the title only.",
      prompt: firstUserText.slice(0, TITLE_SOURCE_MAX_CHARS),
      maxOutputTokens: TITLE_MAX_TOKENS,
      timeout: TITLE_TIMEOUT_MS,
    });
    const title = flatten(text.replace(QUOTES, "")).replace(TRAILING_STOP, "");
    return title && title.length <= TITLE_MAX ? title : fallbackTitle(firstUserText);
  } catch {
    return fallbackTitle(firstUserText);
  }
}
