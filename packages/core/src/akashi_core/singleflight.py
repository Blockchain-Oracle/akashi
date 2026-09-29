"""Share one in-flight computation per key; optionally let it finish in the background."""

import asyncio
from collections.abc import Awaitable, Callable

import structlog

log = structlog.get_logger(__name__)


class SingleFlight[T]:
    def __init__(self) -> None:
        self._inflight: dict[str, asyncio.Future[T]] = {}

    async def do(self, key: str, fn: Callable[[], Awaitable[T]]) -> T:
        if (fut := self._inflight.get(key)) is not None:
            return await asyncio.shield(fut)
        fut = asyncio.ensure_future(fn())
        self._inflight[key] = fut
        fut.add_done_callback(lambda _: self._inflight.pop(key, None))
        return await asyncio.shield(fut)

    def is_running(self, key: str) -> bool:
        return key in self._inflight


_background: set[asyncio.Task[object]] = set()


def spawn_background(name: str, coro: Awaitable[object]) -> None:
    """Fire-and-forget with a strong reference (asyncio only keeps weak refs to tasks)."""
    task = asyncio.ensure_future(coro)
    _background.add(task)

    def _done(t: asyncio.Task[object]) -> None:
        _background.discard(t)
        if not t.cancelled() and (exc := t.exception()) is not None:
            log.warning("background_task_failed", task=name, error=type(exc).__name__)

    task.add_done_callback(_done)
