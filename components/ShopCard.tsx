'use client';

import { Shop } from '@/lib/types';
import { MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import StarRating from './StarRating';
import FavoriteButton from './FavoriteButton';
import { categoryStyle } from '@/lib/constants';

interface ShopCardProps {
  shop: Shop;
}

/*
 * EPARK の popular_shops_box をそのままの寸法で再現：
 * 写真 182px（SP 120px）→ ジャンル名 12px #999 → 店名 14px #424242。
 * CTA ボタンは置かない。カード全体がリンクで、hover は opacity 0.7。
 */
export default function ShopCard({ shop }: ShopCardProps) {
  /*
   * 写真とロゴでは扱いが違う。写真は枠いっぱいに敷いて切り抜いてよいが、
   * ロゴを object-cover すると上下が切れて図形も社名も欠ける。
   * 写真が無くてロゴに落ちたときは、白地に収めて表示する。
   */
  const hasPhoto = !!shop.photos?.[0];
  const photo = shop.photos?.[0] || shop.icon;
  const { color } = categoryStyle(shop.category);

  return (
    <Link
      href={`/shop/${shop.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="epark-card block h-full overflow-hidden"
    >
      <div className="relative h-[120px] md:h-[182px] bg-surface">
        {photo ? (
          <img
            src={photo}
            alt={shop.name}
            className={
              hasPhoto
                ? 'w-full h-full object-cover'
                : 'w-full h-full object-contain bg-white p-4'
            }
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${color}1a` }}
          >
            <span className="text-4xl font-bold" style={{ color }}>
              {shop.name.charAt(0)}
            </span>
          </div>
        )}
        <FavoriteButton
          shopId={shop.id}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 shadow-control"
        />
      </div>

      <div className="px-2 pt-2.5 pb-4 md:px-[17px] md:pt-[17px]">
        {(shop.category || shop.district) && (
          <p className="text-[12px] text-subtle mb-1 truncate">
            {shop.category && <span style={{ color }}>{shop.category}</span>}
            {shop.category && shop.district && <span> · </span>}
            {shop.district}
          </p>
        )}

        <h3 className="text-[14px] font-bold text-ink leading-[1.5] min-h-[39px] md:min-h-[42px] line-clamp-2">
          {shop.name}
        </h3>

        {(shop.rating_count ?? 0) > 0 && (
          <div className="mt-1">
            <StarRating value={shop.rating_avg || 0} size={13} showValue count={shop.rating_count} />
          </div>
        )}

        <div className="mt-2 space-y-1 text-[12px] text-subtle">
          {shop.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{shop.address}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
