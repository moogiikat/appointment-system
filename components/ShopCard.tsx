'use client';

import { Shop } from '@/lib/types';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Link from 'next/link';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <Link href={`/shop/${shop.id}`} className="block">
      <Card variant="elevated" className="hover:shadow-2xl transition-all duration-300 group border border-slate-100 hover:border-sky-200 cursor-pointer h-full">
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                {shop.icon ? (
                  <img src={shop.icon} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{shop.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <FavoriteButton shopId={shop.id} className="w-9 h-9 hover:bg-red-50" />
            </div>
            {(shop.category || shop.district) && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {shop.category && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                    {shop.category}
                  </span>
                )}
                {shop.district && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {shop.district}
                  </span>
                )}
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-sky-600 transition-colors">{shop.name}</h3>
            {(shop.rating_count ?? 0) > 0 && (
              <div className="mb-2">
                <StarRating value={shop.rating_avg || 0} size={14} showValue count={shop.rating_count} />
              </div>
            )}
            {shop.description && (
              <p className="text-slate-600 text-sm mb-4 line-clamp-2 whitespace-pre-line">{shop.description}</p>
            )}

            <div className="space-y-2 mb-4">
              {shop.address && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-sky-500" />
                  <span className="truncate">{shop.address}</span>
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-sky-500" />
                  <span>{shop.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-sky-500" />
                <span>
                  {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>
          
          <Button className="w-full gap-2 group-hover:bg-sky-600" variant="primary">
            Дэлгэрэнгүй үзэх
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </Card>
    </Link>
  );
}
