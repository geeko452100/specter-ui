# python-crawler

A private job-listing pipeline: pulls postings from a handful of public job
data sources, normalizes them, and stores them locally for a board that only
I can see. It is not part of the public portfolio surface.

## Legality and etiquette come first

This is the actual design priority, not a disclaimer at the bottom. Every
rule below is enforced in code, not just documented:

- **Only documented public APIs/feeds, never scraped HTML.** Every source in
  [`crawler/sources/`](crawler/sources/) talks to an API or feed its
  provider explicitly publishes for external/programmatic consumption
  (Greenhouse's Job Board API, Lever's Postings API, RemoteOK's `/api`
  endpoint, We Work Remotely's category RSS feeds). No source parses a page
  that wasn't meant to be machine-read.
- **A hard-coded blocklist, not a config option.** [`crawler/blocklist.py`](crawler/blocklist.py)
  refuses any request to a domain whose Terms of Service explicitly
  prohibit automated scraping (LinkedIn, Indeed, Glassdoor, ZipRecruiter,
  Monster), regardless of what a config file says. It can't be bypassed by
  editing `config.py` — it's a separate check every request passes through.
- **robots.txt is checked before every request**, including requests to the
  "public API" sources above — [`crawler/robots.py`](crawler/robots.py). If
  robots.txt can't be fetched or parsed, the crawler fails *closed*
  (treats the site as fully disallowed), not open.
- **Rate-limited per host, sequentially, no concurrency.**
  [`crawler/throttle.py`](crawler/throttle.py) enforces a minimum 3-second
  gap between requests to the same host by default, and a site's own
  robots.txt `Crawl-delay` — when published — always overrides that upward,
  never downward.
- **Backs off and gives up on trouble, never retries into it.**
  [`crawler/http_client.py`](crawler/http_client.py) honors `Retry-After` on
  `429`/`5xx` responses, otherwise backs off exponentially; after 3
  consecutive failures to a host, a circuit breaker skips that host for the
  rest of the run instead of continuing to hit it.
- **A hard per-run request cap** (`MAX_REQUESTS_PER_RUN` in `config.py`)
  guarantees a bug or a misconfigured source list can't spiral into a
  runaway crawl.
- **Identifies itself honestly.** Every request goes out with a descriptive
  `User-Agent` that includes a real contact email, so any site operator can
  identify this bot and reach out — the client refuses to start without one
  (see `CRAWLER_CONTACT_EMAIL` below).

One consequence of taking this seriously: **LinkedIn and Indeed are not, and
will not be, sources here.** Their Terms of Service prohibit automated
access to job data, and no robots.txt allowance or technical workaround
changes that.

## Architecture

```
sources (fetch)  →  normalize (per-adapter)  →  dedupe + store (SQLite)
```

- **`crawler/sources/`** — one adapter per provider. Each adapter's
  docstring names the specific public API/feed it's built on.
- **`crawler/http_client.py`** — the only place allowed to make outbound
  HTTP requests; every call passes through the blocklist, robots.txt check,
  throttle, and circuit breaker described above.
- **`crawler/storage.py`** — SQLite, not Postgres. This is a single-user,
  single-machine pipeline with no concurrent writers, so running a database
  server would be pure overhead. The schema upserts on `(source,
  external_id)`, so re-running the pipeline updates `last_seen_at` on
  postings already known instead of duplicating them.
- **`crawler/pipeline.py`** — runs each configured source in turn; one
  source failing (disallowed by robots.txt, circuit open, unexpected error)
  is logged and skipped, not fatal to the run.

## Setup

```bash
cd python-crawler
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set CRAWLER_CONTACT_EMAIL
```

## Usage

```bash
# Fetch and log results without touching the real database
python -m crawler.run --dry-run --verbose

# Run for real — upserts into data/jobs.db (gitignored, private)
python -m crawler.run
```

## Adding a source

Edit `SOURCES` in [`crawler/config.py`](crawler/config.py). Only add a
provider that publishes a documented public API or feed meant for external
consumption — confirm that before writing the adapter, not after. Each
existing adapter in `crawler/sources/` is a template: fetch from the
provider's endpoint via the shared `PoliteHTTPClient`, yield `JobPosting`
records.

Do not add an HTML-scraping adapter without first reading the target site's
robots.txt and current Terms of Service yourself — the automated checks here
are a safety net, not a substitute for that judgment call.
