'use client';

import { Reservation } from '@/lib/types';
import { generateTimeSlots } from '@/lib/utils';
import { Shop } from '@/lib/types';
import { Clock } from 'lucide-react';

interface DayTimelineProps {
  shop: Shop;
  reservations: Reservation[];
  selectedDate: string;
}

export default function DayTimeline({ shop, reservations, selectedDate }: DayTimelineProps) {
  const slots = generateTimeSlots(
    shop.opening_time.slice(0, 5),
    shop.closing_time.slice(0, 5),
    shop.slot_duration
  );

  const activeReservations = reservations.filter((r) => r.status !== 'cancelled');

  const getSlotReservations = (time: string) =>
    activeReservations.filter((r) => r.reservation_time.slice(0, 5) === time);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-400',
    confirmed: 'bg-emerald-500',
    completed: 'bg-slate-400',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-sky-500" />
        <h2 className="text-lg font-bold text-slate-800">Өдрийн хуваарь</h2>
        <span className="text-sm text-slate-500 ml-auto">{selectedDate}</span>
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {slots.map((time) => {
          const slotReservations = getSlotReservations(time);
          const isFull = slotReservations.length >= shop.max_capacity;
          const isEmpty = slotReservations.length === 0;

          return (
            <div
              key={time}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                isEmpty ? 'hover:bg-slate-50' : 'bg-slate-50/80'
              }`}
            >
              <span className="w-14 text-sm font-bold text-slate-600 flex-shrink-0">{time}</span>
              <div className="flex-1 flex items-center gap-2 min-h-[32px]">
                {slotReservations.length > 0 ? (
                  slotReservations.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-semibold ${statusColors[r.status] || 'bg-sky-500'}`}
                      title={`${r.customer_name} - ${r.customer_phone || ''}`}
                    >
                      <span className="truncate max-w-[120px]">{r.customer_name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Сул</span>
                )}
              </div>
              <span
                className={`text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full ${
                  isFull
                    ? 'bg-red-100 text-red-600'
                    : isEmpty
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-sky-100 text-sky-600'
                }`}
              >
                {slotReservations.length}/{shop.max_capacity}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-amber-400 rounded" /> Хүлээгдэж буй
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-emerald-500 rounded" /> Баталгаажсан
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-slate-400 rounded" /> Дууссан
        </span>
      </div>
    </div>
  );
}
