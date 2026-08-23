import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, User, ChevronDown, LayoutDashboard, FileEdit, ClipboardList, Bookmark, LogOut, PlusCircle, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { label: 'Find a Tutor', to: '/teachers' },
  { label: 'Tutor Openings', to: '/teacher-posts' },
  { label: 'Job Board', to: '/requests' },
  { label: 'Q&A', to: '/questions' },
  { label: 'Resources', to: '/resources' },
];

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="9" cy="11" r="5.5" fill="var(--color-forest-800)" />
      <circle cx="25" cy="23" r="5.5" fill="var(--color-amber-500)" />
      <path d="M13 15L21 19" stroke="var(--color-ink-900)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AccountMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isTeacher = user.role === 'teacher';
  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Settings, label: 'Account settings', to: '/account/settings' },
    { icon: FileEdit, label: 'Edit profile', to: isTeacher ? '/teachers/me/edit' : '/students/me/edit' },
    {
      icon: PlusCircle,
      label: isTeacher ? 'Publish a post' : 'Post a request',
      to: isTeacher ? '/teacher-posts/new' : '/requests/new',
    },
    ...(isTeacher
      ? [{ icon: PlusCircle, label: 'Upload a resource', to: '/resources/new' }]
      : [
          { icon: ClipboardList, label: 'My applications', to: '/my-applications' },
          { icon: Bookmark, label: 'My bookmarks', to: '/bookmarks' },
        ]),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-forest-100 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-forest-100/70"
      >
        <User size={16} />
        {user.fullName?.split(' ')[0]}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-forest-100 bg-cream-50 py-2 shadow-xl shadow-forest-900/10"
          >
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-forest-100"
              >
                <item.icon size={16} className="text-forest-700" /> {item.label}
              </Link>
            ))}
            <div className="my-1 border-t border-forest-100" />
            <button
              onClick={() => { logout(); setOpen(false); navigate('/'); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-forest-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-xl font-semibold text-forest-900">Tuition Media</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="ink-underline whitespace-nowrap font-medium text-ink-600 hover:text-forest-900"
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
              <AccountMenu user={user} logout={logout} />
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

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-forest-100 bg-cream-50 lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="py-2 font-medium text-ink-600">
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-forest-100 pt-3">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 font-semibold text-forest-900">
                      Dashboard
                    </Link>
                    <Link
                      to={user.role === 'teacher' ? '/teachers/me/edit' : '/students/me/edit'}
                      onClick={() => setOpen(false)}
                      className="py-2 text-ink-600"
                    >
                      Edit profile
                    </Link>
                    {user.role === 'student' && (
                      <>
                        <Link to="/my-applications" onClick={() => setOpen(false)} className="py-2 text-ink-600">
                          My applications
                        </Link>
                        <Link to="/bookmarks" onClick={() => setOpen(false)} className="py-2 text-ink-600">
                          My bookmarks
                        </Link>
                      </>
                    )}
                    <Link to="/notifications" onClick={() => setOpen(false)} className="py-2 text-ink-600">
                      Notifications
                    </Link>
                    <button
                      onClick={() => { logout(); setOpen(false); }}
                      className="py-2 text-left text-red-600"
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