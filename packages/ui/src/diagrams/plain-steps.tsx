import { cn } from "../cn";

const STEPS = [
  { title: "An AI is about to say something", body: "a source, a piece of code, today's rate" },
  { title: "It asks Akashi first", body: "and pays half a cent, like a vending machine" },
  { title: "Akashi looks it up", body: "in the original records, several at once" },
  { title: "It gets an answer with proof", body: "a clear verdict and where it was checked" },
] as const;

const PAD = 2;

/** How Akashi works, in four everyday steps: numbered lemon badges, no cards (cdr-kit's steps; 21st 29866). */
export function PlainSteps({ className }: { className?: string }) {
  return (
    <ol className={cn("not-prose grid gap-8 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-(--radius) bg-marker font-mono text-sm font-semibold text-marker-foreground">
            {String(i + 1).padStart(PAD, "0")}
          </span>
          <div>
            <div className="text-[17px] leading-snug font-semibold">{s.title}</div>
            <p className="mt-1.5 text-pretty text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
