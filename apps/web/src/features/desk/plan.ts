/** Input + mode → the backend calls to make, one per item so each card can land as soon as it resolves. */
import { type DeskMode, type DeskService, MAX_CITATIONS_PER_RUN, MAX_PACKAGES_PER_RUN } from "@/lib/constants/desk";

import { detect, detectLanguage, parseInstall, splitCitations } from "./detect";
import { nowIntent } from "./now-intent";

export interface DeskItem {
  label: string;
  path: string;
  body: unknown;
}

export interface DeskPlan {
  service: DeskService;
  items: DeskItem[];
}

export type PlanResult =
  | { ok: true; plan: DeskPlan }
  | { ok: false; code: "empty" | "too_many" | "needs_kind"; message: string };

export function planDesk(input: string, mode: DeskMode): PlanResult {
  const text = input.trim();
  if (!text) return { ok: false, code: "empty", message: "Paste a citation, code, or ask a question." };
  const service = mode === "auto" ? detect(text) : mode;

  if (service === "cite") {
    const citations = splitCitations(text);
    if (citations.length > MAX_CITATIONS_PER_RUN) {
      return { ok: false, code: "too_many", message: `Up to ${MAX_CITATIONS_PER_RUN} citations at a time.` };
    }
    return {
      ok: true,
      plan: { service, items: citations.map((c) => ({ label: c, path: "/v1/verify", body: { citations: [c] } })) },
    };
  }

  if (service === "code") {
    const packages = parseInstall(text);
    if (packages) {
      if (packages.length > MAX_PACKAGES_PER_RUN) {
        return { ok: false, code: "too_many", message: `Up to ${MAX_PACKAGES_PER_RUN} packages at a time.` };
      }
      return {
        ok: true,
        plan: {
          service,
          items: packages.map((p) => ({ label: `${p.ecosystem} ${p.name}`, path: "/v1/packages", body: { items: [p] } })),
        },
      };
    }
    const language = detectLanguage(text);
    return {
      ok: true,
      plan: { service, items: [{ label: `${language} snippet`, path: "/v1/check", body: { language, code: text } }] },
    };
  }

  const call = nowIntent(text);
  if (!call) {
    return {
      ok: false,
      code: "needs_kind",
      message: "Ask about the time, weather, an exchange rate, holidays, a stock, news, jobs or a fact.",
    };
  }
  return { ok: true, plan: { service, items: [{ label: call.label, path: `/v1/${call.endpoint}`, body: call.body }] } };
}
