"""
SQLite-backed storage for scraped postings. SQLite (not Postgres) is used
deliberately: this is a single-user, single-machine pipeline with no
concurrent writers, so running a database server would be pure overhead.
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .models import JobPosting

SCHEMA = """
CREATE TABLE IF NOT EXISTS postings (
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT,
    remote INTEGER,
    description TEXT,
    tags TEXT,
    posted_at TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    PRIMARY KEY (source, external_id)
);
"""


class Storage:
    def __init__(self, db_path: Path) -> None:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(db_path)
        self._conn.execute(SCHEMA)
        self._conn.commit()

    def upsert(self, posting: JobPosting) -> bool:
        """Insert a posting, or refresh last_seen_at if already known.

        Returns True if this was a new posting, False if it already existed.
        """
        now = datetime.now(timezone.utc).isoformat()
        cursor = self._conn.execute(
            "SELECT 1 FROM postings WHERE source = ? AND external_id = ?",
            (posting.source, posting.external_id),
        )
        is_new = cursor.fetchone() is None

        if is_new:
            self._conn.execute(
                """
                INSERT INTO postings (
                    source, external_id, title, company, url, location,
                    remote, description, tags, posted_at,
                    first_seen_at, last_seen_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    posting.source,
                    posting.external_id,
                    posting.title,
                    posting.company,
                    posting.url,
                    posting.location,
                    posting.remote,
                    posting.description,
                    ",".join(posting.tags),
                    posting.posted_at,
                    now,
                    now,
                ),
            )
        else:
            self._conn.execute(
                "UPDATE postings SET last_seen_at = ? WHERE source = ? AND external_id = ?",
                (now, posting.source, posting.external_id),
            )
        self._conn.commit()
        return is_new

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "Storage":
        return self

    def __exit__(self, *exc_info: object) -> None:
        self.close()
