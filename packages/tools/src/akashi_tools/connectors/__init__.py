"""Every connector package under here registers its endpoints on import; `load()` imports them all."""

import importlib
import pkgutil
from functools import lru_cache


@lru_cache(maxsize=1)
def load() -> int:
    """Import every module below this package once; returns how many endpoints are registered."""
    from akashi_tools.framework.endpoint import REGISTRY

    for module in pkgutil.walk_packages(__path__, prefix=f"{__name__}."):
        importlib.import_module(module.name)
    return len(REGISTRY)
