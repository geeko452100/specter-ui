import { Link } from 'react-router-dom'
import { GithubIcon } from '../components/icons'

const featured = [
  {
    title: 'Music Player',
    url: 'https://music.specterui.dev',
    year: '2026',
    tags: ['React', 'TypeScript', 'REST API', 'Loading States'],
    blurb:
      'Persistent iframe playback that keeps playing as you browse, live search via the YouTube Data API, and skeleton loading states throughout.',
    github: 'https://github.com/geeko452100/MusicPlayer'
  },
  {
    title: 'E-commerce App',
    url: 'https://shop.specterui.dev',
    year: '2026',
    tags: ['React', 'useReducer', 'LocalStorage'],
    blurb:
      'A useReducer-driven cart, category filtering, Supabase-authenticated accounts, and Stripe checkout for tech-only products.',
    github: 'https://github.com/geeko452100/E-commerce'
  },
  {
    title: 'Game storefront',
    year: '2026',
    url: 'https://arcade.specterui.dev',
    tags: ['Typescript', 'React', 'State management', 'UI/UX Design', 'Local Storage'],
    blurb:
      'Iframe-embedded playable titles, a live leaderboard, Supabase accounts, and Stripe-gated purchases.',
    github:'https://github.com/geeko452100/GameHub'
  },
]

function Home() {
  return (
    <>
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pt-28 pb-24 text-center sm:pt-36 sm:pb-32">
        <p className="flex items-center gap-2 text-xs tracking-[0.4em] text-dust uppercase">
          <span className="animate-pulse-slow h-1.5 w-1.5 rounded-full bg-link" />
          Available for work
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-wide text-bone sm:text-6xl">
          Built with precision,
          <br />
          made to hold up.
        </h1>
        <p className="max-w-xl text-base text-smoke sm:text-lg">
          I'm Gavin — a frontend developer who builds interfaces with real
          attention to detail: clean state management, honest loading and
          error states, and code that's easy to hand off.
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
          "Most sites shout for attention. This one holds still — and lets
          the weight of what's there do the talking."
        </p>
      </section>
    </>
  )
}

export default Home
