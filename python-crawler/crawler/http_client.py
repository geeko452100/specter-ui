"""
The only place in this codebase allowed to make outbound HTTP requests.
Every request passes through, in order: the hard-coded ToS blocklist, a
robots.txt check, per-host rate limiting, and a circuit breaker that stops
hitting a host after repeated failures. Nothing here retries aggressively or
runs multiple requests to the same host at once — politeness takes priority
over crawl speed.
"""

from __future__ import annotations

import logging
import time
from urllib.parse import urlparse

import requests

from . import robots
from .blocklist import assert_not_blocked
from .throttle import DomainThrottle

logger = logging.getLogger(__name__)


class CircuitOpenError(RuntimeError):
    """Raised when a host has failed too many times in a row and is being skipped."""


class RobotsDisallowedError(RuntimeError):
    """Raised when robots.txt disallows the requested URL."""


class PoliteHTTPClient:
    def __init__(
        self,
        user_agent: str,
        min_interval_seconds: float = 3.0,
        request_timeout: float = 15.0,
        max_consecutive_failures: int = 3,
        max_requests_per_run: int = 500,
    ) -> None:
        if "mailto:" not in user_agent:
            raise ValueError(
                "user_agent must include a contact email (mailto:...) so a "
                "site operator can reach you about this crawler's traffic."
            )
        self._user_agent = user_agent
        self._timeout = request_timeout
        self._max_consecutive_failures = max_consecutive_failures
        self._max_requests_per_run = max_requests_per_run
        self._throttle = DomainThrottle(default_min_interval=min_interval_seconds)
        self._session = requests.Session()
        self._session.headers["User-Agent"] = user_agent
        self._consecutive_failures: dict[str, int] = {}
        self._open_circuits: set[str] = set()
        self._request_count = 0

    def get_json(self, url: str, **kwargs):
        return self.get(url, **kwargs).json()

    def get(self, url: str, **kwargs) -> requests.Response:
        host = urlparse(url).hostname or ""

        assert_not_blocked(url)

        if host in self._open_circuits:
            raise CircuitOpenError(
                f"Skipping {url!r}: {host} had {self._max_consecutive_failures} "
                "consecutive failures this run and is being left alone."
            )

        if self._request_count >= self._max_requests_per_run:
            raise RuntimeError(
                f"Hit the per-run safety cap of {self._max_requests_per_run} "
                "requests. This cap exists to guarantee a run can never "
                "spiral into hammering a host — raise it deliberately in "
                "config.py if you actually need more requests."
            )

        if not robots.is_allowed(url, self._user_agent, timeout=self._timeout):
            raise RobotsDisallowedError(f"robots.txt disallows fetching {url!r}")

        delay = robots.crawl_delay(url, self._user_agent, timeout=self._timeout)
        if delay is not None:
            self._throttle.set_min_interval(host, delay)

        self._throttle.wait(url)

        try:
            self._request_count += 1
            response = self._session.get(url, timeout=self._timeout, **kwargs)
        except requests.RequestException:
            self._record_failure(host)
            raise

        if response.status_code == 429 or response.status_code >= 500:
            retry_after = _parse_retry_after(response.headers.get("Retry-After"))
            backoff = (
                retry_after
                if retry_after is not None
                else min(2 ** self._consecutive_failures.get(host, 0), 60)
            )
            self._record_failure(host)
            logger.warning(
                "%s returned %s; backing off %.1fs before any further "
                "requests to this host this run",
                url,
                response.status_code,
                backoff,
            )
            time.sleep(backoff)
            response.raise_for_status()

        response.raise_for_status()
        self._consecutive_failures[host] = 0
        return response

    def _record_failure(self, host: str) -> None:
        count = self._consecutive_failures.get(host, 0) + 1
        self._consecutive_failures[host] = count
        if count >= self._max_consecutive_failures:
            self._open_circuits.add(host)
            logger.warning(
                "%s failed %d times in a row; skipping it for the rest of "
                "this run instead of continuing to retry",
                host,
                count,
            )


def _parse_retry_after(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except ValueError:
        return None
