# SpecterUI

My full-stack developer portfolio — and the systems behind it. This repo is
a monorepo: a public-facing frontend, a private job-search pipeline, and the
API that serves it, each solving a different problem with the stack that fits
it best.

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
└── nodejs-backend/     # private job board API — Node.js + TypeScript
```

## Architecture

```
  python-crawler  (GitHub Actions, every 6h)
       │
       ├──write──▶ Neon (Postgres)
       │
       └──upload─▶ R2: postings.json  (Cloudflare object storage)
                        │
                        │ read
                        ▼
                   nodejs-backend  (Cloudflare Worker, bearer-token auth)
                        │
                        ▼
                     me only  (auth-gated)

  visitors ────────▶ react-frontend  (Cloudflare Pages)
                      — the only piece anyone else on the internet sees
```

No servers to manage: the crawler runs on GitHub's infrastructure on a
schedule, the API runs on Cloudflare's edge, storage is a managed database
(Neon) and object store (R2), and the frontend is a static Pages deploy.
Each piece is independently deployable and owns its own data — the frontend
never talks to the crawler's storage directly — the only thing these three
have in common is that they were built to make one person's job search less
manual.

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
- **`crawler/storage.py`** — Postgres via `psycopg`, hosted on
  [Neon](https://neon.tech) rather than self-managed — no database server
  to run, patch, or back up. `postings` is keyed on `(source,
  external_id)`, so re-running the pipeline is a safe upsert: already-known
  postings just get `last_seen_at` refreshed instead of being duplicated.
- **`crawler/pipeline.py`** — runs each configured source in turn; one
  source failing (disallowed by robots.txt, circuit open, unexpected error)
  is logged and skipped, not fatal to the run. Pass `storage=None` for a dry
  run — sources are still fetched through every politeness check, nothing
  is persisted.
- **`crawler/export.py`** — the hand-off point to `nodejs-backend` (see
  below).

### Feeding `nodejs-backend`

Every real (non-dry-run) run exports the full `postings` table to
**`data/postings.json`** locally (atomic write — temp file + rename), then
uploads that same file to a **Cloudflare R2** bucket (`crawler/r2_upload.py`)
under the key `postings.json`. The R2 upload is the part that actually
matters in production: `nodejs-backend` runs as a Cloudflare Worker with no
filesystem of its own, and the crawler itself runs on a GitHub Actions
runner that's destroyed after every run — R2 is the only thing both sides
can reach. The local file write still happens too, mainly so local
dev/testing works without needing R2 credentials at all (see
`crawler/r2_upload.py`'s module docstring — the upload step no-ops cleanly
if `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/
`R2_BUCKET_NAME` aren't all set).

R2 over having Node query Neon directly: it keeps the two services
decoupled, with no shared database credentials or driver dependency across
the Python/Node boundary, and R2 has no egress fees when read from a
Cloudflare Worker in the same account.

Each element in the exported JSON has this shape:

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

`data/` is gitignored — the local copy is private output, not committed.
Re-run the export/upload without re-running the whole pipeline with
`python -m crawler.export` (local file only) — there's no standalone R2
re-upload command; run the crawler for that.

### Setup and usage

