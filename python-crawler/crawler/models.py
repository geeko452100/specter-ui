from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class JobPosting:
    source: str
    external_id: str
    title: str
    company: str
    url: str
    location: str | None = None
    remote: bool | None = None
    description: str | None = None
    tags: tuple[str, ...] = field(default_factory=tuple)
    posted_at: str | None = None  # ISO 8601, when the source provides it
