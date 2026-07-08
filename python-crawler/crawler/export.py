"""
Exports the postings table to a local JSON file, written atomically (temp
file + rename) so a reader never observes a half-written file mid-export.
This is the first half of the hand-off to nodejs-backend — see
crawler/r2_upload.py for the second half (uploading this file to R2, which
is what nodejs-backend, a Cloudflare Worker with no filesystem, actually
reads from).

Every export also scores each posting against profile/resume.txt (see
crawler/matcher.py) and sorts the highest-matching postings first, so
postings.json is already ranked by relevance to your own resume/skills by
the time nodejs-backend/react-frontend see it.

Usage: `python -m crawler.export` re-exports from the existing database
without re-running the pipeline (local file only, no R2 upload) — handy for
re-scoring against an edited resume without re-crawling anything.
`crawler.run` calls both `export_json` and `upload_postings` automatically
after every real (non-dry-run) run.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import psycopg

from . import matcher

COLUMNS = (
    "source",
    "external_id",
    "title",
    "company",
    "url",
    "location",
    "remote",
    "description",
    "tags",
    "posted_at",
    "first_seen_at",
    "last_seen_at",
)


def export_json(dsn: str, output_path: Path, profile_path: Path) -> int:
    """Write every posting in the database at `dsn` to `output_path` as a
    JSON array, scored and sorted against the resume/skills profile at
    `profile_path`. Returns the number of postings written.
    """
    with psycopg.connect(dsn) as conn:
        rows = conn.execute(
            f"SELECT {', '.join(COLUMNS)} FROM postings "
            "ORDER BY posted_at IS NULL, posted_at DESC"
        ).fetchall()

    postings = []
    for row in rows:
        record = dict(zip(COLUMNS, row))
        record["tags"] = record["tags"].split(",") if record["tags"] else []
        record["first_seen_at"] = record["first_seen_at"].isoformat()
        record["last_seen_at"] = record["last_seen_at"].isoformat()
        postings.append(record)

    profile_text = matcher.load_profile_text(profile_path)
    matcher.score_postings(postings, profile_text)
    postings.sort(key=lambda p: p["match_score"], reverse=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = output_path.with_suffix(output_path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(postings, indent=2))
    os.replace(tmp_path, output_path)  # atomic on POSIX and Windows
    return len(postings)


def main() -> None:
    from . import config

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    count = export_json(config.DATABASE_URL, config.EXPORT_JSON_PATH, config.RESUME_PROFILE_PATH)
    logging.getLogger(__name__).info(
        "Exported %d postings to %s", count, config.EXPORT_JSON_PATH
    )


if __name__ == "__main__":
    main()
