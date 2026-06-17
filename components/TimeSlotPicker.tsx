'use client';

import { TimeSlot } from '@/lib/types';
import { Clock } from 'lucide-react';

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export default function TimeSlotPicker({
  timeSlots,
  selectedTime,
  onSelectTime,
}: TimeSlotPickerProps) {
  const availableCount = timeSlots.filter((s) => s.available).length;
  const fullCount = timeSlots.length - availableCount;

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">Боломжит цаг байхгүй байна</p>
        <p className="text-sm mt-1">Өөр огноо сонгоно уу</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1.5 text-emerald-600">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          Сул: {availableCount}
        </span>
        {fullCount > 0 && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 bg-slate-300 rounded-full" />
            Дүүрсэн: {fullCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {timeSlots.map((slot) => (
          <button
            type="button"
            key={slot.time}
            onClick={() => slot.available && onSelectTime(slot.time)}
            disabled={!slot.available}
            className={`
              relative py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${
                selectedTime === slot.time
                  ? 'bg-linear-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30 scale-105'
                  : slot.available
                  ? 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
              }
            `}
          >
            {slot.time}
            {!slot.available && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                ✕
              </span>
            )}
            {slot.available && slot.max_capacity > 1 && (
              <span className="block text-xs mt-0.5 opacity-70">
                {slot.max_capacity - slot.current_count}/{slot.max_capacity}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
