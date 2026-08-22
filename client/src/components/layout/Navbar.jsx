import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { label: 'Find a Tutor', to: '/teachers' },
  { label: 'Job Board', to: '/requests' },
  { label: 'Q&A', to: '/questions' },
  { label: 'Resources', to: '/resources' },
];

function LogoMark() {
  // The signature element: two nodes (student + teacher) joined by a
  // connecting line — literalizes "tutor matching" instead of a generic
  // abstract mark. Reused nowhere else at this scale, kept restrained
  // everywhere else in the app.
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="9" cy="11" r="5.5" fill="var(--color-forest-800)" />
      <circle cx="25" cy="23" r="5.5" fill="var(--color-amber-500)" />
      <path
        d="M13 15L21 19"
        stroke="var(--color-ink-900)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-forest-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-xl font-semibold text-forest-900">
            Tuition Media
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="ink-underline font-medium text-ink-600 hover:text-forest-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Link
                to="/notifications"
                className="rounded-full p-2 text-ink-600 hover:bg-forest-100 hover:text-forest-900"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full bg-forest-100 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-forest-100/70"
              >
                <User size={16} />
                {user.fullName?.split(' ')[0]}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-sm font-medium text-ink-400 hover:text-forest-900"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium text-ink-600 hover:text-forest-900">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-forest-900 px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-forest-100 bg-cream-50 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="py-2 font-medium text-ink-600"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-forest-100 pt-3">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 font-semibold text-forest-900">
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { logout(); setOpen(false); navigate('/'); }}
                      className="py-2 text-left text-ink-400"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)} className="py-2 font-medium text-ink-600">
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-forest-900 px-5 py-2.5 text-center text-sm font-semibold text-cream-50"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
