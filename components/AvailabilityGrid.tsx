'use client';

import { useState, useEffect, useMemo } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimeSlot } from '@/lib/types';
import { getMongoliaStartOfDay } from '@/lib/utils';

const DAY_NAMES: Record<number, string> = {
  0: 'Ням',
  1: 'Дав',
  2: 'Мяг',
  3: 'Лха',
  4: 'Пүр',
  5: 'Баа',
  6: 'Бям',
};

const DAYS = 7;
const MAX_WEEKS_AHEAD = 4;

type Mark = 'open' | 'few' | 'full' | 'none';

interface AvailabilityGridProps {
  shopId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelect: (date: Date, time: string) => void;
}

function markFor(slot: TimeSlot | undefined): Mark {
  if (!slot) return 'none';
  const remaining = slot.max_capacity - slot.current_count;
  if (remaining <= 0) return 'full';
  // 定員が複数ある枠で残り1/3を切ったら「残りわずか」
  if (slot.max_capacity > 1 && remaining / slot.max_capacity <= 0.34) return 'few';
  return 'open';
}

const MARK_LABEL: Record<Mark, string> = {
  open: '○',
  few: '△',
  full: '×',
  none: '－',
};

/*
 * EPARK の時間予約でおなじみの空き状況表。
 * 縦に時間、横に日付を並べ、各セルを ○ / △ / × で示す。
 * 1日ずつ見るより、週全体のどこが空いているかが一目で分かる。
 */
