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
  // Postgres の NUMERIC と COUNT(*) は Neon ドライバから文字列で返る。
  // API 側でキャスト済みだが、JSON は実行時に型検査されないのでここでも数値化しておく。
  const rating = Number(value);
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const reviewCount = count === undefined || count === null ? undefined : Number(count);

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
              className={star <= Math.round(safeRating) ? 'fill-amber-400 text-amber-400' : 'fill-line text-line'}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-ink ml-1">
          {safeRating > 0 ? safeRating.toFixed(1) : '–'}
          {reviewCount !== undefined && Number.isFinite(reviewCount) && (
            <span className="text-placeholder font-normal"> ({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  );
}
