'use client';

import {
  Stethoscope,
  Smile,
  Sparkles,
  Scissors,
  Flower2,
  UtensilsCrossed,
  Dumbbell,
  Car,
  LayoutGrid,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { categoryStyle } from '@/lib/constants';

const ICONS: Record<string, LucideIcon> = {
  Stethoscope,
  Smile,
  Sparkles,
  Scissors,
  Flower2,
  UtensilsCrossed,
  Dumbbell,
  Car,
  LayoutGrid,
  Store,
};

interface GenreGridProps {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
}

/*
 * EPARK の search-genre-list を再現。
 * 円 48px（1px #bdbdbd）＋ 12px ラベル、SP は 5 列。
 * 選択中はブランド緑で塗る。
 */
export default function GenreGrid({ categories, selected, onSelect }: GenreGridProps) {
  return (
    <ul className="grid grid-cols-5 md:grid-cols-9 gap-y-4 list-none p-0 m-0">
      {categories.map((category) => {
        const { color, icon } = categoryStyle(category);
        const Icon = ICONS[icon] ?? Store;
        const isSelected = selected === category;

        return (
          <li key={category} className="flex">
            <button
              type="button"
              onClick={() => onSelect(isSelected ? '' : category)}
              aria-pressed={isSelected}
              className="flex flex-col items-center gap-1 w-full px-1 hover:opacity-50 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control"
            >
              <span
                className="epark-genre-circle"
                style={
                  isSelected
                    ? { borderColor: color, backgroundColor: `${color}1a` }
                    : undefined
                }
              >
                <Icon className="w-6 h-6" style={{ color }} strokeWidth={1.75} />
              </span>
              <span
                className={`text-[11px] md:text-[12px] leading-tight text-center ${
                  isSelected ? 'font-bold' : ''
                }`}
                style={{ color: isSelected ? color : '#424242' }}
              >
                {category}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
