'use client';

import { TimeSlot } from '@/lib/types';

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
  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        Боломжит цаг байхгүй байна
      </div>
    );
  }

  return (
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
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30 scale-105'
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
          {slot.available && slot.current_count > 0 && (
            <span className="block text-xs mt-0.5 opacity-70">
              {slot.max_capacity - slot.current_count}/{slot.max_capacity}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
