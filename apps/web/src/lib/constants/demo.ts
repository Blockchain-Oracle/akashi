/**
 * The narrated demo film on YouTube (the part after `youtu.be/`). /demo embeds it once YouTube says it is public or
 * unlisted and embeddable; until then the page shows the cover and the walkthrough you can do yourself.
 */
export const DEMO_VIDEO_ID: string | null = "Y1gWHTdOu_A";
export const demoVideoUrl = (id: string) => `https://youtu.be/${id}`;
/** Played through YouTube's no-cookie player, so watching sets no tracking cookie. */
export const demoEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
/** YouTube's oEmbed answers 200 only for a video anyone with the link can play in an embed. */
export const demoOembedUrl = (id: string) =>
  `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
/** How long one availability answer is reused: a visibility change on YouTube reaches /demo within this time. */
export const DEMO_VIDEO_CHECK_TTL_MS = 300_000;
export const DEMO_VIDEO_CHECK_TIMEOUT_MS = 3_000;
/** oEmbed's answers for a private, embed-disabled or missing video (401, 403, 404); anything else is not a verdict. */
export const DEMO_VIDEO_UNAVAILABLE_STATUSES: ReadonlySet<number> = new Set([401, 403, 404]);

export const DEMO_COVER = { src: "/demo/cover.png", width: 1672, height: 941 } as const;
