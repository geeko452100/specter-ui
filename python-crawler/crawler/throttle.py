"""
Enforces a minimum gap between requests to the same host — the main
mechanism keeping this crawler from ever hammering a server.

The pipeline runs sources sequentially (one request in flight at a time, no
concurrency), so this only needs to track the last request time per host,
not guard against concurrent access.
"""

from __future__ import annotations

import time
from urllib.parse import urlparse


class DomainThrottle:
    def __init__(self, default_min_interval: float = 3.0) -> None:
        self._default_min_interval = default_min_interval
        self._min_interval: dict[str, float] = {}
        self._last_request_at: dict[str, float] = {}

    def set_min_interval(self, host: str, seconds: float) -> None:
        current = self._min_interval.get(host, self._default_min_interval)
        # Never go faster than a site's own robots.txt Crawl-delay — take
        # whichever of the two is more conservative.
        self._min_interval[host] = max(current, seconds)

    def wait(self, url: str) -> None:
        host = urlparse(url).hostname or ""
        min_interval = self._min_interval.get(host, self._default_min_interval)
        last = self._last_request_at.get(host)
        if last is not None:
            remaining = min_interval - (time.monotonic() - last)
            if remaining > 0:
                time.sleep(remaining)
        self._last_request_at[host] = time.monotonic()
