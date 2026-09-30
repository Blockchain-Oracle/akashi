#!/usr/bin/env python3
"""Measure p50/p95 per service against the targets in akashi_core.constants.deadlines (S6 gate).

Usage:
  python3 scripts/latency.py --api-base https://api.<domain> [--concurrency 4] [--rounds 2]

Round 1 is mostly cold (distinct inputs); later rounds repeat them and show the warm path. A request fails the
gate if it is not a 2xx JSON object. Standard library only.
"""

import argparse
import json
import statistics
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

REQUEST_TIMEOUT_S = 30
PERCENTILE_P95 = 95
PERCENTILES_N = 100
# Mirrors akashi_core.constants.deadlines (this script runs without the workspace installed).
TARGET_P95_S = {"cite": 6.0, "code": 6.5, "now": 3.0}

CORPUS: dict[str, list[tuple[str, dict]]] = {
    "cite": [
        ("/v1/verify", {"citations": ["Brown v. Board of Education, 347 U.S. 483 (1954)"]}),
        ("/v1/verify", {"citations": ["Vaswani et al. (2017). Attention Is All You Need. NeurIPS."]}),
        ("/v1/verify", {"citations": ["https://doi.org/10.1038/nature14539"]}),
        ("/v1/verify", {"citations": ["Srivastava et al. (2014). Dropout. JMLR 15:1929-1958."]}),
        (
            "/v1/verify",
            {
                "citations": [
                    "Roe v. Wade, 410 U.S. 113 (1973)",
                    "doi:10.1126/science.1225829",
                    "He et al. 2016, Deep Residual Learning for Image Recognition, CVPR",
                    "Smith, J. (2019). Quantum gravity of kittens. Nature 999:1-2.",
                ]
            },
        ),
        (
            "/v1/claim",
            {
                "claim": "Aspirin reduces the risk of heart attack.",
                "evidence_text": "Low-dose aspirin lowered the incidence of myocardial infarction in the trial.",
            },
        ),
    ],
    "code": [
        ("/v1/package", {"ecosystem": "pypi", "name": "reqeusts"}),
        ("/v1/package", {"ecosystem": "npm", "name": "left-pad"}),
        ("/v1/package", {"ecosystem": "cargo", "name": "serde"}),
        ("/v1/versions", {"ecosystem": "npm", "name": "react"}),
        ("/v1/symbol", {"ecosystem": "npm", "package": "axios", "version": "1.7.9", "symbol": "AxiosInstance.get"}),
        ("/v1/symbol", {"ecosystem": "pypi", "package": "requests", "symbol": "Session.get"}),
        ("/v1/symbol", {"ecosystem": "go", "package": "github.com/gorilla/mux", "symbol": "NewRouter"}),
        ("/v1/check", {"language": "python", "code": "import numpy as np\nnp.arange(3).fastsum()\n"}),
        ("/v1/check", {"language": "typescript", "code": "import { z } from 'zod';\nz.string().emailish();\n"}),
    ],
    "now": [
        ("/v1/time", {"place": "Edmonton"}),
        ("/v1/time", {"zone": "Asia/Kolkata"}),
        ("/v1/holidays", {"country": "DE", "year": 2026, "subdivision": "BY"}),
        ("/v1/business-days", {"country": "US", "start": "2026-12-20", "add_days": 5}),
        ("/v1/fx", {"base": "USD", "quotes": ["EUR", "JPY"]}),
        ("/v1/weather", {"place": "New York"}),
        ("/v1/weather", {"lat": 59.91, "lon": 10.75}),
        ("/v1/fact", {"subject": "Apple Inc.", "property": "CEO"}),
        ("/v1/news", {"query": "election"}),
        ("/v1/jobs", {"query": "backend engineer", "remote": True}),
    ],
}


def _call(url: str, body: dict) -> tuple[float, bool, str]:
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"content-type": "application/json"}, method="POST"
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as resp:
            payload = resp.read()
            ok = payload[:1] == b"{"
            detail = str(resp.status)
    except urllib.error.HTTPError as err:
        ok, detail = False, f"{err.code} {err.read()[:120]!r}"
    except OSError as err:
        ok, detail = False, type(err).__name__
    return time.perf_counter() - started, ok, detail


def _p95(samples: list[float]) -> float:
    if len(samples) == 1:
        return samples[0]
    return statistics.quantiles(samples, n=PERCENTILES_N, method="inclusive")[PERCENTILE_P95 - 1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--api-base", required=True)
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument("--rounds", type=int, default=2)
    args = parser.parse_args()
    base = args.api_base.rstrip("/")
    failed = False
    for prefix, cases in CORPUS.items():
        for round_no in range(1, args.rounds + 1):
            with ThreadPoolExecutor(args.concurrency) as pool:
                results = list(pool.map(lambda c, p=prefix: (c[0], *_call(f"{base}/{p}{c[0]}", c[1])), cases))
            times = [t for _, t, _, _ in results]
            p95 = _p95(times)
            errors = [(path, detail) for path, _, ok, detail in results if not ok]
            within = p95 <= TARGET_P95_S[prefix]
            failed |= bool(errors) or (round_no > 1 and not within)
            print(
                f"{prefix:5} round {round_no}: n={len(times)} p50={statistics.median(times):.2f}s "
                f"p95={p95:.2f}s max={max(times):.2f}s target={TARGET_P95_S[prefix]}s "
                f"{'OK' if within else 'OVER'}"
            )
            for path, detail in errors:
                print(f"      FAIL {path}: {detail}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
