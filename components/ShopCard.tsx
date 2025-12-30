'use client';

import { Shop } from '@/lib/types';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Link from 'next/link';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <Link href={`/shop/${shop.id}`} className="block">
      <Card variant="elevated" className="hover:shadow-2xl transition-all duration-300 group border border-slate-100 hover:border-sky-200 cursor-pointer h-full">
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-sky-500/25 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
              {shop.icon ? (
                <img src={shop.icon} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{shop.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">{shop.name}</h3>
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
