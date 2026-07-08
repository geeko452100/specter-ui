"""CLI entrypoint: `python -m crawler.run [--dry-run] [--verbose]`."""

from __future__ import annotations

import argparse
import logging

from . import config
from .export import export_json
from .http_client import PoliteHTTPClient
from .pipeline import run_pipeline
from .r2_upload import upload_postings
from .storage import Storage

logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the private job-listing pipeline.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and log results without writing to the real database.",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging.")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    client = PoliteHTTPClient(
        user_agent=config.USER_AGENT,
        min_interval_seconds=config.MIN_INTERVAL_SECONDS,
        request_timeout=config.REQUEST_TIMEOUT_SECONDS,
        max_consecutive_failures=config.MAX_CONSECUTIVE_FAILURES,
        max_requests_per_run=config.MAX_REQUESTS_PER_RUN,
    )

    if args.dry_run:
        run_pipeline(config.SOURCES, client, storage=None)
        return

    with Storage(config.DATABASE_URL) as storage:
        run_pipeline(config.SOURCES, client, storage)

    exported = export_json(config.DATABASE_URL, config.EXPORT_JSON_PATH, config.RESUME_PROFILE_PATH)
    logger.info("Exported %d postings to %s", exported, config.EXPORT_JSON_PATH)

    upload_postings(config.EXPORT_JSON_PATH)


if __name__ == "__main__":
    main()
