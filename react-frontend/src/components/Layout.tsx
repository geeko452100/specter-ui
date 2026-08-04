import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { CloseIcon, LogoIcon, MenuIcon } from './icons'

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
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/contact', label: 'Contact' },
  { to: '/prairie', label: "Prairie Web Studio" },
]

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-col font-body text-smoke">
      <header className="relative z-20 border-b-[0.5px] border-line print:hidden">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-display text-lg tracking-[0.2em] text-bone uppercase transition-transform duration-300 hover:scale-105"
          >
            <LogoIcon className="h-6 w-6" />
            SpecterUI
          </NavLink>
          <div className="hidden items-center gap-4 md:flex">
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

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="rounded-sm border border-iron p-2 text-dust transition-all duration-300 hover:border-line hover:text-bone"
            >
              {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <ul className="border-t border-line/60 px-6 py-4 text-sm md:hidden">
            {links.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block py-3 tracking-wide uppercase transition-colors duration-300 ${
                      isActive ? 'text-bone' : 'text-dust hover:text-smoke'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </header>

      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t-[0.5px] border-line print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center text-xs tracking-widest text-dust uppercase sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SpecterUI</p>
          <p>gavingriffith212@gmail.com</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
