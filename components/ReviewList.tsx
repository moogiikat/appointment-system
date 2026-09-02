'use client';

import { useEffect, useState } from 'react';
import { Review } from '@/lib/types';
import StarRating from './StarRating';
import { MessageCircle, Store } from 'lucide-react';

interface ReviewListProps {
  shopId: number;
  refreshKey?: number;
}

export default function ReviewList({ shopId, refreshKey }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shops/${shopId}/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [shopId, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        Одоогоор сэтгэгдэл байхгүй байна
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-sky-400 to-cyan-400 flex items-center justify-center overflow-hidden shrink-0">
                {review.user_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {review.user_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <span className="font-semibold text-slate-800 text-sm">{review.user_name}</span>
            </div>
            <StarRating value={review.rating} size={14} />
          </div>
          {review.comment && (
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{review.comment}</p>
          )}
          {review.shop_reply && (
            <div className="mt-3 ml-4 p-3 bg-white rounded-lg border border-sky-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 mb-1">
                <Store className="w-3.5 h-3.5" />
                Үйлчилгээний газрын хариу
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line">{review.shop_reply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
