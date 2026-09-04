'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shop } from '@/lib/types';
import ShopCard from '@/components/ShopCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/favorites')
      .then((r) => (r.ok ? r.json() : []))
      .then(setShops)
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-line rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-line rounded-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-strong mb-2 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            Хадгалсан газрууд
          </h1>
          <p className="text-subtle text-lg">Таны дуртай үйлчилгээний газрууд</p>
        </div>

        {shops.length === 0 ? (
          <Card variant="elevated" className="text-center py-16">
            <div className="w-24 h-24 bg-linear-to-br from-red-50 to-rose-50 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-12 h-12 text-red-300" />
            </div>
            <h2 className="text-2xl font-semibold text-ink-strong mb-3">Хадгалсан газар байхгүй байна</h2>
            <p className="text-subtle mb-8 text-lg">Дуртай газраа зүрхэн дүрс дээр дарж хадгалаарай</p>
            <Link href="/">
              <Button variant="primary" size="lg">Үйлчилгээний газар үзэх</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
