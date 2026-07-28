import { Link } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'

function NotFound() {
  useSeo({
    title: 'Page Not Found',
    description: "The page you're looking for doesn't exist, or it's moved.",
    path: '/404',
    noindex: true,
  })

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-32 text-center">
      <p className="font-display text-6xl tracking-wide text-bone">404</p>
      <h1 className="font-display text-2xl tracking-wide text-bone">
        Nothing at this address
      </h1>
      <p className="max-w-md text-smoke">
        The page you're looking for doesn't exist, or it's moved.
      </p>
      <Link
        to="/"
        className="rounded-sm border border-accent/40 bg-accent-dim px-6 py-3 text-sm tracking-widest text-bone uppercase transition-colors duration-300 hover:border-accent hover:bg-accent/20"
      >
        Return
      </Link>
    </section>
  )
}

export default NotFound
