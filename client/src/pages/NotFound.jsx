import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl font-semibold text-forest-900">404</p>
      <p className="mt-3 text-ink-600">This page doesn't exist.</p>
      <Link to="/" className="mt-6 rounded-full bg-forest-900 px-6 py-2.5 font-semibold text-cream-50">
        Back home
      </Link>
    </div>
  );
}
