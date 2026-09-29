"""The NLI model, loaded on first use and dropped after IDLE_UNLOAD_S without requests."""

import asyncio
import json
import time
from dataclasses import dataclass
from pathlib import Path

import anyio
import numpy as np
import onnxruntime as ort
import structlog
from tokenizers import Tokenizer

from akashi_nli.constants import (
    CONFIG_FILE,
    IDLE_CHECK_S,
    IDLE_UNLOAD_S,
    INTRA_OP_THREADS,
    MAX_TOKENS,
    MODEL_FILE,
    PAD_TOKEN,
    RUN_CONCURRENCY,
    TOKENIZER_FILE,
)

log = structlog.get_logger(__name__)


@dataclass(slots=True)
class _Loaded:
    session: ort.InferenceSession
    tokenizer: Tokenizer
    labels: list[str]
    input_names: set[str]


def _load(model_dir: Path) -> _Loaded:
    options = ort.SessionOptions()
    options.intra_op_num_threads = INTRA_OP_THREADS
    options.enable_cpu_mem_arena = False  # memory goes back to the OS when the session is dropped
    session = ort.InferenceSession(str(model_dir / MODEL_FILE), options, providers=["CPUExecutionProvider"])
    tokenizer = Tokenizer.from_file(str(model_dir / TOKENIZER_FILE))
    tokenizer.enable_truncation(MAX_TOKENS, strategy="only_first")
    tokenizer.enable_padding(pad_id=tokenizer.token_to_id(PAD_TOKEN) or 0, pad_token=PAD_TOKEN)
    id2label = json.loads((model_dir / CONFIG_FILE).read_text())["id2label"]
    labels = [id2label[str(i)] for i in range(len(id2label))]
    return _Loaded(session, tokenizer, labels, {i.name for i in session.get_inputs()})


def _run(m: _Loaded, pairs: list[tuple[str, str]]) -> list[dict[str, float]]:
    enc = m.tokenizer.encode_batch(pairs)
    feed = {
        "input_ids": np.array([e.ids for e in enc], dtype=np.int64),
        "attention_mask": np.array([e.attention_mask for e in enc], dtype=np.int64),
    }
    if "token_type_ids" in m.input_names:  # this export has none; other exports do
        feed["token_type_ids"] = np.array([e.type_ids for e in enc], dtype=np.int64)
    logits = np.asarray(m.session.run(None, feed)[0], dtype=np.float32)
    shifted = np.exp(logits - logits.max(axis=1, keepdims=True))
    probs = shifted / shifted.sum(axis=1, keepdims=True)
    return [{label: round(float(p), 4) for label, p in zip(m.labels, row, strict=True)} for row in probs]


class NliModel:
    def __init__(self, model_dir: Path) -> None:
        self._dir = model_dir
        self._loaded: _Loaded | None = None
        self._load_lock = asyncio.Lock()
        self._run_gate = asyncio.Semaphore(RUN_CONCURRENCY)
        self._last_used = 0.0
        self._tasks: set[asyncio.Task[_Loaded]] = set()  # strong refs for fire-and-forget loads

    @property
    def loaded(self) -> bool:
        return self._loaded is not None

    async def _ensure_loaded(self) -> _Loaded:
        async with self._load_lock:
            if self._loaded is None:
                started = time.monotonic()
                self._loaded = await anyio.to_thread.run_sync(_load, self._dir)
                log.info("nli_loaded", seconds=round(time.monotonic() - started, 2))
            return self._loaded

    def spawn_load(self) -> None:
        self._last_used = time.monotonic()
        task = asyncio.create_task(self._ensure_loaded())
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def score(self, pairs: list[tuple[str, str]]) -> list[dict[str, float]]:
        self._last_used = time.monotonic()
        loaded = await self._ensure_loaded()
        async with self._run_gate:
            return await anyio.to_thread.run_sync(_run, loaded, pairs)

    async def unload_when_idle(self) -> None:
        while True:
            await asyncio.sleep(IDLE_CHECK_S)
            idle = time.monotonic() - self._last_used
            if self._loaded is not None and idle >= IDLE_UNLOAD_S and not self._run_gate.locked():
                async with self._load_lock:
                    self._loaded = None
                log.info("nli_unloaded", idle_s=round(idle))
