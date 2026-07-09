import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { List, X } from '@phosphor-icons/react'
import { useAuth } from '../lib/AuthContext'
import { Button } from './Button'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex justify-center px-4 pt-5">
        <nav
          className="flex w-full max-w-5xl items-center justify-between rounded-full
                     border border-hairline bg-ink-900/70 py-2.5 pl-6 pr-2.5 backdrop-blur-2xl
                     shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_20px_50px_-20px_rgba(0,0,0,0.6)]"
        >
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-medium text-mist-50">
            <BrandMark className="h-5 w-5 text-gold-500" />
            VoyageFlow
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-mist-300 hover:text-mist-50 transition-colors duration-500">
                  My trips
                </Link>
                <Button variant="secondary" size="md" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin" className="text-sm text-mist-300 hover:text-mist-50 transition-colors duration-500">
                  Sign in
                </Link>
                <Button variant="primary" size="md" onClick={() => navigate('/signup')}>
                  Start planning
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-mist-100"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={20} weight="light" /> : <List size={20} weight="light" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-30 flex flex-col items-center justify-center gap-8
                    bg-ink-950/90 backdrop-blur-3xl transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        {[
          user ? { label: 'My trips', to: '/dashboard' } : { label: 'Sign in', to: '/signin' },
        ].map((item, i) => (
          <Link
            key={item.label}
            to={item.to}
            onClick={() => setOpen(false)}
            className={`font-display text-3xl text-mist-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                        ${open ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
            style={{ transitionDelay: `${i * 60 + 100}ms` }}
          >
            {item.label}
          </Link>
        ))}
        {user ? (
          <Button variant="primary" size="lg" onClick={() => { setOpen(false); handleSignOut() }}>
            Sign out
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => { setOpen(false); navigate('/signup') }}>
            Start planning
          </Button>
        )}
      </div>
    </>
  )
}
