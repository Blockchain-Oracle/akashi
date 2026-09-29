"""Field types for text that comes from third parties."""

from typing import Annotated

from pydantic import PlainSerializer

from akashi_core.safety import scrub_tier3

# Every upstream-derived string (titles, case names, descriptions, headlines) uses this type so gateway
# trigger phrases can never appear verbatim in a success body.
UntrustedStr = Annotated[str, PlainSerializer(scrub_tier3, return_type=str)]
