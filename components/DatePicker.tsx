'use client';

import { useState } from 'react';
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDays?: number;
}

export default function DatePicker({
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  maxDays = 30,
}: DatePickerProps) {
  const [startIndex, setStartIndex] = useState(0);
  const daysToShow = 7;

  const dates = Array.from({ length: maxDays }, (_, i) => addDays(startOfDay(minDate), i));
  const visibleDates = dates.slice(startIndex, startIndex + daysToShow);

  const dayNames: Record<number, string> = {
    0: 'Ням',
    1: 'Дав',
    2: 'Мяг',
    3: 'Лха',
    4: 'Пүр',
    5: 'Баа',
    6: 'Бям',
  };

  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + daysToShow < dates.length;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setStartIndex(Math.max(0, startIndex - daysToShow))}
        disabled={!canGoPrev}
        className={`p-2 rounded-xl transition-all duration-200 ${
          canGoPrev
            ? 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50'
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 grid grid-cols-7 gap-1.5">
        {visibleDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isPast = isBefore(date, startOfDay(new Date()));

          return (
            <button
              key={date.toISOString()}
              onClick={() => !isPast && onSelectDate(date)}
              disabled={isPast}
              className={`
                flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200
                ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30 scale-105'
                    : isPast
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50'
                }
              `}
            >
              <span className="text-xs font-semibold">
                {dayNames[date.getDay()]}
              </span>
              <span className={`text-lg font-bold ${isToday(date) && !isSelected ? 'text-sky-500' : ''}`}>
                {format(date, 'd')}
              </span>
              <span className="text-xs opacity-70">
                {format(date, 'M')}-р сар
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setStartIndex(Math.min(dates.length - daysToShow, startIndex + daysToShow))}
        disabled={!canGoNext}
        className={`p-2 rounded-xl transition-all duration-200 ${
          canGoNext
            ? 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50'
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
