import { SERVICE_ROUTES } from "@akashi/api-client";
import { SERVICE_ORDER, SERVICES } from "@akashi/brand";
import Link from "next/link";

const POST = "POST ";

/** The three services as ledger rows: kanji, name, dot leader, capability ID, summary and POST endpoints. */
export function ServiceLedger() {
  return (
    <ol className="ledger not-prose">
      {SERVICE_ORDER.map((key) => {
        const service = SERVICES[key];
        const endpoints = SERVICE_ROUTES[service.id]
          .filter((route) => route.startsWith(POST))
          .map((route) => route.slice(POST.length));
        return (
          <li key={key} className="ledger-row">
            <span className="ledger-kanji" aria-hidden>
              {service.kanji}
            </span>
            <div>
              <div className="ledger-head">
                <Link href={`/services/${key}`} className="ledger-name">
                  {service.name}
                </Link>
                <span className="ledger-leader" aria-hidden />
                <code className="ledger-id">{service.id}</code>
              </div>
              <p className="ledger-summary">{service.summary}</p>
              <p className="ledger-endpoints">POST {endpoints.join(" · ")}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
