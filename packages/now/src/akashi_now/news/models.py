"""/news request and result."""

from typing import Literal

from pydantic import BaseModel, Field

from akashi_core.contract.fields import UntrustedStr
from akashi_now.constants import (
    NEWS_DEFAULT_LIMIT,
    NEWS_DEFAULT_SINCE_HOURS,
    NEWS_MAX_LIMIT,
    NEWS_MAX_QUERY_CHARS,
    NEWS_MAX_SINCE_HOURS,
)
from akashi_now.provenance import Provenance


class NewsRequest(BaseModel):
    query: str = Field(min_length=1, max_length=NEWS_MAX_QUERY_CHARS)
    since_hours: int = Field(default=NEWS_DEFAULT_SINCE_HOURS, ge=1, le=NEWS_MAX_SINCE_HOURS)
    country: str | None = Field(default=None, min_length=2, max_length=2, description="ISO 3166-1 alpha-2 mentioned")
    limit: int = Field(default=NEWS_DEFAULT_LIMIT, ge=1, le=NEWS_MAX_LIMIT)


class NewsStory(BaseModel):
    kind: Literal["news_story"] = "news_story"
    title: UntrustedStr
    url: str
    domain: str
    seen_at: str  # when the source (GDELT crawl / HN submission) first saw it
    source: Literal["gdelt", "hn"]
    also_in: list[str] = Field(default_factory=list)  # the other source when both carried it
    points: int | None = None  # HN score
    provenance: Provenance
