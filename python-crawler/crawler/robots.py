"""
robots.txt enforcement. Every outbound request is checked here before it's
made — including requests to documented public JSON APIs — as a
defense-in-depth measure: a robots.txt Disallow wins even if a particular
endpoint looks like it's meant for programmatic access.

Failure modes are deliberately conservative: if robots.txt can't be fetched
or parsed, or the server refuses to serve it, this treats the site as fully
disallowed rather than fully allowed.
"""

from __future__ import annotations

import time
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import requests

_CACHE: dict[str, RobotFileParser] = {}
_CACHE_FETCHED_AT: dict[str, float] = {}
_CACHE_TTL_SECONDS = 3600


def _robots_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/robots.txt"


def _get_parser(url: str, user_agent: str, timeout: float) -> RobotFileParser:
    robots_url = _robots_url(url)
    cached = _CACHE.get(robots_url)
    fetched_at = _CACHE_FETCHED_AT.get(robots_url, 0.0)
    if cached is not None and (time.monotonic() - fetched_at) < _CACHE_TTL_SECONDS:
        return cached

    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        response = requests.get(
            robots_url,
            headers={"User-Agent": user_agent},
            timeout=timeout,
        )
        if response.status_code == 200:
            parser.parse(response.text.splitlines())
        elif response.status_code in (401, 403):
            # Can't confirm the rules — assume the strictest possible ones.
            parser.parse(["User-agent: *", "Disallow: /"])
        else:
            # No robots.txt (404 etc.) is conventionally "allow all".
            parser.parse([])
    except requests.RequestException:
        # Network failure while fetching robots.txt: fail closed, not open.
        parser.parse(["User-agent: *", "Disallow: /"])

    _CACHE[robots_url] = parser
    _CACHE_FETCHED_AT[robots_url] = time.monotonic()
    return parser


def is_allowed(url: str, user_agent: str, timeout: float = 10.0) -> bool:
    parser = _get_parser(url, user_agent, timeout)
    return parser.can_fetch(user_agent, url)


def crawl_delay(url: str, user_agent: str, timeout: float = 10.0) -> float | None:
    parser = _get_parser(url, user_agent, timeout)
    delay = parser.crawl_delay(user_agent)
    return float(delay) if delay is not None else None
