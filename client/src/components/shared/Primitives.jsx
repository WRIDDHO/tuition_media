import { Star } from 'lucide-react';

export function SubjectPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-800">
      {children}
    </span>
  );
}

export function RatingStars({ rating = 0, size = 15 }) {
  const value = Number(rating) || 0;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-amber-500 text-amber-500' : 'fill-transparent text-ink-400/40'}
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-forest-100 bg-forest-50/50 px-6 py-20 text-center">
      <h3 className="font-display text-xl font-semibold text-forest-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-forest-100 border-t-forest-700 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
