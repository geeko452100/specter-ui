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

**Legality and etiquette were the first design constraint, not an
afterthought** — see [`python-crawler/README.md`](python-crawler/README.md)
for the full reasoning, but in short:

- **No HTML scraping.** Every source adapter talks to a documented public
  API or feed its provider explicitly publishes for external consumption —
  Greenhouse's Job Board API, Lever's Postings API, RemoteOK's `/api`, We
  Work Remotely's category RSS feeds.
- **A hard-coded blocklist**, checked on every request, refuses any domain
  whose Terms of Service prohibit automated scraping (LinkedIn, Indeed,
  Glassdoor, and others) — this is not a config toggle someone could
  accidentally switch off.
- **robots.txt is checked before every request**, failing closed (treated
  as disallowed) if it can't be fetched — even for the "public API"
  sources, as defense in depth.
- **Sequential, rate-limited, single connection per host**, with a
  robots.txt `Crawl-delay` (when published) always overriding the default
  minimum interval upward. A circuit breaker backs off and gives up on a
  host after repeated failures instead of retrying into trouble, and a hard
  per-run request cap prevents any runaway crawl.
- **Identifies itself honestly** via a `User-Agent` carrying a real contact
  email — the client refuses to run without one.

**Architecture:** per-source adapters (`crawler/sources/`) → a shared
`PoliteHTTPClient` that enforces all of the above → normalize into a common
`JobPosting` record → upsert into SQLite, deduplicated on `(source,
external_id)`. SQLite over Postgres was a deliberate choice: single user,
single machine, no concurrent writers — a database server would be pure
overhead here.

```bash
cd python-crawler
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set CRAWLER_CONTACT_EMAIL
python -m crawler.run --dry-run   # fetch + log, no writes
python -m crawler.run             # upserts into data/jobs.db (gitignored)
```

---

## 3. `nodejs-backend` — recruiter interview booking

*Status: architecture defined, implementation in progress.*

A small TypeScript backend that sits between recruiters and my calendar,
built around the Calendly API rather than a bespoke scheduling UI.

**Why not just embed a Calendly widget and call it done:** the widget alone
gets you a booking link, but nothing ties that booking back into anything
else — no server-side record, no custom confirmation flow, no place to add
logic later (e.g. pre-screening questions, routing by role, notifying me
somewhere other than email). The backend exists to own that logic instead of
letting it live entirely inside a third-party iframe.

**Planned architecture:**

- **Node.js + TypeScript**, framework TBD between Express and Fastify —
  either is overkill for the route count involved, but both give typed
  request/response handling and a webhook signature-verification story that
  a bare `http` server would mean reimplementing.
- **Calendly as the source of truth for availability** — this backend does
  not model calendar state itself; it consumes Calendly's webhooks
  (`invitee.created`, `invitee.canceled`) and reacts to them, which avoids
  the class of bugs that comes from keeping a second calendar in sync.
- **Webhook receiver → verify signature → persist booking → notify.**
  Verification uses Calendly's webhook signing secret; persistence is
  minimal (who booked, when, for what) since Calendly already holds the
  authoritative event data.
- **Deployed independently** from the frontend and crawler, since it's the
  only one of the three that needs to be reachable by an external service
  (Calendly's webhook delivery) rather than just by me or by site visitors.

```bash
cd nodejs-backend
npm install
npm run dev     # once implemented
```

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
end-to-end (see [`python-crawler/README.md`](python-crawler/README.md)), and
`nodejs-backend` is still just a design. That's reflected in this README
rather than glossed over.

## License

MIT — see [LICENSE](LICENSE).
