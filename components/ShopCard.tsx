'use client';

import { Shop } from '@/lib/types';
import { MapPin, Phone, Clock } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Link from 'next/link';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <Card variant="elevated" className="hover:shadow-2xl transition-shadow duration-300 group border border-slate-100">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-bold text-white">{shop.name.charAt(0)}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{shop.name}</h3>
          {shop.description && (
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{shop.description}</p>
          )}
          
          <div className="space-y-2 mb-4">
            {shop.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-sky-500" />
                <span>{shop.address}</span>
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
        
        <Link href={`/book/${shop.id}`} className="block">
          <Button className="w-full" variant="primary">
            Цаг захиалах
          </Button>
        </Link>
      </div>
    </Card>
  );
}
