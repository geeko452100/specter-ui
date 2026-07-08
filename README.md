# SpecterUI

Gavin Griffith's developer portfolio — and the systems behind it. This repo is
a monorepo: a public-facing frontend, a private job-search pipeline, and a
recruiter-scheduling backend, each solving a different problem with the stack
that fits it best.

> **Live site:** [specterui.dev](https://specterui.dev)

## Why a monorepo

The three services don't share a runtime, but they share a purpose: reduce
the manual overhead of a job search. Keeping them in one repo makes the
relationship between them — and the reasoning behind each — visible in one
place, instead of scattered across unrelated repos with no shared context.

```
specter-ui/
├── react-frontend/     # public portfolio — React + TypeScript + Vite
├── python-crawler/     # private job board — scraper + data pipeline
└── nodejs-backend/      # recruiter booking API — Node.js + TypeScript + Calendly
```

## Architecture

```
                     ┌────────────────────┐
   job postings ───▶ │   python-crawler    │ ── normalized listings ──▶ private
   (target boards)   │  scrape → clean →   │                            job board
                      │  dedupe → store     │                          (auth-gated,
                      └────────────────────┘                            me only)

   recruiter    ───▶ ┌────────────────────┐
   picks a slot      │    nodejs-backend    │ ── webhook ──▶ Calendly
                      │  booking API + TS   │ ── notifies ──▶ me (email/log)
                      └────────────────────┘

   visitors     ───▶ ┌────────────────────┐
                      │   react-frontend    │  — the only piece anyone
                      │  portfolio + case   │    else on the internet sees
                      │  study, public       │
                      └────────────────────┘
```

Each service is independently deployable and owns its own data. The frontend
never talks to the crawler's storage directly, and the booking backend never
touches crawler data at all — the only thing they have in common is that they
were built to make one person's job search less manual.

---

## 1. `react-frontend` — the public portfolio

The part of this repo anyone else actually sees: a fast, content-first
portfolio site.

**Stack:** React 19 (with the React Compiler), TypeScript, Vite, Tailwind
CSS 4, React Router, ESLint + typescript-eslint.

**Decisions worth calling out:**

- **React Compiler over manual memoization.** The UI is small enough that
  hand-rolled `useMemo`/`useCallback` would be pure ceremony. Letting the
  compiler handle re-render granularity keeps the component code close to
  plain React.
- **Tailwind 4's Vite plugin instead of PostCSS config.** One less config
  file to maintain, and the CSS pipeline stays inside Vite's own build graph.
- **File-based route components, not a meta-framework.** No server rendering
  requirement and no data-fetching-on-navigation need justified pulling in
  Next.js/Remix — `react-router-dom` plus static hosting covers it.
- **TypeScript migration was a deliberate second pass, not a rewrite.** The
  site shipped first in JS to validate layout and content; the migration to
  TypeScript came once the shape of the components had stabilized, so the
  types describe a settled design instead of chasing a moving one.

```bash
cd react-frontend
npm install
npm run dev       # start the Vite dev server
npm run build      # type-check (tsc -b) and build for production
npm run lint        # ESLint with type-aware rules
npm run preview     # preview the production build locally
```

---

## 2. `python-crawler` — private job board & data pipeline

*Status: pipeline and source adapters implemented; the viewing UI is still
to come.*

A pipeline that pulls job postings relevant to my own search, normalizes
them, and stores them for a board that **only I can view** — it is
intentionally not part of the public portfolio surface.

**Why it's private:** scraping job boards sits in a legal and ethical gray
area depending on the source's terms of service, and the output is a curated
list built around one person's job criteria — not a product meant for other
users. Keeping it access-gated avoids both problems.

### Legality and etiquette come first

This is the actual design priority, not a disclaimer at the bottom. Every
rule below is enforced in code, not just documented:

- **Only documented public APIs/feeds, never scraped HTML.** Every source in
  `python-crawler/crawler/sources/` talks to an API or feed its provider
  explicitly publishes for external/programmatic consumption (Greenhouse's
  Job Board API, Lever's Postings API, RemoteOK's `/api` endpoint, We Work
  Remotely's category RSS feeds). No source parses a page that wasn't meant
  to be machine-read.
- **A hard-coded blocklist, not a config option.** `crawler/blocklist.py`
  refuses any request to a domain whose Terms of Service explicitly
  prohibit automated scraping (LinkedIn, Indeed, Glassdoor, ZipRecruiter,
  Monster), regardless of what a config file says. It can't be bypassed by
  editing `config.py` — it's a separate check every request passes through.
- **robots.txt is checked before every request**, including requests to the
  "public API" sources above — `crawler/robots.py`. If robots.txt can't be
  fetched or parsed, the crawler fails *closed* (treats the site as fully
  disallowed), not open.
- **Rate-limited per host, sequentially, no concurrency.**
  `crawler/throttle.py` enforces a minimum 3-second gap between requests to
  the same host by default, and a site's own robots.txt `Crawl-delay` — when
  published — always overrides that upward, never downward.
- **Backs off and gives up on trouble, never retries into it.**
  `crawler/http_client.py` honors `Retry-After` on `429`/`5xx` responses,
  otherwise backs off exponentially; after 3 consecutive failures to a
  host, a circuit breaker skips that host for the rest of the run instead
  of continuing to hit it.
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

### Architecture

```
sources (fetch)  →  normalize (per-adapter)  →  dedupe + store (Postgres)  →  export (JSON)
```

- **`crawler/sources/`** — one adapter per provider. Each adapter's
  docstring names the specific public API/feed it's built on.
- **`crawler/http_client.py`** — the only place allowed to make outbound
  HTTP requests; every call passes through the blocklist, robots.txt check,
  throttle, and circuit breaker described above.
- **`crawler/storage.py`** — Postgres via `psycopg`. `postings` is keyed on
  `(source, external_id)`, so re-running the pipeline is a safe upsert:
  already-known postings just get `last_seen_at` refreshed instead of being
  duplicated.
- **`crawler/pipeline.py`** — runs each configured source in turn; one
  source failing (disallowed by robots.txt, circuit open, unexpected error)
  is logged and skipped, not fatal to the run. Pass `storage=None` for a dry
  run — sources are still fetched through every politeness check, nothing
  is persisted.
- **`crawler/export.py`** — the hand-off point to `nodejs-backend` (see
  below).

### Feeding `nodejs-backend`

`nodejs-backend` isn't set up yet — that's a separate, later piece of work.
This crawler is already prepared for it, though: every real (non-dry-run)
run ends by exporting the full `postings` table to **`data/postings.json`**
as a JSON array, written atomically (temp file + rename) so a reader —
eventually the Node service — never observes a half-written file mid-export.

JSON was chosen over having Node query Postgres directly: it keeps the two
services decoupled, with no shared database credentials or driver
dependency across the Python/Node boundary. Node just reads a file.

Each element in `data/postings.json` has this shape:

```json
{
  "source": "greenhouse:stripe",
  "external_id": "12345",
  "title": "Senior Frontend Engineer",
  "company": "stripe",
  "url": "https://job-boards.greenhouse.io/stripe/jobs/12345",
  "location": "Remote - US",
  "remote": true,
  "description": "...",
  "tags": ["react", "typescript"],
  "posted_at": "2026-07-01T00:00:00+00:00",
  "first_seen_at": "2026-07-07T19:35:29.478+00:00",
  "last_seen_at": "2026-07-07T19:36:02.000+00:00"
}
```

`data/` is gitignored — this file is private output, not committed. Re-run
the export without re-running the whole pipeline with
`python -m crawler.export`.

### Setup and usage

Requires a Postgres instance. `docker-compose.yml` in `python-crawler/`
starts one locally on **port 5433** (not the default 5432, so it won't
collide with a Postgres instance already running for another project):

```bash
cd python-crawler
docker compose up -d              # Postgres on localhost:5433
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # set CRAWLER_CONTACT_EMAIL; DATABASE_URL
                                   # already matches docker-compose.yml

python -m crawler.run --dry-run --verbose   # fetch + log, no writes
python -m crawler.run                       # upserts into Postgres, exports JSON
```

### Adding a source

Edit `SOURCES` in `crawler/config.py`. Only add a provider that publishes a
documented public API or feed meant for external consumption — confirm that
before writing the adapter, not after. Each existing adapter in
`crawler/sources/` is a template: fetch from the provider's endpoint via the
shared `PoliteHTTPClient`, yield `JobPosting` records.

Do not add an HTML-scraping adapter without first reading the target site's
robots.txt and current Terms of Service yourself — the automated checks here
are a safety net, not a substitute for that judgment call.

---

## 3. `nodejs-backend` — job board API and recruiter interview booking

A TypeScript backend with two responsibilities, built at different times:
serving the private job board's data (implemented), and eventually sitting
between recruiters and my calendar via Calendly (still just a design).

### Job board API — *implemented*

**Stack:** Node.js, TypeScript, Express 5.

Reads the `data/postings.json` file `python-crawler` exports (see
`python-crawler`'s "Feeding `nodejs-backend`" section above) and serves it
over a small authenticated API — the actual "board" a human looks at is a
later piece of work; this is the data layer underneath it.

**Decisions worth calling out:**

- **A shared bearer token, not a full auth system.** This API has exactly
  one consumer — me — so session management, password hashing, or OAuth
  would all be solving a problem that doesn't exist here. `API_TOKEN` is
  checked with a constant-time comparison
  (`src/middleware/auth.ts`) to avoid leaking timing information about a
  near-miss token, and the server refuses to start without one set — same
  fail-fast policy `python-crawler` uses for its contact email.
- **Reads the export file, not Postgres directly.** Matches the contract
  `python-crawler` was built to hand off: no shared database credentials or
  driver dependency between the Python and Node halves of this repo. The
  file is re-read only when its mtime changes (`src/lib/postingsStore.ts`),
  so most requests hit an in-memory cache instead of re-parsing a
  multi-megabyte JSON file.
- **A 503, not a crash, when the crawler hasn't run yet.** If
  `data/postings.json` doesn't exist, `GET /api/postings` returns a `503`
  with a message telling you to run the pipeline — this backend has no
  opinion on when the crawler runs and shouldn't fall over because of it.
- **Express 5 over 4** specifically so async route handlers that throw are
  forwarded to the error middleware automatically — no `try/catch`
  boilerplate wrapping every handler.

```bash
cd nodejs-backend
npm install
cp .env.example .env   # set API_TOKEN (generate a long random value)
npm run dev             # tsx watch, ts source directly
npm run build && npm start   # compiled build

curl -H "Authorization: Bearer $API_TOKEN" \
  "http://localhost:4000/api/postings?remote=true&company=stripe"
```

### Recruiter interview booking — *planned*

**Why not just embed a Calendly widget and call it done:** the widget alone
gets you a booking link, but nothing ties that booking back into anything
else — no server-side record, no custom confirmation flow, no place to add
logic later (e.g. pre-screening questions, routing by role, notifying me
somewhere other than email). This piece exists to own that logic instead of
letting it live entirely inside a third-party iframe.

**Planned architecture:**

- **Calendly as the source of truth for availability** — this backend does
  not model calendar state itself; it consumes Calendly's webhooks
  (`invitee.created`, `invitee.canceled`) and reacts to them, which avoids
  the class of bugs that comes from keeping a second calendar in sync.
- **Webhook receiver → verify signature → persist booking → notify.**
  Verification uses Calendly's webhook signing secret; persistence is
  minimal (who booked, when, for what) since Calendly already holds the
  authoritative event data.
- **Reachable from the public internet**, unlike the job-board API above —
  it's the only piece of `nodejs-backend` that needs to be, since Calendly's
  webhook delivery has to reach it.

---

## Case study: building this project

This entire repo — frontend, this README, the architecture for the two
services still in progress — was built through iterative pairing with
[Claude Code](https://claude.com/product/claude-code), Anthropic's CLI-based
coding agent, rather than written top-down from a spec.

**What that looked like in practice:**

- **The site did not launch with its current shape.** Early commits show a
  booking system built directly into the frontend on Cloudflare Workers, then
  removed a few commits later. That wasn't a mistake to hide — it's the
  reason `nodejs-backend` exists as a separate service now: booking logic
  bolted onto the frontend didn't scale past a prototype, so it got pulled
  out and rebuilt as its own backend with a real integration (Calendly)
  instead of a workaround.
- **TypeScript came after the design settled, not before.** The component
  structure and layout were iterated on in JS first; migrating to TypeScript
  was a distinct, deliberate pass once the shape of things stopped changing
  — done that way specifically so the type definitions would describe a
  finished design instead of being rewritten every time the layout changed.
- **Working with an AI agent changed the granularity of iteration.** Instead
  of large speculative rewrites, changes came in small, reviewable passes —
  copy tone, component structure, then styling — each one checked before
  moving to the next, which is closer to how a second engineer would review
  a diff than how a solo project usually gets built.
- **The architecture docs above were written the same way the code was:**
  by describing intent and constraints (private job data, Calendly as the
  source of truth for availability, isolated scrapers per source) and
  working through the reasoning rather than accepting the first design that
  came up.

The honest version of this project's story is that it's still being built —
the frontend is live, the crawler pipeline is implemented and verified
end-to-end (see the `python-crawler` section above), and `nodejs-backend` is
still just a design. That's reflected in this README rather than glossed
over.

## License

MIT — see [LICENSE](LICENSE).
