'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PointTransaction, UserCoupon } from '@/lib/types';
import Card from '@/components/ui/Card';
import { Coins, Ticket, Store, CheckCircle2, Clock } from 'lucide-react';

export default function RewardsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/points').then((r) => (r.ok ? r.json() : { balance: 0, transactions: [] })),
      fetch('/api/my-coupons').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([pointsData, couponsData]) => {
        setBalance(pointsData.balance);
        setTransactions(pointsData.transactions);
        setCoupons(couponsData);
      })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-line rounded w-1/3" />
          <div className="h-32 bg-line rounded-card" />
          <div className="h-32 bg-line rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-strong mb-2 flex items-center gap-2">
            <Coins className="w-8 h-8 text-amber-500" />
            Оноо, купон
          </h1>
          <p className="text-subtle text-lg">Таны хуримтлуулсан оноо болон авсан купонууд</p>
        </div>

        {/* Balance */}
        <Card variant="elevated" className="mb-6 bg-linear-to-br from-amber-400 to-orange-400 text-white">
          <p className="text-sm font-medium opacity-90 mb-1">Одоогийн оноо</p>
          <p className="text-4xl font-extrabold">{balance.toLocaleString()}</p>
        </Card>

        {/* Coupon wallet */}
        <Card variant="elevated" className="mb-6">
          <h2 className="text-lg font-bold text-ink-strong mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-500" />
            Миний купон
          </h2>
          {coupons.length === 0 ? (
            <p className="text-sm text-subtle text-center py-6">Одоогоор купон аваагүй байна</p>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`p-4 rounded-card border-2 border-dashed ${
                    coupon.used_at ? 'border-line bg-surface' : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-strong">{coupon.title}</p>
                      <p className="text-xs text-subtle flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3" />
                        {coupon.shop_name}
                      </p>
                      <p className="text-xs font-mono font-bold text-subtle mt-2 tracking-wider">
                        {coupon.code}
                      </p>
                    </div>
                    {coupon.used_at ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-line text-subtle">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ашигласан
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        <Clock className="w-3.5 h-3.5" />
                        Ашиглаагүй
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Points history */}
        <Card variant="elevated">
          <h2 className="text-lg font-bold text-ink-strong mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Ононы түүх
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-subtle text-center py-6">Ононы түүх байхгүй байна</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-surface rounded-card">
                  <div>
                    <p className="text-sm font-medium text-ink-strong">
                      {t.description || (t.reason === 'visit' ? 'Захиалга дуусгасны оноо' : t.reason)}
                    </p>
                    <p className="text-xs text-subtle">{t.shop_name}</p>
                  </div>
                  <span className={`font-bold ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.amount >= 0 ? '+' : ''}
                    {t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
