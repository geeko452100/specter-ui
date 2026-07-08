"""CLI entrypoint: `python -m crawler.run [--dry-run] [--verbose]`."""

from __future__ import annotations

import argparse
import logging
import tempfile
from pathlib import Path

from . import config
from .http_client import PoliteHTTPClient
from .pipeline import run_pipeline
from .storage import Storage


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
        with tempfile.TemporaryDirectory() as tmp_dir:
            with Storage(Path(tmp_dir) / "dry-run.db") as storage:
                run_pipeline(config.SOURCES, client, storage)
        return

    with Storage(config.DB_PATH) as storage:
        run_pipeline(config.SOURCES, client, storage)


if __name__ == "__main__":
    main()
