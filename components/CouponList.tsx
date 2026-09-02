'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShopCoupon } from '@/lib/types';
import Button from '@/components/ui/Button';
import { Ticket, Check } from 'lucide-react';

interface CouponListProps {
  shopId: number;
}

export default function CouponList({ shopId }: CouponListProps) {
  const { status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<ShopCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimedIds, setClaimedIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/shops/${shopId}/coupons`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCoupons)
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        <Ticket className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        Одоогоор идэвхтэй купон байхгүй байна
      </div>
    );
  }

  const handleClaim = async (couponId: number) => {
    if (status !== 'authenticated') {
      router.push('/auth/signin');
      return;
    }
    setClaimingId(couponId);
    setError('');
    try {
      const res = await fetch(`/api/coupons/${couponId}/claim`, { method: 'POST' });
      if (res.ok) {
        setClaimedIds((prev) => [...prev, couponId]);
      } else {
        const data = await res.json();
        setError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      setError('Алдаа гарлаа');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {coupons.map((coupon) => {
        const claimed = claimedIds.includes(coupon.id);
        return (
          <div
            key={coupon.id}
            className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Ticket className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{coupon.title}</p>
                {coupon.description && (
                  <p className="text-sm text-slate-600">{coupon.description}</p>
                )}
                <p className="text-xs text-amber-700 font-semibold mt-1">
                  {coupon.points_cost > 0 ? `${coupon.points_cost} оноо` : 'Үнэгүй'}
                </p>
              </div>
            </div>
            <Button
              variant={claimed ? 'secondary' : 'primary'}
              size="sm"
              disabled={claimed}
              isLoading={claimingId === coupon.id}
              onClick={() => handleClaim(coupon.id)}
              className="gap-1.5 shrink-0"
            >
              {claimed ? (
                <>
                  <Check className="w-4 h-4" /> Авсан
                </>
              ) : (
                'Авах'
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
