'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  showValue?: boolean;
  count?: number;
}

export default function StarRating({ value, onChange, size = 16, showValue = false, count }: StarRatingProps) {
  const interactive = !!onChange;

  return (
    <div className="inline-flex items-center gap-1">
      <div className="inline-flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            aria-label={`${star} од`}
          >
            <Star
              width={size}
              height={size}
              className={star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-slate-700 ml-1">
          {value > 0 ? value.toFixed(1) : '–'}
          {typeof count === 'number' && (
            <span className="text-slate-400 font-normal"> ({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
