import { useSeo } from '../hooks/useSeo'

const skills = [
  'React & TypeScript',
  'Node.js & Python',
  'REST APIs & auth',
  'PostgreSQL',
  'Cloudflare Workers',
  'Docker',
  'CI/CD (GitHub Actions)',
  'Tailwind CSS',
]

function About() {
  useSeo({
    title: 'About',
    description:
      'Gavin Griffith is a full-stack developer working across React/TypeScript frontends, Python/Node.js backends, PostgreSQL, Docker, and Cloudflare Workers.',
    path: '/about',
  })

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-xs tracking-[0.4em] text-accent uppercase">about</p>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">
        A presence, not a performance
      </h1>

      <div className="mt-8 space-y-5 text-smoke">
        <p>
          I'm Gavin, a full-stack developer early in my career and looking
          for my first full-time role. I taught myself the fundamentals the
          slow way — building things until the concepts stopped being
          abstract — and I'm still doing that, on purpose, from the database
          up through the interface.
        </p>
        <p>
          I care about the whole path a request takes: an API that fails
          predictably instead of silently, a schema that won't fight you in
          six months, and a UI on top of it where the loading state doesn't
          feel like waiting and the empty state doesn't feel empty. Small
          things, held carefully, at every layer.
        </p>
        <p>
          I don't have a decade behind me, but I read code closely, I finish
          what I start, and I'd rather ship something small and solid —
          frontend, backend, and the infrastructure in between — than
          something big and half-working. Most of what's on this site is
          proof of that, not a claim about it.
        </p>
      </div>

      <div className="mt-14 border-t border-iron/60 pt-10">
        <h2 className="font-display text-lg tracking-wide text-bone">What I work with</h2>
        <ul className="mt-5 flex flex-wrap gap-3">
          {skills.map((skill) => (
            <li
              key={skill}
              className="rounded-sm border border-iron bg-ash/60 px-4 py-2 text-sm text-smoke"
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default About
