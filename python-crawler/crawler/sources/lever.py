"""
Lever Postings API — a public, unauthenticated API Lever publishes for
external consumption of a company's open postings:
https://github.com/lever/postings-api

`company` is the identifier in a company's Lever careers URL
(jobs.lever.co/<company>).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

from ..http_client import PoliteHTTPClient
from ..models import JobPosting
from .base import JobSource

API_BASE = "https://api.lever.co/v0/postings"


@dataclass
class LeverSource(JobSource):
    company: str
    name: str = "lever"

    def fetch(self, client: PoliteHTTPClient) -> Iterable[JobPosting]:
        url = f"{API_BASE}/{self.company}?mode=json"
        data = client.get_json(url)
        for job in data:
            categories = job.get("categories") or {}
            location = categories.get("location")
            yield JobPosting(
                source=f"lever:{self.company}",
                external_id=str(job["id"]),
                title=job.get("text", ""),
                company=self.company,
                url=job.get("hostedUrl", ""),
                location=location,
                remote=bool(location and "remote" in location.lower()),
                description=job.get("descriptionPlain"),
                tags=tuple(job.get("tags") or ()),
                posted_at=_epoch_ms_to_iso(job.get("createdAt")),
            )


def _epoch_ms_to_iso(value: int | None) -> str | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat()
