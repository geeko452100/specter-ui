import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

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

const TOKEN_STORAGE_KEY = 'specter.dashboard.token'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; postings: JobPosting[] }

type Mode = 'chooser' | 'token' | 'guest'

function Dashboard() {
  const [mode, setMode] = useState<Mode>('chooser')
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [tokenInput, setTokenInput] = useState('')
  const [state, setState] = useState<LoadState>(() => (token ? { status: 'loading' } : { status: 'idle' }))
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [minScore, setMinScore] = useState(0)
  const guestFileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (token) setMode('token')
  }, [token])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    fetch(`${API_BASE_URL}/api/postings`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken(null)
          throw new Error('That token was rejected. Try again.')
        }
        if (res.status === 503) {
          throw new Error("The crawler hasn't produced any postings yet — check back after the next run.")
        }
        if (!res.ok) {
          throw new Error(`Request failed (${res.status}).`)
        }
        return res.json() as Promise<{ postings: JobPosting[] }>
      })
      .then((data) => setState({ status: 'ready', postings: data.postings }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' })
      })

    return () => controller.abort()
  }, [token])

  async function handleGuestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = guestFileInput.current?.files?.[0]
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

  const filtered = useMemo(() => {
    if (state.status !== 'ready') return []
    return state.postings.filter((p) => {
      if (remoteOnly && !p.remote) return false
      if (p.match_score < minScore) return false
      return true
    })
  }, [state, remoteOnly, minScore])

  function handleTokenSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tokenInput.trim()) return
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim())
    setToken(tokenInput.trim())
    setTokenInput('')
    setState({ status: 'loading' })
  }

  function handleSignOut() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setState({ status: 'idle' })
    setMode('chooser')
  }

  function handleStartOver() {
    setState({ status: 'idle' })
    setMode('chooser')
  }

  if (!API_BASE_URL) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-sm text-dust">
          VITE_API_BASE_URL isn't configured — see react-frontend/.env.example.
        </p>
      </section>
    )
  }

  if (mode === 'chooser') {
    return (
      <section className="mx-auto max-w-md px-6 py-24">
        <p className="text-xs tracking-[0.4em] text-accent uppercase">job dashboard</p>
        <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">Two ways in</h1>
        <p className="mt-4 text-smoke">
          Postings pulled by python-crawler from multiple job boards. Try it yourself with your own
          resume, or unlock the private view gated by an API token.
        </p>
        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => setMode('guest')}
            className="w-full rounded-sm border border-accent/40 bg-accent-dim px-6 py-4 text-left transition-colors duration-300 hover:border-accent hover:bg-accent/20"
          >
            <span className="block text-sm tracking-widest text-bone uppercase">Try it with your resume</span>
            <span className="mt-1 block text-xs text-dust">
              Upload a .txt or .pdf resume — matched live, never stored.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('token')}
            className="w-full rounded-sm border border-iron px-6 py-4 text-left transition-colors duration-300 hover:border-dust"
          >
            <span className="block text-sm tracking-widest text-dust uppercase">I have a token</span>
            <span className="mt-1 block text-xs text-dust">Unlock the private, owner-scored view.</span>
          </button>
        </div>
      </section>
    )
  }

  if (mode === 'guest' && state.status !== 'ready') {
    return (
      <section className="mx-auto max-w-md px-6 py-24">
        <p className="text-xs tracking-[0.4em] text-accent uppercase">job dashboard</p>
        <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">Try your resume</h1>
        <p className="mt-4 text-smoke">
          Postings are ranked against your resume by keyword overlap, computed on the fly. The file is
          never stored — it's read, scored, and discarded.
        </p>
        <form onSubmit={handleGuestSubmit} className="mt-8 space-y-4">
          <input
            ref={guestFileInput}
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
          <button
            type="button"
            onClick={handleStartOver}
            className="block text-xs tracking-widest text-dust uppercase transition-colors hover:text-smoke"
          >
            &larr; Back
          </button>
        </form>
      </section>
    )
  }

  if (mode === 'token' && !token) {
    return (
      <section className="mx-auto max-w-md px-6 py-24">
        <p className="text-xs tracking-[0.4em] text-accent uppercase">private</p>
        <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">Job dashboard</h1>
        <p className="mt-4 text-smoke">
          Gated by the same bearer token nodejs-backend expects. Nothing is sent anywhere but the API.
        </p>
        <form onSubmit={handleTokenSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            required
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="API token"
            className="w-full rounded-sm border border-iron bg-ash/60 px-4 py-3 text-bone outline-none transition-colors focus:border-accent/60"
          />
          <button
            type="submit"
            className="rounded-sm border border-accent/40 bg-accent-dim px-6 py-3 text-sm tracking-widest text-bone uppercase transition-colors duration-300 hover:border-accent hover:bg-accent/20"
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={handleStartOver}
            className="block text-xs tracking-widest text-dust uppercase transition-colors hover:text-smoke"
          >
            &larr; Back
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs tracking-[0.4em] text-accent uppercase">{mode === 'token' ? 'private' : 'guest'}</p>
          <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">Job dashboard</h1>
        </div>
        <button
          type="button"
          onClick={mode === 'token' ? handleSignOut : handleStartOver}
          className="text-xs tracking-widest text-dust uppercase transition-colors hover:text-smoke"
        >
          {mode === 'token' ? 'Sign out' : 'Start over'}
        </button>
      </div>
      <p className="mt-4 max-w-xl text-smoke">
        {mode === 'token'
          ? 'Postings pulled by python-crawler, ranked by TF-IDF match against my resume/skills profile — best fit first.'
          : 'Postings pulled by python-crawler, ranked by keyword overlap against the resume you uploaded — best fit first.'}
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

      {state.status === 'loading' && <p className="mt-14 text-sm text-dust">Loading postings…</p>}
      {state.status === 'error' && <p className="mt-14 text-sm text-dust">{state.message}</p>}
      {state.status === 'ready' && filtered.length === 0 && (
        <p className="mt-14 text-sm text-dust">No postings match these filters.</p>
      )}

      {state.status === 'ready' && filtered.length > 0 && (
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
