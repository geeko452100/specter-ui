"""
Uploads the JSON export to Cloudflare R2 so nodejs-backend — a Cloudflare
Worker with no filesystem of its own — can read it. R2 exposes an
S3-compatible API, so this uses boto3 pointed at R2's endpoint rather than a
Cloudflare-specific SDK.

Optional: if R2 credentials aren't set, this is skipped and export_json's
local file write is all that happens, which keeps local dev/testing working
without needing an R2 account. In the GitHub Actions deployment, R2 is the
only hand-off that matters — the runner's filesystem is wiped after every
run, so a local-only export would never reach nodejs-backend.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def upload_postings(json_path: Path) -> bool:
    """Uploads json_path to R2 if all required env vars are set.

    Returns True if the upload ran, False if it was skipped because R2
    isn't configured.
    """
    account_id = os.environ.get("R2_ACCOUNT_ID")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
    bucket = os.environ.get("R2_BUCKET_NAME")

    if not all([account_id, access_key, secret_key, bucket]):
        logger.info(
            "R2 upload skipped (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / "
            "R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME not all set) — "
            "nodejs-backend won't see this export unless it's uploaded."
        )
        return False

    import boto3  # imported lazily: only needed when R2 is actually used

    client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
    client.upload_file(
        str(json_path),
        bucket,
        "postings.json",
        ExtraArgs={"ContentType": "application/json"},
    )
    logger.info("Uploaded %s to R2 bucket %s", json_path.name, bucket)
    return True
