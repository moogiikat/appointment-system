'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins } from 'lucide-react';

export default function PointsBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/points')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBalance(data ? data.balance : null))
      .catch(() => setBalance(null));
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
