"""
Declares which sources this crawler pulls from and the politeness defaults
used for every request. Only add a source below if it's a documented public
API/feed meant for external consumption — see the docstring at the top of
each module in crawler/sources/.
"""

from __future__ import annotations

import os
from pathlib import Path

from .sources.base import JobSource
from .sources.greenhouse import GreenhouseSource
from .sources.lever import LeverSource
from .sources.remoteok import RemoteOKSource
from .sources.weworkremotely import WeWorkRemotelySource

CONTACT_EMAIL = os.environ.get("CRAWLER_CONTACT_EMAIL", "gavingriffith212@gmail.com")

USER_AGENT = (
    "SpecterUI-JobCrawler/1.0 "
    "(personal job-search aggregator; polite, low-volume, single-user; "
    f"contact: mailto:{CONTACT_EMAIL})"
)

# Minimum seconds between requests to the same host. A site's own
# robots.txt Crawl-delay, when it publishes one, always overrides this
# upward at request time — this value is only a floor, never a ceiling.
MIN_INTERVAL_SECONDS = 3.0

REQUEST_TIMEOUT_SECONDS = 15.0
MAX_CONSECUTIVE_FAILURES = 3

# Hard cap on requests in a single run, independent of how many sources are
# configured. Exists so a bug (or an overgrown source list) can never turn
# into a runaway crawl — raise it deliberately, not by accident.
MAX_REQUESTS_PER_RUN = 200

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "jobs.db"

# Edit this list with the boards relevant to your own search. Each entry
# below is a real, public example so the pipeline runs end-to-end out of
# the box — swap in the companies/categories you actually care about.
SOURCES: list[JobSource] = [
    GreenhouseSource(board_token="stripe"),
    LeverSource(company="netflix"),
    RemoteOKSource(),
    WeWorkRemotelySource(category="remote-programming-jobs"),
]
