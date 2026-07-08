"""
We Work Remotely publishes per-category RSS feeds specifically for
syndication/consumption, e.g.
https://weworkremotely.com/categories/remote-programming-jobs.rss
"""

from __future__ import annotations

import hashlib
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Iterable

from ..http_client import PoliteHTTPClient
from ..models import JobPosting
from .base import JobSource

FEED_BASE = "https://weworkremotely.com/categories"


@dataclass
class WeWorkRemotelySource(JobSource):
    category: str = "remote-programming-jobs"
    name: str = "weworkremotely"

    def fetch(self, client: PoliteHTTPClient) -> Iterable[JobPosting]:
        url = f"{FEED_BASE}/{self.category}.rss"
        response = client.get(url)
        root = ET.fromstring(response.text)
        for item in root.iter("item"):
            title = _text(item, "title")
            link = _text(item, "link")
            if not title or not link:
                continue
            company, separator, role = title.partition(": ")
            external_id = hashlib.sha1(link.encode("utf-8")).hexdigest()[:16]
            yield JobPosting(
                source=f"weworkremotely:{self.category}",
                external_id=external_id,
                title=role if separator else title,
                company=company if separator else "",
                url=link,
                location="Remote",
                remote=True,
                description=_text(item, "description"),
                posted_at=_text(item, "pubDate"),
            )


def _text(item: ET.Element, tag: str) -> str | None:
    el = item.find(tag)
    return el.text.strip() if el is not None and el.text else None
