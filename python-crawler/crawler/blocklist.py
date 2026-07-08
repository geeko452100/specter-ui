"""
Domains whose Terms of Service explicitly prohibit automated scraping or
crawling of their job listings, regardless of what robots.txt allows.

This list is enforced here in code rather than left as a comment or a config
flag, so it can't be bypassed later by editing a config file without also
touching this file. Only add a source to this project if it publishes an
official public API/feed for job data (see crawler/sources/), or if you have
personally confirmed its current Terms of Service permit automated access.
"""

from __future__ import annotations

from urllib.parse import urlparse

# Host suffixes. Matched against the request's hostname so subdomains
# (e.g. www.linkedin.com, careers.indeed.com) are covered too.
PROHIBITED_HOST_SUFFIXES: tuple[str, ...] = (
    "linkedin.com",
    "indeed.com",
    "glassdoor.com",
    "ziprecruiter.com",
    "monster.com",
)


class BlockedDomainError(RuntimeError):
    """Raised when a request targets a domain this crawler refuses to touch."""


def assert_not_blocked(url: str) -> None:
    host = (urlparse(url).hostname or "").lower()
    for suffix in PROHIBITED_HOST_SUFFIXES:
        if host == suffix or host.endswith("." + suffix):
            raise BlockedDomainError(
                f"Refusing to request {url!r}: {suffix} prohibits automated "
                "scraping in its Terms of Service. This is enforced in code "
                "and is not configurable — see crawler/blocklist.py."
            )
