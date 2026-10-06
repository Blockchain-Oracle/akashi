import type { NowSchemas } from "@akashi/api-client";

import { isoClock, isoDate } from "@/lib/format";

import { NowList } from "./NowList";
import { ProvenanceBar } from "./Provenance";
import { VerdictStamp } from "./VerdictStamp";

type Fx = NowSchemas["FxResult"];
type Time = NowSchemas["TimeResult"];
type Weather = NowSchemas["WeatherResult"];
type Stock = NowSchemas["StockQuote"];
type Fact = NowSchemas["FactResult"];
type Provenance = NowSchemas["Provenance"];

const RATE_DECIMALS = 4;
const PRICE_DECIMALS = 2;

function Frame({ label, provenance, children }: { label: string; provenance?: Provenance; children: React.ReactNode }) {
  return (
    <article className="card px-6 py-6">
      <div className="label">{label}</div>
      {children}
      {provenance && <ProvenanceBar p={provenance} />}
    </article>
  );
}

/** The answer itself, set large in the display face with tabular figures. */
function Big({ value, unit }: { value: string; unit?: string }) {
  return (
    <p className="mt-3 font-display text-5xl leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-6xl">
      {value}
      {unit && <span className="ml-2 font-sans text-xl font-medium text-muted-foreground sm:text-2xl">{unit}</span>}
    </p>
  );
}

function FxView({ r }: { r: Fx }) {
  return (
    <Frame label={`${r.base} → ${r.quote} · ${r.date}`} provenance={r.provenance}>
      <Big value={r.rate.toFixed(RATE_DECIMALS)} unit={r.quote} />
      {r.converted !== null && r.converted !== undefined && (
        <p className="mt-2 text-[15px] text-muted-foreground">
          {r.amount} {r.base} = {r.converted} {r.quote}
        </p>
      )}
      <ul className="well mt-5 divide-y divide-border font-mono text-xs">
        {r.providers.map((p) => (
          <li key={p.provider} className="flex items-center gap-3 px-4 py-2">
            <span className="min-w-0 truncate">{p.name}</span>
            <span className="leader" aria-hidden />
            <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{p.rate}</span> · {p.date}
              <VerdictStamp word={p.freshness} size="sm" />
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function TimeView({ r }: { r: Time }) {
  return (
    <Frame label={r.matched ?? r.zone} provenance={r.provenance}>
      <Big value={isoClock(r.local_time)} unit={`UTC${r.utc_offset}`} />
      <p className="mt-2 text-[15px] text-muted-foreground">
        {isoDate(r.local_time)} · {r.abbreviation} · {r.is_dst ? "daylight saving" : "standard time"}
      </p>
      {r.next_transition && (
        <p className="mt-1 text-[15px] text-muted-foreground">
          Next change {isoDate(r.next_transition.at)}: UTC{r.next_transition.offset_before} → UTC{r.next_transition.offset_after}
        </p>
      )}
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">tz database {r.tzdb_version}</p>
    </Frame>
  );
}

function WeatherView({ r }: { r: Weather }) {
  const details = [
    r.conditions,
    r.wind_speed_ms !== null && r.wind_speed_ms !== undefined ? `wind ${r.wind_speed_ms} m/s` : null,
    r.humidity_pct !== null && r.humidity_pct !== undefined ? `humidity ${r.humidity_pct}%` : null,
  ].filter(Boolean);
  return (
    <Frame label={r.place ?? `${r.lat}, ${r.lon}`} provenance={r.provenance}>
      <Big value={r.temperature_c === null || r.temperature_c === undefined ? "—" : `${Math.round(r.temperature_c)}°`} unit="C" />
      <p className="mt-2 text-[15px] text-muted-foreground">{details.join(" · ")}</p>
      {(r.alerts?.length ?? 0) > 0 && <p className="mt-2 text-[15px] font-medium text-verdict-mismatch">{r.alerts?.join(" · ")}</p>}
    </Frame>
  );
}

function StockView({ r }: { r: Stock }) {
  if (r.status !== "ok") {
    return (
      <Frame label={r.symbol} provenance={r.provenance}>
        <div className="mt-3">
          <VerdictStamp word={r.status} size="lg" />
        </div>
        {(r.suggestions?.length ?? 0) > 0 && (
          <p className="mt-4 text-[15px]">
            Did you mean <span className="font-mono font-semibold text-link">{r.suggestions?.map((s) => s.symbol).join(", ")}</span>?
          </p>
        )}
      </Frame>
    );
  }
  return (
    <Frame label={`${r.symbol} · ${r.name ?? ""}`} provenance={r.provenance}>
      <Big value={r.price?.toFixed(PRICE_DECIMALS) ?? "—"} unit={r.currency ?? undefined} />
      <p className="mt-2 text-[15px] text-muted-foreground">
        {r.change_pct !== null && r.change_pct !== undefined ? `${r.change_pct > 0 ? "+" : ""}${r.change_pct}% · ` : ""}
        {r.price_is_close ? `close of ${r.session_date}` : "latest trade"} · market {r.market.state.replace("_", " ")}
      </p>
      {r.close_check && (
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          close {r.close_check.session_date}: Twelve Data {r.close_check.twelvedata} · Massive {r.close_check.massive}
        </p>
      )}
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">demo-grade · not for redistribution</p>
    </Frame>
  );
}

function FactView({ r }: { r: Fact }) {
  return (
    <Frame label={`${r.property_label ?? r.property_pid} of ${r.subject_label ?? r.subject_qid}`} provenance={r.provenance}>
      <p className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-pretty sm:text-4xl">{r.values.map((v) => v.value).join(", ") || "—"}</p>
      {r.values[0]?.start && <p className="mt-1 text-[15px] text-muted-foreground">since {r.values[0].start}</p>}
    </Frame>
  );
}

/** A Live Facts answer: the value first, then how current it is and whether the sources agree. */
export function NowSheet({ results }: { results: { kind: string }[] }) {
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
