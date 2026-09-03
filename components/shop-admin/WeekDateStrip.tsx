'use client';

import { format, addDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMongoliaDate } from '@/lib/utils';

interface WeekDateStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const dayNames: Record<number, string> = {
  0: 'Ням',
  1: 'Дав',
  2: 'Мяг',
  3: 'Лха',
  4: 'Пүр',
  5: 'Баа',
  6: 'Бям',
};

export default function WeekDateStrip({ selectedDate, onSelectDate }: WeekDateStripProps) {
  const today = getMongoliaDate();
  const center = parseISO(selectedDate);
  const weekStart = addDays(center, -3);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const shiftWeek = (direction: -1 | 1) => {
    onSelectDate(format(addDays(parseISO(selectedDate), direction * 7), 'yyyy-MM-dd'));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => shiftWeek(-1)}
        className="p-2.5 rounded-card border border-line bg-white hover:border-line-strong hover:bg-brand-band transition-all shrink-0"
        aria-label="Өмнөх 7 хоног"
      >
        <ChevronLeft className="w-5 h-5 text-subtle" />
      </button>

      <div className="flex-1 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center py-2.5 px-1 rounded-card transition-all duration-200 ${
                isSelected
                  ? 'bg-brand text-white shadow-lg scale-105'
                  : isToday
                  ? 'bg-brand-band border-2 border-line-strong text-brand-dark hover:bg-brand-band'
                  : 'bg-white border border-line text-ink hover:border-line-strong hover:bg-brand-band'
              }`}
            >
              <span className="text-[10px] font-semibold opacity-80">{dayNames[day.getDay()]}</span>
              <span className="text-lg font-bold leading-tight">{format(day, 'd')}</span>
              <span className="text-[10px] opacity-70">{format(day, 'MMM')}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => shiftWeek(1)}
        className="p-2.5 rounded-card border border-line bg-white hover:border-line-strong hover:bg-brand-band transition-all shrink-0"
        aria-label="Дараагийн 7 хоног"
      >
        <ChevronRight className="w-5 h-5 text-subtle" />
      </button>
    </div>
  );
}
