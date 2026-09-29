"""Prometheus metrics on a separate port (plain-text /metrics must never be on the relay path)."""

from prometheus_client import Histogram, start_http_server

UPSTREAM_LATENCY = Histogram("akashi_upstream_seconds", "Upstream call latency", ["upstream", "outcome"])
REQUEST_LATENCY = Histogram("akashi_request_seconds", "Request latency", ["service", "operation"])

_started = False


def start_metrics_server(port: int) -> None:
    global _started
    if not _started:
        start_http_server(port)
        _started = True
