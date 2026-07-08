"""
RemoteOK's public API — a JSON endpoint RemoteOK publishes at /api for
programmatic consumption of its listings. Still routed through the same
robots.txt check and rate limiter as every other source, since "public API"
doesn't exempt it from politeness.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from ..http_client import PoliteHTTPClient
from ..models import JobPosting
from .base import JobSource

API_URL = "https://remoteok.com/api"


@dataclass
class RemoteOKSource(JobSource):
    name: str = "remoteok"

    def fetch(self, client: PoliteHTTPClient) -> Iterable[JobPosting]:
        data = client.get_json(API_URL)
        for job in data:
            # The feed's first element is a metadata/legend object, not a
            # posting — it has no "id" field.
            if "id" not in job:
                continue
            yield JobPosting(
                source="remoteok",
                external_id=str(job["id"]),
                title=job.get("position", ""),
                company=job.get("company", ""),
                url=job.get("url", ""),
                location=job.get("location") or "Remote",
                remote=True,
                description=job.get("description"),
                tags=tuple(job.get("tags") or ()),
                posted_at=job.get("date"),
            )