export default function AvailabilityGrid({
  shopId,
  selectedDate,
  selectedTime,
  onSelect,
}: AvailabilityGridProps) {
  const today = useMemo(() => getMongoliaStartOfDay(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  // 取得済みデータに「どの週のものか」を持たせ、loading は状態ではなく導出する
  const [fetched, setFetched] = useState<{ week: string; slots: Record<string, TimeSlot[]> } | null>(null);

  const dates = useMemo(
    () => Array.from({ length: DAYS }, (_, i) => addDays(today, weekOffset * DAYS + i)),
    [today, weekOffset]
  );
  const weekKey = format(dates[0], 'yyyy-MM-dd');
  const loading = fetched?.week !== weekKey;
  const slotsByDate = useMemo(() => fetched?.slots ?? {}, [fetched]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const results = await Promise.all(
        dates.map(async (d) => {
          const key = format(d, 'yyyy-MM-dd');
          try {
            const res = await fetch(`/api/timeslots?shop_id=${shopId}&date=${key}`);
            return [key, res.ok ? ((await res.json()) as TimeSlot[]) : []] as const;
          } catch {
            return [key, [] as TimeSlot[]] as const;
          }
        })
      );
      // 週を切り替えた後に古いレスポンスが届いても捨てる
      if (!cancelled) {
        setFetched({ week: weekKey, slots: Object.fromEntries(results) });
      }
    }

    run();
    // 他の人の予約が入るので定期的に取り直す（表示は保ったまま差し替わる）
    const id = setInterval(run, 30000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [shopId, dates, weekKey]);

  // 当日は過ぎた枠が API から返らないので、週全体の和集合を行にする
  const times = useMemo(() => {
    const all = new Set<string>();
    for (const list of Object.values(slotsByDate)) {
      for (const s of list) all.add(s.time);
    }
    return Array.from(all).sort();
  }, [slotsByDate]);

  const lookup = useMemo(() => {
    const map: Record<string, Record<string, TimeSlot>> = {};
    for (const [key, list] of Object.entries(slotsByDate)) {
      map[key] = Object.fromEntries(list.map((s) => [s.time, s]));
    }
    return map;
  }, [slotsByDate]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-control border border-line-strong text-[13px] text-ink bg-white disabled:text-placeholder disabled:bg-surface hover:opacity-70"
        >
          <ChevronLeft className="w-4 h-4" />
          Өмнөх 7 хоног
        </button>
        <span className="text-[13px] font-bold text-ink-strong tabular-nums">
          {format(dates[0], 'M/d')} – {format(dates[DAYS - 1], 'M/d')}
        </span>
        <button
          type="button"
          onClick={() => setWeekOffset((w) => Math.min(MAX_WEEKS_AHEAD - 1, w + 1))}
          disabled={weekOffset >= MAX_WEEKS_AHEAD - 1}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-control border border-line-strong text-[13px] text-ink bg-white disabled:text-placeholder disabled:bg-surface hover:opacity-70"
        >
          Дараах 7 хоног
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto border border-line rounded-card">
        <table className="w-full border-collapse text-center min-w-[560px]">
          <thead>
            <tr className="bg-brand-band">
              <th className="sticky left-0 z-10 bg-brand-band border-b border-r border-line px-2 py-2 text-[11px] font-bold text-muted w-16">
                Цаг
              </th>
              {dates.map((d) => {
                const dow = d.getDay();
                const isToday = isSameDay(d, today);
                return (
                  <th
                    key={d.toISOString()}
                    className="border-b border-line px-1 py-2 font-normal"
                  >
                    <span
                      className={`block text-[11px] ${
                        dow === 0 ? 'text-red-500' : dow === 6 ? 'text-genre-sekkotsu' : 'text-muted'
                      }`}
                    >
                      {DAY_NAMES[dow]}
                    </span>
                    <span
                      className={`block text-[14px] font-bold tabular-nums ${
                        isToday ? 'text-brand' : 'text-ink-strong'
                      }`}
                    >
                      {format(d, 'M/d')}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="sticky left-0 bg-white border-b border-r border-line px-2 py-2">
                    <div className="h-4 bg-surface rounded animate-pulse" />
                  </td>
                  {dates.map((d) => (
                    <td key={d.toISOString()} className="border-b border-line px-1 py-2">
                      <div className="h-6 bg-surface rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : times.length === 0 ? (
              <tr>
                <td
                  colSpan={DAYS + 1}
                  className="px-4 py-10 text-[13px] text-subtle border-b border-line"
                >
                  Энэ 7 хоногт сул цаг алга байна
                </td>
              </tr>
            ) : (
              times.map((time) => (
                <tr key={time}>
                  <td className="sticky left-0 z-10 bg-white border-b border-r border-line px-2 py-2 text-[13px] font-bold text-ink tabular-nums">
                    {time}
                  </td>
                  {dates.map((d) => {
                    const key = format(d, 'yyyy-MM-dd');
                    const slot = lookup[key]?.[time];
                    const mark = markFor(slot);
                    const selectable = mark === 'open' || mark === 'few';
                    const isSelected =
                      !!selectedDate && isSameDay(d, selectedDate) && selectedTime === time;

                    return (
                      <td key={key} className="border-b border-line p-0">
                        <button
                          type="button"
                          disabled={!selectable}
                          onClick={() => onSelect(d, time)}
                          aria-label={`${format(d, 'M/d')} ${time} ${
                            selectable ? 'сул байна' : 'боломжгүй'
                          }`}
                          aria-pressed={isSelected}
                          className={`w-full h-11 text-[17px] leading-none transition-colors ${
                            isSelected
                              ? 'bg-brand text-white font-bold'
                              : mark === 'open'
                                ? 'text-brand hover:bg-brand-band cursor-pointer'
                                : mark === 'few'
                                  ? 'text-amber-600 hover:bg-amber-50 cursor-pointer'
                                  : 'text-placeholder cursor-default'
                          }`}
                        >
                          {MARK_LABEL[mark]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[12px] text-subtle list-none p-0">
        <li><span className="text-brand font-bold">○</span> Сул байна</li>
        <li><span className="text-amber-600 font-bold">△</span> Цөөн үлдсэн</li>
        <li><span className="text-placeholder font-bold">×</span> Дүүрсэн</li>
        <li><span className="text-placeholder font-bold">－</span> Захиалга авахгүй</li>
      </ul>
    </div>
  );
}
