import "server-only";

import {
  DEMO_VIDEO_CHECK_TIMEOUT_MS,
  DEMO_VIDEO_CHECK_TTL_MS,
  DEMO_VIDEO_UNAVAILABLE_STATUSES,
  demoOembedUrl,
} from "@/lib/constants/demo";

let last: { id: string; at: number; playable: boolean } | null = null;

/**
 * Whether the demo film can play in an embed right now, so /demo never shows YouTube's "Video unavailable" box.
 * One answer is reused for DEMO_VIDEO_CHECK_TTL_MS. When YouTube cannot be asked (timeout, rate limit), the answer
 * says nothing about the video, so the player stays.
 */
export async function demoVideoPlayable(id: string): Promise<boolean> {
  if (last?.id === id && Date.now() - last.at < DEMO_VIDEO_CHECK_TTL_MS) return last.playable;
  let playable = true;
  try {
    const res = await fetch(demoOembedUrl(id), { cache: "no-store", signal: AbortSignal.timeout(DEMO_VIDEO_CHECK_TIMEOUT_MS) });
    playable = !DEMO_VIDEO_UNAVAILABLE_STATUSES.has(res.status);
  } catch {
    playable = true;
  }
  last = { id, at: Date.now(), playable };
  return playable;
}
