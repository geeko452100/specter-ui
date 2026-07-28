import { GithubIcon, LinkedInIcon, MailIcon } from '../components/icons'

// Phone digits are assembled from char codes rather than written as a
// literal string, so the number never appears as searchable plain text in
// the shipped HTML/JS bundle — a basic defense against regex-scraping spam
// bots. (Not applied to the downloadable PDF: a resume's whole job is to
// hand recruiters/ATS your contact info in plain text.)
const PHONE_CODES = [54, 50, 48, 50, 56, 50, 51, 56, 52, 55]
const phoneDigits = PHONE_CODES.map((c) => String.fromCharCode(c)).join('')
const phoneDisplay = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`

const RESUME_PDF_HREF = '/gavin-griffith-resume.pdf'

const skills = [
  { label: 'Languages', value: 'JavaScript (ES6+), TypeScript, Python, SQL (PostgreSQL), C#, HTML5, CSS3' },
  { label: 'Frameworks & Libraries', value: 'React, Next.js, FastAPI, Node.js, Express, Tailwind CSS, scikit-learn' },
  { label: 'Backend & Cloud', value: 'Supabase, Docker, Cloudflare Workers, RESTful APIs, Alembic' },
  { label: 'Databases & Security', value: 'PostgreSQL, Relational Schema Design, Row-Level Security (RLS), RBAC' },
]

const projects = [
  {
    title: 'AI-Powered Job Tracker Dashboard',
    bullets: [
      'Built a full-stack job-search pipeline — a polite, rate-limited Python crawler, a Node.js API, and a React dashboard — that scrapes, normalizes, and stores postings from multiple job boards.',
      'Applied scikit-learn (TF-IDF + cosine similarity) to auto-rank every posting by fit against a skills profile, replacing manual triage.',
    ],
  },
  {
    title: 'Full-Stack Music Streaming System',
    bullets: [
      'Rebuilt the backend on FastAPI for asynchronous, high-throughput data processing, and containerized the full stack with Docker for consistent deploys.',
      'Shipped a Groq-powered chatbot (gpt-oss-20b) for real-time, natural-language playlist recommendations inside a React/TypeScript frontend.',
    ],
  },
  {
    title: 'Enterprise Role-Based Access Control (RBAC) System',
    bullets: [
      'Authored Supabase Row-Level Security policies and database triggers enforcing permission-based data isolation across a Next.js App Router app.',
      'Designed an administrative view for real-time role management, system auditing, and secure route guarding.',
    ],
  },
]

function Resume() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 print:max-w-none print:px-0 print:py-0">
      <div className="flex items-start justify-between gap-6 print:hidden">
        <div>
          <p className="text-xs tracking-[0.4em] text-accent uppercase">resume</p>
          <h1 className="mt-3 font-display text-3xl tracking-wide text-bone sm:text-4xl">
            One page, no fluff
          </h1>
        </div>
        <a
          href={RESUME_PDF_HREF}
          download="Gavin-Griffith-Resume.pdf"
          className="mt-1 shrink-0 rounded-sm border border-accent/40 bg-accent-dim px-5 py-3 text-sm tracking-widest text-bone uppercase transition-colors duration-300 hover:border-accent hover:bg-accent/20"
        >
          Download PDF
        </a>
      </div>

      <article className="mt-12 rounded-sm border border-iron/80 bg-ash/60 p-8 text-sm sm:p-10 print:mt-0 print:rounded-none print:border-none print:bg-white print:p-0 print:text-[12px] print:leading-snug print:text-black">
        <header className="border-b border-iron/60 pb-6 print:pb-3 print:border-black/20">
          <h2 className="font-display text-2xl tracking-wide text-bone print:text-xl print:text-black">Gavin Griffith</h2>
          <p className="mt-1 text-sm text-smoke print:text-black">
            Full-Stack / Frontend Engineer &mdash; Great Bend, Kansas
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-dust print:mt-1.5 print:text-black">
            <a href="mailto:gavingriffith212@gmail.com" className="inline-flex items-center gap-1.5 hover:text-link print:text-black">
              <MailIcon className="h-4 w-4 print:hidden" />
              gavingriffith212@gmail.com
            </a>
            <span aria-label="phone number">{phoneDisplay}</span>
            <a
              href="https://linkedin.com/in/gavin-griffith"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-link print:text-black"
            >
              <LinkedInIcon className="h-4 w-4 print:hidden" />
              linkedin.com/in/gavin-griffith
            </a>
            <a
              href="https://github.com/geeko452100"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-link print:text-black"
            >
              <GithubIcon className="h-4 w-4 print:hidden" />
              github.com/geeko452100
            </a>
            <a href="https://specterui.dev" target="_blank" rel="noreferrer" className="hover:text-link print:text-black">
              specterui.dev
            </a>
          </div>
        </header>

        <div className="mt-6 print:mt-3">
          <h3 className="font-display text-xs tracking-[0.3em] text-accent uppercase print:text-[10px] print:text-black">
            Technical Skills
          </h3>
          <dl className="mt-3 space-y-1.5 text-sm text-smoke print:mt-1.5 print:space-y-0.5 print:text-black">
            {skills.map((row) => (
              <div key={row.label} className="flex flex-wrap gap-x-2">
                <dt className="font-medium text-bone print:text-black">{row.label}:</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-7 print:mt-3">
          <h3 className="font-display text-xs tracking-[0.3em] text-accent uppercase print:text-[10px] print:text-black">
            Technical Projects
          </h3>
          <div className="mt-3 space-y-5 print:mt-1.5 print:space-y-2">
            {projects.map((project) => (
              <div key={project.title}>
                <p className="font-display text-sm font-medium tracking-wide text-bone print:text-black">
                  {project.title}
                </p>
                <ul className="mt-1.5 space-y-1 text-sm text-smoke print:mt-0.5 print:space-y-0 print:text-black">
                  {project.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="text-accent print:text-black">&bull;</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 print:mt-3">
          <h3 className="font-display text-xs tracking-[0.3em] text-accent uppercase print:text-[10px] print:text-black">
            Professional Experience
          </h3>
          <div className="mt-3 print:mt-1.5">
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-display font-medium tracking-wide text-bone print:text-black">
                Freelance / Independent Technical Builder
              </span>
              <span className="text-xs text-dust print:text-black">
                Remote (Great Bend, KS) &middot; June 2024 &ndash; Present
              </span>
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-smoke print:mt-0.5 print:space-y-0 print:text-black">
              <li className="flex gap-2">
                <span className="text-accent print:text-black">&bull;</span>
                <span>Design and ship full-stack web applications end to end — frontend, backend, and deployment — using AI-assisted prototyping to move quickly without sacrificing code quality.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent print:text-black">&bull;</span>
                <span>Run post-launch performance audits to cut web latency and improve mobile responsiveness; maintain public open-source repositories with documentation written for other contributors.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-7 print:mt-3">
          <h3 className="font-display text-xs tracking-[0.3em] text-accent uppercase print:text-[10px] print:text-black">
            Education &amp; Certifications
          </h3>
          <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 text-sm print:mt-1.5">
            <span className="font-display font-medium tracking-wide text-bone print:text-black">
              Graduate Certification in Full-Stack Software Development
            </span>
            <span className="text-xs text-dust print:text-black">The Tech Academy &middot; 2026</span>
          </p>
          <p className="mt-1 text-sm text-smoke print:text-black">
            900-hour program covering full-stack web architectures, OOP, relational databases, and cloud
            deployment.
          </p>
        </div>
      </article>
    </section>
  )
}

export default Resume
