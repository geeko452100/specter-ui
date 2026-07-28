import { useState, type FormEvent } from 'react'
import { GithubIcon, LinkedInIcon, MailIcon } from '../components/icons'

const socials = [
  { label: 'Email', href: 'mailto:gavingriffith212@gmail.com', Icon: MailIcon },
  { label: 'GitHub', href: 'https://github.com/geeko452100', Icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gavin-griffith', Icon: LinkedInIcon },
]

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

type SubmitState = { status: 'idle' | 'sending' | 'sent' } | { status: 'error'; message: string }

function Contact() {
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!API_BASE_URL) {
      setSubmit({ status: 'error', message: "Contact form isn't configured — email me directly instead." })
      return
    }

    const form = event.currentTarget
    const data = new FormData(form)
    setSubmit({ status: 'sending' })

    try {
      const res = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          company_website: data.get('company_website'),
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Request failed (${res.status}).`)
      }

      setSubmit({ status: 'sent' })
      form.reset()
    } catch (err) {
      setSubmit({
        status: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong sending that.',
      })
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-xs tracking-[0.4em] text-accent uppercase">contact</p>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">
        Say what you came to say
      </h1>
      <p className="mt-4 text-smoke">
        Have a project, a question, or feedback on the work? I read
        everything that comes through.
      </p>

      {submit.status === 'sent' ? (
        <div className="mt-10 rounded-sm border border-link/30 bg-link-dim p-8 text-center">
          <p className="font-display text-lg tracking-wide text-bone">Message received.</p>
          <p className="mt-2 text-sm text-dust">
            I'll get back to you soon.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="name" className="block text-xs tracking-widest text-dust uppercase">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-sm border border-iron bg-ash/60 px-4 py-3 text-bone outline-none transition-colors focus:border-accent/60"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs tracking-widest text-dust uppercase">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-sm border border-iron bg-ash/60 px-4 py-3 text-bone outline-none transition-colors focus:border-accent/60"
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-xs tracking-widest text-dust uppercase">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-sm border border-iron bg-ash/60 px-4 py-3 text-bone outline-none transition-colors focus:border-accent/60"
              placeholder="Tell me what's on your mind..."
            />
          </div>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company_website">Website</label>
            <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          {submit.status === 'error' && (
            <p className="text-sm text-red-400">{submit.message}</p>
          )}
          <button
            type="submit"
            disabled={submit.status === 'sending'}
            className="rounded-sm border border-accent/40 bg-accent-dim px-6 py-3 text-sm tracking-widest text-bone uppercase transition-colors duration-300 hover:border-accent hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submit.status === 'sending' ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}

      <div className="mt-16 flex items-center gap-5 border-t border-iron/60 pt-8">
        {socials.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="text-dust transition-colors hover:text-link"
          >
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    </section>
  )
}

export default Contact
