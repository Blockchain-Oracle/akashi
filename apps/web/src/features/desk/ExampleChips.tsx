import { EXAMPLES } from "@/lib/constants/desk";

/** Real cases, one tap each (the 21st.dev AI Suggestions pattern, pacekit 20132). */
export function ExampleChips({ onPick }: { onPick: (input: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {EXAMPLES.map((e) => (
        <button
          key={e.label}
          type="button"
          onClick={() => onPick(e.input)}
          className="rounded-chip border border-border bg-card px-3 py-1.5 text-muted-foreground text-xs transition hover:border-primary hover:text-foreground"
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}
