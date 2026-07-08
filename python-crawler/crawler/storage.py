"""
PostgreSQL-backed storage for scraped postings.
"""

from __future__ import annotations

import psycopg

from .models import JobPosting

SCHEMA = """
CREATE TABLE IF NOT EXISTS postings (
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT,
    remote BOOLEAN,
    description TEXT,
    tags TEXT,
    posted_at TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (source, external_id)
);
"""


class Storage:
    def __init__(self, dsn: str) -> None:
        self._conn = psycopg.connect(dsn, autocommit=True)
        self._conn.execute(SCHEMA)

    def upsert(self, posting: JobPosting) -> bool:
        """Insert a posting, or refresh last_seen_at if already known.

        Returns True if this was a new posting, False if it already existed.
        The `xmax = 0` check is the standard Postgres trick for telling an
        INSERT apart from an ON CONFLICT UPDATE in a single round trip.
        """
        row = self._conn.execute(
            """
            INSERT INTO postings (
                source, external_id, title, company, url, location,
                remote, description, tags, posted_at,
                first_seen_at, last_seen_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now())
            ON CONFLICT (source, external_id)
            DO UPDATE SET last_seen_at = now()
            RETURNING (xmax = 0) AS inserted
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
            ),
        ).fetchone()
        return bool(row[0])

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "Storage":
        return self

    def __exit__(self, *exc_info: object) -> None:
        self.close()
