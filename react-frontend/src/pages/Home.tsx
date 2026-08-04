import { Link } from 'react-router-dom'
import { GithubIcon } from '../components/icons'
import { useSeo } from '../hooks/useSeo'

const featured = [
  {
    title: 'Full-Stack Music Streaming System',
    url: 'https://music.specterui.dev',
    year: '2026',
    tags: ['React Frontend', 'FastAPI Backend', 'Groq AI Chatbot', 'Docker', 'Audio Streaming'],
    blurb:
      'A music streaming platform with a FastAPI backend for async, high-throughput data processing and a Groq-powered AI chatbot (gpt-oss-20b) that gives real-time, natural-language playlist recommendations — Dockerized end to end.',
    github: 'https://github.com/geeko452100/music-gallery.git'
  },
  {
    title: 'RBAC Package Tracker with Ticket Management',
    url: 'https://rbac.specterui.dev',
    year: '2026',
    tags: ['Next.js Auth', 'PostgreSQL DB', 'Secure Cookies', 'RBAC Permissions', 'Ticket Portal'],
    blurb:
      'Role based package management system along with a customer support management system',
    github: 'https://github.com/geeko452100/rbac-package.git'
  },
  {
    title: 'Opportunity Discovery Experience',
    year: '2026',
    url: 'https://specterui.dev/dashboard',
    tags: ['Python Ingestion', 'TF-IDF Matching', 'Cloudflare API', 'React Experience', 'Client-Facing Demo'],
    blurb:
      'A polished product experience that surfaces relevant opportunities from public listings and ranks them by fit — built to feel thoughtful, fast, and client-ready.',
    github:'https://github.com/geeko452100/specter-ui.git'
  },
]

function Home() {
  useSeo({
    title: 'Full-Stack Developer Portfolio',
    description:
      "Gavin Griffith's portfolio — polished React and TypeScript interfaces, dependable backends, and systems built for clients and teams.",
    path: '/',
  })

  return (
    <>
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pt-28 pb-24 text-center sm:pt-36 sm:pb-32">
        <p className="flex items-center gap-2 text-xs tracking-[0.4em] text-dust uppercase">
          <span className="animate-pulse-slow h-1.5 w-1.5 rounded-full bg-link" />
          Open to full-time roles &amp; client work
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-wide text-bone sm:text-6xl">
          Built to ship,
          <br />
          shaped with care.
        </h1>
        <p className="max-w-xl text-base text-smoke sm:text-lg">
          I'm Gavin — a full-stack developer who builds polished products:
          React interfaces that feel effortless, APIs that stay dependable
          under pressure, and systems that help teams ship with confidence.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/work"
            className="rounded-sm border border-accent/40 bg-accent-dim px-6 py-3 text-sm tracking-widest text-bone uppercase transition-colors duration-300 hover:border-accent hover:bg-accent/20"
          >
            View the work
          </Link>
          <Link
            to="/contact"
            className="rounded-sm border border-iron px-6 py-3 text-sm tracking-widest text-dust uppercase transition-colors duration-300 hover:border-dust hover:text-bone"
          >
            Get in touch
          </Link>
        </div>
      </section>

      <section className="border-t border-iron/60 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex items-end justify-between">
            <h2 className="font-display text-2xl tracking-wide text-bone">Recent work</h2>
            <Link to="/work" className="text-sm text-dust transition-colors hover:text-link">
              all work &rarr;
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <div
                key={project.title}
                className="group rounded-sm border border-iron/80 bg-ash/60 p-6 transition-all duration-300 hover:scale-[1.03] hover:border-accent/40"
              >
                <div className="flex items-baseline justify-between">
                  <a 
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                ><h3 className="font-display text-lg tracking-wide text-bone transition-colors group-hover:text-link">
                    {project.title}
                  </h3></a>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${project.title} on GitHub`}
                    className="text-dust transition-colors hover:text-link"
                  >
                    <GithubIcon className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-3 text-sm text-dust">{project.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-iron/60 px-6 py-20 text-center">
        <p className="mx-auto max-w-2xl font-display text-xl tracking-wide text-smoke italic">
          "Most sites shout for attention. This one lets the work speak with calm confidence."
        </p>
      </section>
    </>
  )
}

export default Home
