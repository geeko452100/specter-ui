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

# A Neon (neon.tech) connection string — copy it from the Neon console for
# your project. No self-hosted Postgres to run or back up: Neon owns that.
# Required and fail-fast, same policy PoliteHTTPClient uses for a missing
# contact email — a misconfigured database should break loudly at startup.
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "Missing required environment variable: DATABASE_URL. Copy a "
        "connection string from your Neon project's console — see "
        "python-crawler/.env.example."
    )

# The hand-off file for nodejs-backend to read the private board's data
# from. Written atomically after every real run — see crawler/export.py.
EXPORT_JSON_PATH = Path(__file__).resolve().parent.parent / "data" / "postings.json"

# Resume/skills/portfolio text that every posting is scored against (TF-IDF
# + cosine similarity — see crawler/matcher.py) at export time. Not checked
# for existence here: dry runs and pipeline runs don't need it, only
# crawler/export.py does, and it fails loudly there if this file is missing
# or empty. Gitignored — profile/resume.example.txt is the committed
# template.
RESUME_PROFILE_PATH = Path(__file__).resolve().parent.parent / "profile" / "resume.txt"

# Edit this list with the boards relevant to your own search. Each entry
# below is a real, public example so the pipeline runs end-to-end out of
# the box — swap in the companies/categories you actually care about.
SOURCES: list[JobSource] = [
    GreenhouseSource(board_token="stripe"),
    LeverSource(company="netflix"),
    RemoteOKSource(),
    WeWorkRemotelySource(category="remote-programming-jobs"),
]
