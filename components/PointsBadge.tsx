'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins } from 'lucide-react';
import { POINTS_CHANGED } from '@/lib/events';

export default function PointsBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/points');
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setBalance(data ? data.balance : null);
      } catch {
        if (!cancelled) setBalance(null);
      }
    }

    load();
    // クーポン引き換えなどでポイントが動いたら取り直す
    window.addEventListener(POINTS_CHANGED, load);

    return () => {
      cancelled = true;
      window.removeEventListener(POINTS_CHANGED, load);
    };
  }, []);

  return (
    <Link
      href="/rewards"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold transition-colors"
    >
      <Coins className="w-4 h-4" />
      <span>{balance !== null ? balance.toLocaleString() : '–'}</span>
    </Link>
  );
}
