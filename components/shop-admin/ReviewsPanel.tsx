'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StarRating from '@/components/StarRating';
import { MessageCircle, Send } from 'lucide-react';

interface ReviewsPanelProps {
  shopId: number;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function ReviewsPanel({ shopId, onError, onSuccess }: ReviewsPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);

  const fetchReviews = () => {
    setLoading(true);
    fetch(`/api/shops/${shopId}/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchReviews, [shopId]);

  const handleReply = async (reviewId: number) => {
    const reply = (replyDrafts[reviewId] || '').trim();
    if (!reply) return;
    setSendingId(reviewId);
    try {
      const res = await fetch(`/api/shops/${shopId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_reply: reply }),
      });
      if (res.ok) {
        fetchReviews();
        onSuccess('Хариу илгээгдлээ');
      } else {
        onError('Хариу илгээхэд алдаа гарлаа');
      }
    } catch {
      onError('Хариу илгээхэд алдаа гарлаа');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-6">
      <Card variant="elevated" className="p-5!">
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand" />
          Сэтгэгдэл ({reviews.length})
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-card animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-subtle text-center py-6">Одоогоор сэтгэгдэл байхгүй байна</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-surface rounded-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-ink-strong text-sm">{review.user_name}</span>
                  <StarRating value={review.rating} size={14} />
                </div>
                {review.comment && (
                  <p className="text-sm text-ink mb-3 whitespace-pre-line">{review.comment}</p>
                )}

                {review.shop_reply ? (
                  <div className="p-3 bg-white rounded-control border border-brand-band">
                    <p className="text-xs font-semibold text-brand-dark mb-1">Таны хариу</p>
                    <p className="text-sm text-subtle whitespace-pre-line">{review.shop_reply}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Хариу бичих..."
                      value={replyDrafts[review.id] || ''}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-2 border-2 border-line rounded-control text-sm focus:border-brand focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleReply(review.id)}
                      isLoading={sendingId === review.id}
                      className="gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
