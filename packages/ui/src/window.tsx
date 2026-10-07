import type { ReactNode } from "react";

import { cn } from "./cn";

/**
 * A terminal window (HTTPie's product windows, specs/ui-v3-httpie.md §4): the console theme, a title bar with three
 * dots and a mono title, the one real shadow. Shared by the web app (the desk, the readout, the service windows) and
 * the docs (the curl quickstart). The `.window*` classes live in packages/brand/tokens/theme.css.
 */
export function Window({
  title,
  right,
  children,
  className,
  barClassName,
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("window console", className)}>
      <div className={cn("window-bar", barClassName)}>
        <span className="window-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">{title}</span>
        {right && <span className="shrink-0 tabular-nums">{right}</span>}
      </div>
      {children}
    </div>
  );
}
