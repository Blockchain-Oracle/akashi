/**
 * The narrated demo film on YouTube. Set the video id once it is published (the part after `watch?v=`); until then
 * /demo shows the cover and the walkthrough you can do yourself.
 */
export const DEMO_VIDEO_ID: string | null = null;
export const demoVideoUrl = (id: string) => `https://youtu.be/${id}`;
/** Played through YouTube's no-cookie player, so watching sets no tracking cookie. */
export const demoEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

export const DEMO_COVER = { src: "/demo/cover.png", width: 1672, height: 941 } as const;
