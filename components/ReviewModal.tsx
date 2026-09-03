'use client';

import { useState } from 'react';
import { X, Star } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StarRating from '@/components/StarRating';

interface ReviewModalProps {
  shopId: number;
  reservationId: number;
  shopName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewModal({ shopId, reservationId, shopName, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId, rating, comment }),
      });
      if (res.ok) {
        onSubmitted();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      setError('Алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card variant="elevated" className="w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-ink-strong flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Сэтгэгдэл үлдээх
          </h2>
          <button onClick={onClose} className="text-placeholder hover:text-subtle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-subtle mb-4">{shopName}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-ink mb-2">Үнэлгээ</label>
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-ink mb-2">Сэтгэгдэл (заавал биш)</label>
          <textarea
            className="w-full px-4 py-3 border-2 border-line rounded-card focus:border-brand focus:outline-none resize-none text-base"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Үйлчилгээний тухай сэтгэгдлээ бичнэ үү..."
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <Button variant="primary" className="w-full" onClick={handleSubmit} isLoading={submitting}>
          Илгээх
        </Button>
      </Card>
    </div>
  );
}
