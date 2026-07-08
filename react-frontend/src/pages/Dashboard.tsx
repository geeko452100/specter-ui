import { useMemo, useRef, useState, type FormEvent } from 'react'

interface JobPosting {
  source: string
  external_id: string
  title: string
  company: string
  url: string
  location: string | null
  remote: boolean | null
  description: string | null
  tags: string[]
  posted_at: string | null
  match_score: number
  match_terms: string[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; postings: JobPosting[] }

function Dashboard() {
  const [state, setState] = useState<LoadState>({ status: 'idle' })
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [minScore, setMinScore] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = fileInput.current?.files?.[0]
    if (!file) return

    setState({ status: 'loading' })
    const body = new FormData()
    body.append('resume', file)

    try {
      const res = await fetch(`${API_BASE_URL}/guest/match`, { method: 'POST', body })
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? `Request failed (${res.status}).`)
      }
      const data = (await res.json()) as { postings: JobPosting[] }
      setState({ status: 'ready', postings: data.postings })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' })
    }
  }

  function handleStartOver() {
    setState({ status: 'idle' })
  }

  const filtered = useMemo(() => {
    if (state.status !== 'ready') return []
    return state.postings.filter((p) => {
      if (remoteOnly && !p.remote) return false
      if (p.match_score < minScore) return false
      return true
    })
  }, [state, remoteOnly, minScore])

  if (!API_BASE_URL) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-sm text-dust">
          VITE_API_BASE_URL isn't configured — see react-frontend/.env.example.
        </p>
      </section>
    )
  }

  if (state.status !== 'ready') {
    return (
      <section className="mx-auto max-w-md px-6 py-24">
        <p className="text-xs tracking-[0.4em] text-accent uppercase">job dashboard</p>
        <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">Try your resume</h1>
        <p className="mt-4 text-smoke">
          Postings pulled by python-crawler from multiple job boards, ranked against your resume by
          keyword overlap, computed on the fly. The file is never stored — it's read, scored, and
          discarded.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.pdf,text/plain,application/pdf"
            required
            className="w-full rounded-sm border border-iron bg-ash/60 px-4 py-3 text-sm text-smoke outline-none transition-colors file:mr-4 file:rounded-sm file:border-0 file:bg-accent-dim file:px-3 file:py-1.5 file:text-bone focus:border-accent/60"
          />
          {state.status === 'error' && <p className="text-sm text-dust">{state.message}</p>}
          <button
            type="submit"
            disabled={state.status === 'loading'}
            className="rounded-sm border border-accent/40 bg-accent-dim px-6 py-3 text-sm tracking-widest text-bone uppercase transition-colors duration-300 hover:border-accent hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === 'loading' ? 'Matching…' : 'Find my matches'}
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs tracking-[0.4em] text-accent uppercase">guest</p>
          <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">Job dashboard</h1>
        </div>
        <button
          type="button"
          onClick={handleStartOver}
          className="text-xs tracking-widest text-dust uppercase transition-colors hover:text-smoke"
        >
          Start over
        </button>
      </div>
      <p className="mt-4 max-w-xl text-smoke">
        Postings pulled by python-crawler, ranked by keyword overlap against the resume you uploaded —
        best fit first.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-smoke">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            className="accent-accent"
          />
          Remote only
        </label>
        <label className="flex items-center gap-2 text-sm text-smoke">
          Min match
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-sm border border-iron bg-ash/60 px-2 py-1 text-bone outline-none"
          >
            <option value={0}>Any</option>
            <option value={0.1}>10%</option>
            <option value={0.2}>20%</option>
            <option value={0.3}>30%</option>
            <option value={0.4}>40%</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 && <p className="mt-14 text-sm text-dust">No postings match these filters.</p>}

      {filtered.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {filtered.map((posting) => (
            <article
              key={`${posting.source}:${posting.external_id}`}
              className="group relative overflow-hidden rounded-sm border border-iron/80 bg-ash/60 p-7 transition-all duration-300 hover:border-accent/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg tracking-wide text-bone">
                  <a href={posting.url} target="_blank" rel="noreferrer" className="hover:text-link">
                    {posting.title}
                  </a>
                </h2>
                <span className="shrink-0 rounded-sm border border-accent/40 bg-accent-dim px-2 py-1 text-xs text-bone">
                  {Math.round(posting.match_score * 100)}% match
                </span>
              </div>
              <p className="mt-1 text-sm text-dust">
                {posting.company}
                {posting.location ? ` · ${posting.location}` : ''}
                {posting.remote ? ' · Remote' : ''}
              </p>
              {posting.match_terms.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {posting.match_terms.map((term) => (
                    <li
                      key={term}
                      className="rounded-sm border border-iron px-3 py-1 text-xs tracking-wide text-dust"
                    >
                      {term}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Dashboard