Storage is [Neon](https://neon.tech) (managed serverless Postgres) — no
database to run or back up yourself. Create a project in the Neon console,
copy its connection string, and set it as `DATABASE_URL`. R2 credentials
(also optional for local dev, see above) come from the Cloudflare dashboard
under R2 → Manage R2 API Tokens:

```bash
cd python-crawler
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set CRAWLER_CONTACT_EMAIL, DATABASE_URL, and
                        # (optionally, for local R2 testing) the R2_* vars

python -m crawler.run --dry-run --verbose   # fetch + log, no writes
python -m crawler.run                       # upserts into Neon, exports + uploads
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

## 3. `nodejs-backend` — private job board API

**Stack:** TypeScript, [Hono](https://hono.dev), deployed as a Cloudflare
Worker.

Reads `postings.json` from a Cloudflare R2 bucket (`python-crawler` uploads
it there — see `python-crawler`'s "Feeding `nodejs-backend`" section above)
and serves it over a small authenticated API — the actual "board" a human
looks at is a later piece of work; this is the data layer underneath it.

**Decisions worth calling out:**

- **Hono, not Express.** A Worker has no Node `http.Server` — it's a
  `fetch(request) -> response` function running on V8 isolates, not a
  process listening on a socket. Hono is built for exactly that model
  (Express *can* run under Workers' `nodejs_compat` flag, but that's
  compatibility-shimming a Node-shaped framework onto a runtime that isn't
  Node; Hono is the tool actually designed for it).
- **R2, not a local file.** The Worker has no filesystem at all, so the
  file-based hand-off `python-crawler` writes locally has to land somewhere
  network-reachable — R2 is that place. No in-memory caching of the read,
  unlike an earlier version of this service: Workers don't guarantee an
  isolate survives between requests, so a cache would be unreliable, and R2
  reads are already fast enough that it isn't worth the complexity.
- **A shared bearer token, not a full auth system.** This API has exactly
  one consumer — me — so session management, password hashing, or OAuth
  would all be solving a problem that doesn't exist here. `API_TOKEN` is
  checked with a constant-time comparison (`src/middleware/auth.ts`,
  `node:crypto` via the `nodejs_compat` flag) to avoid leaking timing
  information about a near-miss token.
- **A 503, not a crash, when the crawler hasn't run yet.** If R2 has no
  `postings.json`, `GET /api/postings` returns a `503` with a message
  telling you to run the pipeline — this backend has no opinion on when the
  crawler runs and shouldn't fall over because of it.

```bash
cd nodejs-backend
npm install
cp .dev.vars.example .dev.vars   # set API_TOKEN (generate a long random value)
npm run dev                       # wrangler dev, local R2 simulation

curl -H "Authorization: Bearer $API_TOKEN" \
  "http://localhost:8787/api/postings?remote=true&company=stripe"

npm run deploy   # wrangler deploy — then: wrangler secret put API_TOKEN
```

---

## Deployment

No servers anywhere: `react-frontend` deploys to Cloudflare Pages,
`nodejs-backend` deploys to Cloudflare Workers, `python-crawler` runs on a
GitHub Actions schedule, storage is Neon (Postgres) and Cloudflare R2
(object storage). Nothing here needs a VM, a Dockerfile, or an uptime
commitment from a machine you own.

### `react-frontend` → Cloudflare Pages

Via the Pages dashboard (Workers & Pages → Create → Pages → connect to Git):

- **Root directory:** `react-frontend`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

React Router needs every path to resolve to `index.html` client-side, which
Pages doesn't do by default for a static build —
[`react-frontend/public/_redirects`](react-frontend/public/_redirects)
(`/* /index.html 200`) handles that; Vite copies it into `dist/` on every
build. Add the custom domain under the Pages project's **Custom domains**
tab once the first deploy succeeds.

### `nodejs-backend` → Cloudflare Workers

```bash
cd nodejs-backend
npm install

npx wrangler r2 bucket create specter-job-postings   # one-time, matches
                                                       # wrangler.jsonc's
                                                       # r2_buckets binding

npx wrangler login          # one-time browser auth
npx wrangler secret put API_TOKEN   # paste a long random value when prompted

npm run deploy               # wrangler deploy
```

Attach the custom domain (`api.specterui.dev`) from the dashboard: this
Worker → **Settings** → **Domains & Routes** → **Add** — reuses the same
Cloudflare account/zone as the Pages deploy above, no separate DNS provider
or TLS setup needed.

### `python-crawler` → GitHub Actions

[`.github/workflows/crawler.yml`](.github/workflows/crawler.yml) runs the
pipeline on a cron schedule (every 6 hours) and on manual dispatch from the
Actions tab. Set these as **repository secrets** (Settings → Secrets and
variables → Actions):

- `CRAWLER_CONTACT_EMAIL`
- `DATABASE_URL` — from the Neon console
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET_NAME` — create an API token under Cloudflare dashboard → R2 →
  Manage R2 API Tokens; `R2_BUCKET_NAME` is `specter-job-postings`, matching
  the bucket created above

Once the secrets are set, trigger a run by hand from the Actions tab
(**Run job crawler** → **Run workflow**) to confirm it works end-to-end
before waiting for the first scheduled run.

### Verifying it's all connected

```bash
curl https://api.specterui.dev/health
# {"status":"ok"}

curl -H "Authorization: Bearer <your API_TOKEN>" \
  https://api.specterui.dev/api/postings
# 503 until the first GitHub Actions crawler run has uploaded to R2,
# then the real postings list
```

---

## Case study: building this project

This entire repo — frontend, crawler, API, deployment setup, this README —
was built through iterative pairing with
[Claude Code](https://claude.com/product/claude-code), Anthropic's CLI-based
coding agent, rather than written top-down from a spec.

**What that looked like in practice:**

- **The site did not launch with its current shape.** Early commits show a
  booking system built directly into the frontend on Cloudflare Workers, then
  removed a few commits later — bolting that kind of logic onto the frontend
  didn't scale past a prototype. That wasn't a mistake to hide; it's part of
  why backend logic now lives in its own service (`nodejs-backend`) instead
  of inside the frontend.
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
  by describing intent and constraints (private job data, isolated scrapers
  per source, one bearer token instead of a full auth system) and working
  through the reasoning rather than accepting the first design that came up.

The honest version of this project's story is that it's still being built —
the frontend is live, and both the crawler pipeline and the job board API
are implemented and verified end-to-end (see the `python-crawler` and
`nodejs-backend` sections above). That's reflected in this README rather
than glossed over.

## License

MIT — see [LICENSE](LICENSE).
