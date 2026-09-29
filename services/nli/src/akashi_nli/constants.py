"""NLI sidecar constants. Model choice and its evidence: docs/plan/decisions.md D-016."""

from typing import Final

MODEL_ID: Final = "deberta-v3-base-mnli-fever-anli"  # MoritzLaurer (MIT), ONNX export Xenova @72a1ce83, fp32
MODEL_FILE: Final = "model.onnx"
TOKENIZER_FILE: Final = "tokenizer.json"
CONFIG_FILE: Final = "config.json"
PAD_TOKEN: Final = "[PAD]"

MAX_TOKENS: Final = 256  # premise truncated first ("only_first"); claims are short
MAX_PAIRS: Final = 16
BATCH_SIZE: Final = 4  # length-sorted mini-batches: little padding, still vectorized
MAX_TEXT_CHARS: Final = 2_000
INTRA_OP_THREADS: Final = 2  # 4 vCPU box shared with other services
RUN_CONCURRENCY: Final = 1  # one batch at a time: ORT already uses INTRA_OP_THREADS
IDLE_UNLOAD_S: Final = 900.0  # ~1.4 GB resident while loaded: give it back after 15 idle minutes
IDLE_CHECK_S: Final = 60.0
