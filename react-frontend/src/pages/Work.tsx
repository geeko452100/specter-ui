const projects = [
  {
    title: 'Full-Stack Music Streaming System',
    url: 'https://music.specterui.dev',
    year: '2026',
    tags: ['React', 'TypeScript', 'FastAPI', 'Groq AI Chatbot', 'Docker'],
    blurb:
      'A music streaming platform with a FastAPI backend for async, high-throughput data processing and a Groq-powered AI chatbot (gpt-oss-20b) that gives real-time, natural-language playlist recommendations — Dockerized end to end.',
  },
  {
    title: 'RBAC Package Tracker with Ticket Management',
    url: 'https://rbac.specterui.dev',
    year: '2026',
    tags: ['Next.js Auth', 'PostgreSQL DB', 'Secure Cookies', 'RBAC Permissions', 'Ticket Portal'],
    blurb:
      'Role-based access control for package tracking and support ticketing — permission-gated data access and a dedicated admin view for managing roles in real time.',
  },
  {
    title: 'Job Dashboard',
    year: '2026',
    url: 'https://dashboard.specterui.dev',
    tags: ['Python Web Scraping', 'TF-IDF Matching', 'Cloudflare Workers API', 'React Dashboard', 'Resume Matching'],
    blurb:
      'A full-stack job-search pipeline that crawls postings from multiple boards, ranks every one by fit against a resume using TF-IDF + cosine similarity, and serves results live — try it yourself by uploading your own resume.',
  },
]

function Work() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-xs tracking-[0.4em] text-accent uppercase">selected work</p>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">
        Things I've brought to life
      </h1>
      <p className="mt-4 max-w-xl text-smoke">
        Front-end fundamentals, built and shipped — API integration, state
        management, and forms that hold up under real input. Small in scope,
        solid in execution.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
            <article
              key={project.title}
              className="group relative overflow-hidden rounded-sm border border-iron/80 bg-ash/60 p-7 transition-all duration-300 hover:scale-[1.03] hover:border-accent/40"
            >
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl tracking-wide text-bone transition-colors group-hover:text-link">
                <a href={project.url}>{project.title}</a>
              </h2>
              <span className="text-xs text-dust">{project.year}</span>
            </div>
            <p className="mt-3 text-sm text-smoke">{project.blurb}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-sm border border-iron px-3 py-1 text-xs tracking-wide text-dust"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Work
