// From 21st.dev dillionverma/border-beam (id 1268, Magic UI, MIT), via the user's Logos Kit docs:
// a light running around a card's border. Akashi colours; keyframes in app/global.css.
import { cn } from "@/lib/cn";

const DEFAULT_SIZE = 220;
const DEFAULT_DURATION_S = 12;
const DEFAULT_ANCHOR_PCT = 90;
const DEFAULT_BORDER_PX = 1.5;

export function BorderBeam({
  className,
  size = DEFAULT_SIZE,
  duration = DEFAULT_DURATION_S,
  anchor = DEFAULT_ANCHOR_PCT,
  borderWidth = DEFAULT_BORDER_PX,
  colorFrom = "var(--primary)",
  colorTo = "var(--verdict-verified)",
  delay = 0,
}: {
  className?: string;
  size?: number;
  duration?: number;
  anchor?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}) {
  return (
    <div
      aria-hidden
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className,
      )}
    />
  );
}
