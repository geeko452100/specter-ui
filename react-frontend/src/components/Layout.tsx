import { Link, NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { LockIcon, LogoIcon } from './icons'

type NavLinkItem = {
  to: string
  label: string
  end?: boolean
}

const links: NavLinkItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/work', label: 'Work' },
  { to: '/about', label: 'About' },
  { to: '/resume', label: 'Resume' },
  { to: '/contact', label: 'Contact' },
]

function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col font-body text-smoke">
      <header className="relative z-10 border-b-[0.5px] border-line print:hidden">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-display text-lg tracking-[0.2em] text-bone uppercase transition-transform duration-300 hover:scale-105"
          >
            <LogoIcon className="h-6 w-6" />
            SpecterUI
          </NavLink>
          <div className="flex items-center gap-4">
            <ul className="flex items-center gap-1 text-sm">
              {links.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `relative inline-block px-3 py-2 tracking-wide uppercase transition-all duration-300 hover:scale-110 ${
                        isActive ? 'text-bone' : 'text-dust hover:text-smoke'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {label}
                        <span
                          className={`absolute inset-x-3 -bottom-[1px] h-px bg-accent transition-opacity duration-300 ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t-[0.5px] border-line print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-xs tracking-widest text-dust uppercase sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SpecterUI</p>
          <div className="flex items-center gap-3">
            <p>ggriffith288@gmail.com</p>
            <Link to="/dashboard" aria-label="Dashboard" className="text-dust transition-colors hover:text-link">
              <LockIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
