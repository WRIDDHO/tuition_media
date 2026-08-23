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

// A single shimmering block — the building unit for skeleton layouts.
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-forest-100/70 ${className}`} />;
}

// Matches the shape of a Teachers.jsx / TeacherPosts.jsx / Requests.jsx
// card exactly, so the loading state doesn't "jump" once real data
// arrives — width/height of each block mirrors the real content.
export function CardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-forest-100 bg-cream-50 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-auto h-5 w-20 pt-5" />
    </div>
  );
}

// Renders `count` CardSkeletons in the same grid classes the real
// content will use, so callers just swap this in during isLoading.
export function CardSkeletonGrid({ count = 6, className = '' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}