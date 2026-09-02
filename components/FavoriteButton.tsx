'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  shopId: number;
  className?: string;
}

export default function FavoriteButton({ shopId, className = '' }: FavoriteButtonProps) {
  const { status } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/favorites')
      .then((r) => (r.ok ? r.json() : []))
      .then((shops: { id: number }[]) => {
        setIsFavorite(shops.some((s) => s.id === shopId));
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [status, shopId]);

  if (status !== 'authenticated') return null;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_id: shopId }),
        });
      } else {
        await fetch(`/api/favorites?shop_id=${shopId}`, { method: 'DELETE' });
      }
    } catch {
      setIsFavorite(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!checked || loading}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${className}`}
      aria-label={isFavorite ? 'Хадгалснаас хасах' : 'Хадгалах'}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
        }`}
      />
    </button>
  );
}
