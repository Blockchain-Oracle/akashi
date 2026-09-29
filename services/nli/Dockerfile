# syntax=docker/dockerfile:1.7
# akashi-nli — DeBERTa-v3 NLI sidecar for citation-verify /claim. Internal only (no public domain).
# Build context: repo root. Model: fp32 ONNX pinned to a commit + sha256 (the 8-bit exports failed the
# fp32-agreement gate: docs/plan/decisions.md D-016).

ARG PYTHON_VERSION=3.13
FROM python:${PYTHON_VERSION}-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /uvx /bin/
ENV UV_PYTHON_DOWNLOADS=0 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-workspace --no-dev --package akashi-nli
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-editable --no-dev --package akashi-nli

FROM python:${PYTHON_VERSION}-slim
ARG HF=https://huggingface.co/Xenova/DeBERTa-v3-base-mnli-fever-anli/resolve/72a1ce83a0144efaf828b3c3844320a61197a53d
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 akashi
ADD --chmod=444 --checksum=sha256:e57f99375329a2318d9cf67ef683e6cfcc8c3e57f313ab2f2809e0a2c93fdad4 ${HF}/onnx/model.onnx /models/model.onnx
ADD --chmod=444 --checksum=sha256:a86f883318afa11c8c10466f1bf4efaeb6ded28a52cbe57217a8fa0d0a2a87df ${HF}/tokenizer.json /models/tokenizer.json
ADD --chmod=444 --checksum=sha256:4a5f8b1df58dba69e3588255c297e6ad1a70dc8b6312990959f3a3032c892738 ${HF}/config.json /models/config.json
COPY --from=builder --chown=akashi:akashi /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    AKASHI_ENV=production \
    AKASHI_NLI_MODEL_DIR=/models
USER akashi
WORKDIR /app
EXPOSE 8100
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD curl -fsS http://localhost:8100/health || exit 1
CMD ["uvicorn", "akashi_nli.main:app", "--host", "0.0.0.0", "--port", "8100", "--workers", "1", \
     "--loop", "uvloop", "--http", "httptools", "--no-server-header"]
