'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ShopDashboardStats } from '@/lib/types';
import { getMongoliaDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import {
  Calendar,
  TrendingUp,
  XCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DashboardStatsProps {
  shopId: number;
  refreshKey?: number;
  defaultExpanded?: boolean;
  hideToggle?: boolean;
}

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-card p-5 border border-line shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-card flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-ink-strong">
        {value}
        {suffix && <span className="text-lg font-semibold text-subtle ml-0.5">{suffix}</span>}
      </div>
      <div className="text-sm text-subtle mt-1">{label}</div>
    </div>
  );
}

export default function DashboardStats({
  shopId,
  refreshKey = 0,
  defaultExpanded = false,
  hideToggle = false,
}: DashboardStatsProps) {
  const [stats, setStats] = useState<ShopDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(!defaultExpanded);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/shops/${shopId}/stats`);
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [shopId, refreshKey]);

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-card animate-pulse border border-line" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const maxDaily = Math.max(...stats.daily_counts.map((d) => d.count), 1);
  const maxPopular = Math.max(...stats.popular_times.map((t) => t.count), 1);
  const today = getMongoliaDate();
  const monthTotal = Object.values(stats.status_breakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="mb-6">
      {!hideToggle && (
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 mb-4 text-ink hover:text-brand-dark transition-colors group"
        >
          <BarChart3 className="w-5 h-5 text-brand" />
          <h2 className="text-lg font-bold">Статистик самбар</h2>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-placeholder group-hover:text-brand" />
          ) : (
            <ChevronUp className="w-4 h-4 text-placeholder group-hover:text-brand" />
          )}
        </button>
      )}

      {(!collapsed || hideToggle) && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Өнөөдрийн захиалга"
              value={stats.today_count}
              icon={Calendar}
              color="bg-brand"
            />
            <StatCard
              label="7 хоногийн захиалга"
              value={stats.week_count}
              icon={TrendingUp}
              color="bg-linear-to-br from-violet-500 to-purple-500"
            />
            <StatCard
              label="Цуцлалтын хувь (30 хоног)"
              value={stats.cancellation_rate}
              suffix="%"
              icon={XCircle}
              color="bg-linear-to-br from-red-400 to-rose-500"
            />
            <StatCard
              label="Гүйцэтгэлийн хувь (30 хоног)"
              value={stats.completion_rate}
              suffix="%"
              icon={CheckCircle2}
              color="bg-linear-to-br from-emerald-500 to-green-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card variant="elevated" className="p-5!">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand" />
                Сүүлийн 7 хоног
              </h3>
              <div className="flex items-end gap-2 h-32">
                {stats.daily_counts.map((day) => {
                  const height = day.count > 0 ? (day.count / maxDaily) * 100 : 4;
                  const isToday = day.date === today;

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-subtle">{day.count}</span>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-brand'
                            : 'bg-surface'
                        }`}
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '4px' }}
                      />
                      <span className="text-[10px] text-placeholder font-medium">
                        {format(parseISO(day.date), 'M/d')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card variant="elevated" className="p-5!">
              <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                Түгээмэл цаг (30 хоног)
              </h3>
              {stats.popular_times.length === 0 ? (
                <p className="text-sm text-placeholder text-center py-8">Мэдээлэл байхгүй</p>
              ) : (
                <div className="space-y-3">
                  {stats.popular_times.map((slot, index) => (
                    <div key={slot.time} className="flex items-center gap-3">
                      <span className="w-6 text-xs font-bold text-placeholder">#{index + 1}</span>
                      <span className="w-12 text-sm font-bold text-ink">{slot.time}</span>
                      <div className="flex-1 h-6 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(slot.count / maxPopular) * 100}%`, minWidth: '2rem' }}
                        >
                          <span className="text-xs font-bold text-white">{slot.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card variant="elevated" className="p-5!">
            <h3 className="text-sm font-bold text-ink mb-3">
              Төлөвийн хуваарь (30 хоног) — Нийт {monthTotal} захиалга
            </h3>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'pending', label: 'Хүлээгдэж буй', color: 'bg-amber-100 text-amber-700' },
                { key: 'confirmed', label: 'Баталгаажсан', color: 'bg-green-100 text-green-700' },
                { key: 'completed', label: 'Дууссан', color: 'bg-blue-100 text-blue-700' },
                { key: 'cancelled', label: 'Цуцлагдсан', color: 'bg-red-100 text-red-700' },
              ].map(({ key, label, color }) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-4 py-2 rounded-card text-sm font-semibold ${color}`}
                >
                  <span>{label}</span>
                  <span className="font-bold">
                    {stats.status_breakdown[key as keyof typeof stats.status_breakdown]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
