import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-forest-100 bg-forest-950 text-cream-100">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <span className="font-display text-xl font-semibold text-white">Tuition Media</span>
            <p className="mt-3 max-w-xs text-sm text-cream-100/70">
              Connecting students and teachers across Bangladesh — one subject,
              one match at a time.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">Discover</h4>
            <ul className="space-y-2 text-sm text-cream-100/80">
              <li><Link to="/teachers" className="hover:text-white">Find a Tutor</Link></li>
              <li><Link to="/requests" className="hover:text-white">Job Board</Link></li>
              <li><Link to="/questions" className="hover:text-white">Q&amp;A Community</Link></li>
              <li><Link to="/resources" className="hover:text-white">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">Account</h4>
            <ul className="space-y-2 text-sm text-cream-100/80">
              <li><Link to="/register" className="hover:text-white">Sign up</Link></li>
              <li><Link to="/login" className="hover:text-white">Log in</Link></li>
              <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">Tuition Media</h4>
            <p className="text-sm text-cream-100/70">A university database project — PostgreSQL, Express, React, Node.</p>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-cream-100/50">
          © {new Date().getFullYear()} Tuition Media. Built for learning.
        </div>
      </div>
    </footer>
  );
}
