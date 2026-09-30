import type { NowSchemas } from "@akashi/api-client";

import { isoClock, isoDate } from "@/lib/format";

import { NowList } from "./NowList";
import { ProvenanceBar } from "./Provenance";
import { VerdictSeal } from "./VerdictSeal";

type Fx = NowSchemas["FxResult"];
type Time = NowSchemas["TimeResult"];
type Weather = NowSchemas["WeatherResult"];
type Stock = NowSchemas["StockQuote"];
type Fact = NowSchemas["FactResult"];

const RATE_DECIMALS = 4;

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="font-mono text-muted-foreground text-xs uppercase tracking-widest">{label}</div>
      {children}
    </article>
  );
}

function Big({ value, unit }: { value: string; unit?: string }) {
  return (
    <p className="mt-3 font-display text-5xl tabular-nums leading-none">
      {value}
      {unit && <span className="ml-2 text-2xl text-muted-foreground">{unit}</span>}
    </p>
  );
}

function FxView({ r }: { r: Fx }) {
  return (
    <Frame label={`${r.base} → ${r.quote} · ${r.date}`}>
      <Big value={r.rate.toFixed(RATE_DECIMALS)} unit={r.quote} />
      {r.converted !== null && r.converted !== undefined && (
        <p className="mt-2 text-muted-foreground text-sm">
          {r.amount} {r.base} = {r.converted} {r.quote}
        </p>
      )}
      <ul className="mt-4 space-y-1 font-mono text-xs">
        {r.providers.map((p) => (
          <li key={p.provider} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate">{p.name}</span>
            <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-muted-foreground">
              {p.rate} · {p.date}
              <VerdictSeal word={p.freshness} size="sm" />
            </span>
          </li>
        ))}
      </ul>
      <ProvenanceBar p={r.provenance} />
    </Frame>
  );
}

function TimeView({ r }: { r: Time }) {
  const local = isoClock(r.local_time);
  return (
    <Frame label={r.matched ?? r.zone}>
      <Big value={local} unit={`UTC${r.utc_offset}`} />
      <p className="mt-2 text-muted-foreground text-sm">
        {isoDate(r.local_time)} · {r.abbreviation} · {r.is_dst ? "daylight saving" : "standard time"}
      </p>
      {r.next_transition && (
        <p className="mt-1 text-muted-foreground text-sm">
          Next change {isoDate(r.next_transition.at)}: UTC{r.next_transition.offset_before} → UTC{r.next_transition.offset_after}
        </p>
      )}
      <p className="mt-1 font-mono text-muted-foreground text-xs">tz database {r.tzdb_version}</p>
      <ProvenanceBar p={r.provenance} />
    </Frame>
  );
}

function WeatherView({ r }: { r: Weather }) {
  return (
    <Frame label={r.place ?? `${r.lat}, ${r.lon}`}>
      <Big value={r.temperature_c === null || r.temperature_c === undefined ? "—" : `${Math.round(r.temperature_c)}°`} unit="C" />
      <p className="mt-2 text-muted-foreground text-sm">
        {[r.conditions, r.wind_speed_ms !== null && r.wind_speed_ms !== undefined ? `wind ${r.wind_speed_ms} m/s` : null, r.humidity_pct !== null && r.humidity_pct !== undefined ? `humidity ${r.humidity_pct}%` : null]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {(r.alerts?.length ?? 0) > 0 && <p className="mt-2 text-sm text-verdict-mismatch">{r.alerts?.join(" · ")}</p>}
      <ProvenanceBar p={r.provenance} />
    </Frame>
  );
}

function StockView({ r }: { r: Stock }) {
  if (r.status !== "ok") {
    return (
      <Frame label={r.symbol}>
        <div className="mt-3">
          <VerdictSeal word={r.status} size="lg" />
        </div>
        {(r.suggestions?.length ?? 0) > 0 && (
          <p className="mt-3 text-sm">
            Did you mean <span className="font-mono text-primary">{r.suggestions?.map((s) => s.symbol).join(", ")}</span>?
          </p>
        )}
        <ProvenanceBar p={r.provenance} />
      </Frame>
    );
  }
  return (
    <Frame label={`${r.symbol} · ${r.name ?? ""}`}>
      <Big value={r.price?.toFixed(2) ?? "—"} unit={r.currency ?? undefined} />
      <p className="mt-2 text-muted-foreground text-sm">
        {r.change_pct !== null && r.change_pct !== undefined ? `${r.change_pct > 0 ? "+" : ""}${r.change_pct}% · ` : ""}
        {r.price_is_close ? `close of ${r.session_date}` : "latest trade"} · market {r.market.state.replace("_", " ")}
      </p>
      {r.close_check && (
        <p className="mt-1 font-mono text-muted-foreground text-xs">
          close {r.close_check.session_date}: Twelve Data {r.close_check.twelvedata} · Massive {r.close_check.massive}
        </p>
      )}
      <ProvenanceBar p={r.provenance} />
      <p className="mt-2 font-mono text-muted-foreground text-[11px]">demo-grade · not for redistribution</p>
    </Frame>
  );
}

function FactView({ r }: { r: Fact }) {
  return (
    <Frame label={`${r.property_label ?? r.property_pid} of ${r.subject_label ?? r.subject_qid}`}>
      <p className="mt-3 font-display text-3xl">{r.values.map((v) => v.value).join(", ") || "—"}</p>
      {r.values[0]?.start && <p className="mt-1 text-muted-foreground text-sm">since {r.values[0].start}</p>}
      <ProvenanceBar p={r.provenance} />
    </Frame>
  );
}

/** A Live Facts answer: the value first, then how current it is and whether the sources agree. */
export function NowCard({ results }: { results: { kind: string }[] }) {
  const first = results[0];
  if (!first) return null;
  switch (first.kind) {
    case "fx_rate":
      return (
        <div className="space-y-4">
          {(results as Fx[]).map((r) => (
            <FxView key={r.quote} r={r} />
          ))}
        </div>
      );
    case "time":
      return <TimeView r={first as Time} />;
    case "weather":
      return <WeatherView r={first as Weather} />;
    case "quote":
      return (
        <div className="space-y-4">
          {(results as Stock[]).map((r) => (
            <StockView key={r.symbol} r={r} />
          ))}
        </div>
      );
    case "fact":
      return <FactView r={first as Fact} />;
    default:
      return <NowList results={results} />;
  }
}
