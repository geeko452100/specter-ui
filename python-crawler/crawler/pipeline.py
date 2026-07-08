"""
Runs each configured source through the polite HTTP client, then stores what
comes back. One source failing (robots.txt disallow, circuit breaker trip,
HTTP error) logs a warning and moves on to the next source rather than
aborting the whole run.
"""

from __future__ import annotations

import logging

from .blocklist import BlockedDomainError
from .http_client import CircuitOpenError, PoliteHTTPClient, RobotsDisallowedError
from .sources.base import JobSource
from .storage import Storage

logger = logging.getLogger(__name__)


def run_pipeline(
    sources: list[JobSource],
    client: PoliteHTTPClient,
    storage: Storage | None,
) -> None:
    """Fetch every source and, if `storage` is given, upsert the results.

    `storage=None` runs a dry run: sources are fetched and logged exactly as
    normal (still through every politeness check in the HTTP client) but
    nothing is written anywhere.
    """
    total_new = 0
    total_seen = 0

    for source in sources:
        logger.info("Fetching %s", source.name)
        try:
            postings = list(source.fetch(client))
        except (BlockedDomainError, RobotsDisallowedError, CircuitOpenError) as exc:
            logger.warning("Skipping %s: %s", source.name, exc)
            continue
        except Exception:
            logger.exception("Skipping %s after an unexpected error", source.name)
            continue

        if storage is None:
            total_seen += len(postings)
            logger.info("%s: %d listings seen (dry run, nothing stored)", source.name, len(postings))
            continue

        new_count = 0
        for posting in postings:
            if storage.upsert(posting):
                new_count += 1
            total_seen += 1
        total_new += new_count
        logger.info("%s: %d listings seen, %d new", source.name, len(postings), new_count)

    logger.info("Run complete: %d listings seen, %d new", total_seen, total_new)
