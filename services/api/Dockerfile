# akashi-api — FastAPI serving citation-verify (/cite), code-reality-check (/code), live-facts (/now).
# Build context: repo root. Pattern: uv docs "Intermediate layers in workspaces" + non-editable multi-stage.

ARG PYTHON_VERSION=3.13
FROM python:${PYTHON_VERSION}-slim AS builder
# eyecite → fast-diff-match-patch has no cp313 manylinux wheel: compile it here (the runtime stage stays compiler-free).
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /uvx /bin/
ENV UV_PYTHON_DOWNLOADS=0 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app

# 1) dependencies only (member pyproject files are not present yet → --frozen)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-workspace --no-dev --package akashi-api

# 2) workspace source, then the members themselves (non-editable so .venv is self-contained)
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-editable --no-dev --package akashi-api

FROM python:${PYTHON_VERSION}-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 akashi
COPY --from=builder --chown=akashi:akashi /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONTZPATH="" \
    AKASHI_ENV=production
USER akashi
WORKDIR /app
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD curl -fsS http://localhost:8000/v1/health || exit 1
# One worker (NLI model is per-process); no --limit-concurrency (it answers with a plain-text 503).
CMD ["uvicorn", "akashi_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", \
     "--loop", "uvloop", "--http", "httptools", "--no-server-header", "--timeout-keep-alive", "75"]
