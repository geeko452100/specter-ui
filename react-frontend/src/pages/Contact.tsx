import { useState, type FormEvent } from 'react'
import { GithubIcon, LinkedInIcon, MailIcon } from '../components/icons'

const socials = [
  { label: 'Email', href: 'mailto:gavingriffith212@gmail.com', Icon: MailIcon },
  { label: 'GitHub', href: 'https://github.com/geeko452100', Icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gavin-griffith', Icon: LinkedInIcon },
]

function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
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

      {sent ? (
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
              required
              rows={5}
              className="mt-2 w-full rounded-sm border border-iron bg-ash/60 px-4 py-3 text-bone outline-none transition-colors focus:border-accent/60"
              placeholder="Tell me what's on your mind..."
            />
          </div>
          <button
            type="submit"
            className="rounded-sm border border-accent/40 bg-accent-dim px-6 py-3 text-sm tracking-widest text-bone uppercase transition-colors duration-300 hover:border-accent hover:bg-accent/20"
          >
            Send
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
