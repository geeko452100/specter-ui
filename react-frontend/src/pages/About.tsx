const skills = [
  'React & JavaScript',
  'TypeScript',
  'Tailwindcss',
  'State management (hooks)',
  'REST APIs & fetch',
  'Responsive CSS',
  'Forms & validation',
  'Git & deployment',
]

function About() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-xs tracking-[0.4em] text-accent uppercase">about</p>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">
        A presence, not a performance
      </h1>

      <div className="mt-8 space-y-5 text-smoke">
        <p>
          I'm Gavin, a frontend developer early in my career and looking for
          my first full-time role. I taught myself the fundamentals the slow
          way — building things until the concepts stopped being abstract —
          and I'm still doing that, on purpose.
        </p>
        <p>
          I care most about the moments users don't consciously register: the
          loading state that doesn't feel like waiting, the form that tells
          you what went wrong instead of just turning red, the empty state
          that doesn't feel empty. Small things, held carefully.
        </p>
        <p>
          I don't have a decade behind me, but I read code closely, I finish
          what I start, and I'd rather ship something small and solid than
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
