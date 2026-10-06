/**
 * A hand-drawn highlighter stroke, laid under a headline keyword by `.key` (tokens/theme.css) and drawn in once by
 * `.marker-stroke`. After Superthread's hero and the 21st.dev Text Highlighter (18772), as a single SVG path.
 */
export function MarkerStroke() {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden>
      <path className="marker-stroke" d="M10 28 C 90 10, 170 34, 250 18 S 350 26, 390 14" />
    </svg>
  );
}
