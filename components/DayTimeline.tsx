'use client';

import { Reservation, Shop } from '@/lib/types';
import { generateTimeSlots } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface DayTimelineProps {
  shop: Shop;
  reservations: Reservation[];
  selectedDate: string;
  onReservationClick?: (id: number) => void;
}

export default function DayTimeline({ shop, reservations, selectedDate, onReservationClick }: DayTimelineProps) {
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
    completed: 'bg-placeholder',
  };

  return (
    <div className="bg-white rounded-card shadow-sm border border-line p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-brand" />
        <h2 className="text-lg font-bold text-ink-strong">Өдрийн хуваарь</h2>
        <span className="text-sm text-subtle ml-auto">{selectedDate}</span>
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {slots.map((time) => {
          const slotReservations = getSlotReservations(time);
          const isFull = slotReservations.length >= shop.max_capacity;
          const isEmpty = slotReservations.length === 0;

          return (
            <div
              key={time}
              className={`flex items-center gap-3 px-3 py-2 rounded-card transition-colors ${
                isEmpty ? 'hover:bg-surface' : 'bg-surface/80'
              }`}
            >
              <span className="w-14 text-sm font-bold text-subtle shrink-0">{time}</span>
              <div className="flex-1 flex items-center gap-2 min-h-[32px]">
                {slotReservations.length > 0 ? (
                  slotReservations.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onReservationClick?.(r.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-control text-white text-xs font-semibold transition-transform hover:scale-105 ${statusColors[r.status] || 'bg-brand'}`}
                      title={`${r.customer_name} - ${r.customer_phone || ''}`}
                    >
                      <span className="truncate max-w-[120px]">{r.customer_name}</span>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-placeholder italic">Сул</span>
                )}
              </div>
              <span
                className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${
                  isFull
                    ? 'bg-red-100 text-red-600'
                    : isEmpty
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-brand-band text-brand-dark'
                }`}
              >
                {slotReservations.length}/{shop.max_capacity}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-line text-xs text-subtle">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-amber-400 rounded" /> Хүлээгдэж буй
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-emerald-500 rounded" /> Баталгаажсан
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-placeholder rounded" /> Дууссан
        </span>
      </div>
    </div>
  );
}
