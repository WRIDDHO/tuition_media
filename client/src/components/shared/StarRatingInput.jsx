import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={32}
            className={
              n <= (hover || value)
                ? 'fill-amber-500 text-amber-500'
                : 'fill-transparent text-ink-400/40'
            }
          />
        </button>
      ))}
    </div>
  );
}