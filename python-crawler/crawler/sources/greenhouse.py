"""
Greenhouse Job Board API — a public, unauthenticated API that Greenhouse
publishes specifically so job data can be consumed by external tools:
https://developers.greenhouse.io/job-board.html

`board_token` is the identifier Greenhouse assigns to a company's job board
(visible in that company's careers URL, e.g. boards.greenhouse.io/<token>).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from ..http_client import PoliteHTTPClient
from ..models import JobPosting
from .base import JobSource

API_BASE = "https://boards-api.greenhouse.io/v1/boards"


@dataclass
class GreenhouseSource(JobSource):
    board_token: str
    name: str = "greenhouse"

    def fetch(self, client: PoliteHTTPClient) -> Iterable[JobPosting]:
        url = f"{API_BASE}/{self.board_token}/jobs?content=true"
        data = client.get_json(url)
        for job in data.get("jobs", []):
            location = (job.get("location") or {}).get("name")
            yield JobPosting(
                source=f"greenhouse:{self.board_token}",
                external_id=str(job["id"]),
                title=job.get("title", ""),
                company=self.board_token,
                url=job.get("absolute_url", ""),
                location=location,
                remote=bool(location and "remote" in location.lower()),
                description=job.get("content"),
                posted_at=job.get("updated_at"),
            )
