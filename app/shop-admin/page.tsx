'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Reservation, Shop } from '@/lib/types';
import { getMongoliaDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import DayTimeline from '@/components/DayTimeline';
import DashboardStats from '@/components/DashboardStats';
import { ToastContainer, useToast } from '@/components/Toast';
import WeekDateStrip from '@/components/shop-admin/WeekDateStrip';
import ReservationCard from '@/components/shop-admin/ReservationCard';
import ShopSettingsPanel from '@/components/shop-admin/ShopSettingsPanel';
import PhoneReservationPanel from '@/components/shop-admin/PhoneReservationPanel';
import ServicesPanel from '@/components/shop-admin/ServicesPanel';
import ReviewsPanel from '@/components/shop-admin/ReviewsPanel';
import CouponsPanel from '@/components/shop-admin/CouponsPanel';
import {
  Calendar,
  Settings,
  Plus,
  PhoneCall,
  Store,
  AlertCircle,
  CheckCircle2,
  Users,
  BarChart3,
  LayoutList,
  Search,
  CheckCheck,
  Clock,
  Tag,
  MessageCircle,
  Ticket,
} from 'lucide-react';

type Tab = 'schedule' | 'phone' | 'stats' | 'services' | 'reviews' | 'coupons' | 'settings';
type StatusFilter = 'all' | Reservation['status'];

export default function ShopAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useToast();

  const [shop, setShop] = useState<Shop | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(getMongoliaDate());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [bulkConfirming, setBulkConfirming] = useState(false);

  const shopId = (session?.user as { shopId?: number })?.shopId;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    else if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role !== 'shop_admin' && role !== 'super_admin') router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!shopId) return;
    fetch(`/api/shops/${shopId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setShop(data);
      })
      .catch(console.error);
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    fetch(`/api/reservations?shop_id=${shopId}&date=${selectedDate}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [shopId, selectedDate]);

  const refreshReservations = async () => {
    if (!shopId) return;
    const res = await fetch(`/api/reservations?shop_id=${shopId}&date=${selectedDate}`);
    if (res.ok) setReservations(await res.json());
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus as Reservation['status'] } : r))
      );
      setStatsRefreshKey((k) => k + 1);
      showToast('Статус амжилттай шинэчлэгдлээ', 'success');
    } else {
      showToast('Статус шинэчлэхэд алдаа гарлаа', 'error');
    }
  };

  const handleConfirmAllPending = async () => {
    const pending = reservations.filter((r) => r.status === 'pending');
    if (pending.length === 0) return;
    setBulkConfirming(true);
    try {
      await Promise.all(
        pending.map((r) =>
          fetch(`/api/reservations/${r.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' }),
          })
        )
      );
      await refreshReservations();
      setStatsRefreshKey((k) => k + 1);
      showToast(`${pending.length} захиалга баталгаажлаа`, 'success');
    } catch {
      showToast('Алдаа гарлаа', 'error');
    } finally {
      setBulkConfirming(false);
    }
  };

  const scrollToReservation = (id: number) => {
    setHighlightedId(id);
    document.getElementById(`reservation-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightedId(null), 2000);
  };

  const filteredReservations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reservations
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) =>
        !q ||
        r.customer_name.toLowerCase().includes(q) ||
        r.customer_phone?.includes(q)
      )
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));
  }, [reservations, statusFilter, searchQuery]);

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const confirmedCount = reservations.filter((r) => r.status === 'confirmed').length;
  const today = getMongoliaDate();
  const isToday = selectedDate === today;

  const statusTabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Бүгд', count: reservations.length },
    { key: 'pending', label: 'Хүлээгдэж буй', count: pendingCount },
    { key: 'confirmed', label: 'Баталгаажсан', count: confirmedCount },
    { key: 'completed', label: 'Дууссан' },
    { key: 'cancelled', label: 'Цуцлагдсан' },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-pulse text-placeholder">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky header */}
      <div className="sticky top-16 z-40 bg-white border-b border-line shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand rounded-card flex items-center justify-center shadow-lg shrink-0">
                {shop?.icon ? (
                  <img src={shop.icon} alt="" className="w-full h-full object-cover rounded-card" />
                ) : (
                  <Store className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-ink-strong leading-tight">
                  {shop?.name || 'Үйлчилгээний газар'}
                </h1>
                {shop && (
                  <p className="text-xs text-subtle flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {shop.opening_time.slice(0, 5)} – {shop.closing_time.slice(0, 5)}
                    · {shop.slot_duration} мин/цаг
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-surface rounded-card p-1 overflow-x-auto max-w-full">
                {([
                  { key: 'schedule' as Tab, label: 'Хуваарь', icon: LayoutList },
                  { key: 'phone' as Tab, label: 'Утсаар', icon: PhoneCall },
                  { key: 'stats' as Tab, label: 'Статистик', icon: BarChart3 },
                  { key: 'services' as Tab, label: 'Үйлчилгээ', icon: Tag },
                  { key: 'reviews' as Tab, label: 'Сэтгэгдэл', icon: MessageCircle },
                  { key: 'coupons' as Tab, label: 'Купон', icon: Ticket },
                  { key: 'settings' as Tab, label: 'Тохиргоо', icon: Settings },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-control text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                      activeTab === key
                        ? 'bg-white text-brand-dark shadow-sm'
                        : 'text-subtle hover:text-ink'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'phone' && shopId && (
          <PhoneReservationPanel
            shopId={shopId}
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
            onCreated={() => {
              refreshReservations();
              setStatsRefreshKey((k) => k + 1);
            }}
          />
        )}

        {activeTab === 'stats' && shop && (
          <DashboardStats shopId={shop.id} refreshKey={statsRefreshKey} defaultExpanded hideToggle />
        )}

        {activeTab === 'services' && shop && (
          <ServicesPanel
            shopId={shop.id}
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}

        {activeTab === 'reviews' && shop && (
          <ReviewsPanel
            shopId={shop.id}
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}

        {activeTab === 'coupons' && shop && (
          <CouponsPanel
            shopId={shop.id}
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}

        {activeTab === 'settings' && shop && (
          <ShopSettingsPanel
            shop={shop}
            onSaved={(updated) => setShop(updated)}
            onSuccess={(msg) => showToast(msg, 'success')}
            onError={(msg) => showToast(msg, 'error')}
          />
        )}

        {activeTab === 'schedule' && (
          <>
            {/* Pending alert */}
            {pendingCount > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-card">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-semibold text-sm">
                    {pendingCount} захиалга баталгаажуулахыг хүлээж байна
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAllPending}
                  isLoading={bulkConfirming}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 border-amber-500"
                >
                  <CheckCheck className="w-4 h-4" />
                  Бүгдийг баталгаажуулах
                </Button>
              </div>
            )}

            {/* Date strip + today stats */}
            <div className="bg-white rounded-card border border-line p-4 mb-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand" />
                  <span className="font-bold text-ink-strong">
                    {format(parseISO(selectedDate), 'yyyy.MM.dd')}
                  </span>
                  {!isToday && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(today)}
                      className="text-xs font-semibold text-brand-dark bg-brand-band px-2 py-1 rounded-control hover:bg-brand-band"
                    >
                      Өнөөдөр
                    </button>
                  )}
                  {isToday && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-control">
                      Өнөөдөр
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-semibold bg-amber-50 text-amber-700">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pendingCount} хүлээгдэж
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-semibold bg-green-50 text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {confirmedCount} баталгаажсан
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-semibold bg-surface text-ink">
                    <Users className="w-3.5 h-3.5" />
                    {reservations.length} нийт
                  </span>
                </div>
              </div>
              <WeekDateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </div>

            {/* Split layout: timeline + list */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              {/* Timeline - sticky on desktop */}
              {shop && (
                <div className="xl:col-span-2 xl:sticky xl:top-44 xl:self-start">
                  <DayTimeline
                    shop={shop}
                    reservations={reservations}
                    selectedDate={selectedDate}
                    onReservationClick={scrollToReservation}
                  />
                </div>
              )}

              {/* Reservation list */}
              <div className="xl:col-span-3 space-y-3">
                {/* Search + filter */}
                <div className="bg-white rounded-card border border-line p-3 shadow-sm space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-placeholder" />
                    <input
                      type="text"
                      placeholder="Нэр эсвэл утсаар хайх..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-line rounded-card text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-band"
                    />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {statusTabs.map(({ key, label, count }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatusFilter(key)}
                        className={`shrink-0 px-3 py-1.5 rounded-control text-xs font-semibold transition-all ${
                          statusFilter === key
                            ? 'bg-brand text-white shadow-sm'
                            : 'bg-surface text-subtle hover:bg-line'
                        }`}
                      >
                        {label}
                        {count !== undefined && count > 0 && (
                          <span className={`ml-1 ${statusFilter === key ? 'text-brand-band' : 'text-placeholder'}`}>
                            ({count})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-white rounded-card animate-pulse border border-line" />
                    ))}
                  </div>
                ) : filteredReservations.length === 0 ? (
                  <div className="bg-white rounded-card border border-line p-10 text-center">
                    <Calendar className="w-12 h-12 text-line-strong mx-auto mb-3" />
                    <h3 className="font-semibold text-ink mb-1">
                      {reservations.length === 0 ? 'Энэ өдөр захиалга байхгүй' : 'Үр дүн олдсонгүй'}
                    </h3>
                    <p className="text-sm text-subtle mb-4">
                      {reservations.length === 0 ? 'Шинэ захиалга нэмнэ үү' : 'Шүүлтүүр эсвэл хайлт өөрчилнө үү'}
                    </p>
                    {reservations.length === 0 && (
                      <Button variant="primary" size="sm" onClick={() => setActiveTab('phone')} className="gap-1.5">
                        <Plus className="w-4 h-4" /> Захиалга нэмэх
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredReservations.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      highlighted={highlightedId === r.id}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
