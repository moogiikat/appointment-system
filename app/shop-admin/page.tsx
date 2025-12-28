'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { Reservation, Shop } from '@/lib/types';
import { getStatusText, getStatusColor } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Calendar, Clock, User, Phone, Mail, Check, X, FileText, Settings } from 'lucide-react';

export default function ShopAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Shop settings form
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState(30);
  const [maxCapacity, setMaxCapacity] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as { role?: string })?.role;
      if (userRole !== 'shop_admin' && userRole !== 'super_admin') {
        router.push('/');
      }
    }
  }, [status, session, router]);

  // Fetch shop info
  useEffect(() => {
    async function fetchShop() {
      const shopId = (session?.user as { shopId?: number })?.shopId;
      if (!shopId) return;

      try {
        const res = await fetch(`/api/shops/${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
          setShopName(data.name);
          setShopAddress(data.address || '');
          setShopPhone(data.phone || '');
          setOpeningTime(data.opening_time?.slice(0, 5) || '09:00');
          setClosingTime(data.closing_time?.slice(0, 5) || '18:00');
          setSlotDuration(data.slot_duration || 30);
          setMaxCapacity(data.max_capacity || 1);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
      }
    }

    if (session?.user) {
      fetchShop();
    }
  }, [session]);

  // Fetch reservations
  useEffect(() => {
    async function fetchReservations() {
      const shopId = (session?.user as { shopId?: number })?.shopId;
      if (!shopId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/reservations?shop_id=${shopId}&date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setReservations(data);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchReservations();
    }
  }, [session, selectedDate]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setReservations(
          reservations.map((r) =>
            r.id === id ? { ...r, status: newStatus as Reservation['status'] } : r
          )
        );
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopName,
          address: shopAddress,
          phone: shopPhone,
          opening_time: openingTime,
          closing_time: closingTime,
          slot_duration: slotDuration,
          max_capacity: maxCapacity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShop(data);
        setShowSettings(false);
      }
    } catch (error) {
      console.error('Error updating shop:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Generate date options
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i - 7);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MM-dd (EEE)'),
    };
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Дэлгүүрийн удирдлага</h1>
            {shop && <p className="text-slate-600">{shop.name}</p>}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Тохиргоо
          </Button>
        </div>

        {/* Settings Modal */}
        {showSettings && shop && (
          <Card variant="elevated" className="mb-8 animate-fade-in">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Дэлгүүрийн тохиргоо</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="shopName"
                  label="Дэлгүүрийн нэр"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
                <Input
                  id="shopPhone"
                  label="Утас"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                />
                <Input
                  id="shopAddress"
                  label="Хаяг"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="openingTime"
                    label="Нээх цаг"
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                  />
                  <Input
                    id="closingTime"
                    label="Хаах цаг"
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                  />
                </div>
                <Input
                  id="slotDuration"
                  label="Нэг цагийн хугацаа (минут)"
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                />
                <Input
                  id="maxCapacity"
                  label="Нэг цагт авах хүний тоо"
                  type="number"
                  min="1"
                  max="100"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowSettings(false)}>
                  Болих
                </Button>
                <Button type="submit" variant="primary" isLoading={settingsLoading}>
                  Хадгалах
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Date Filter */}
        <Card variant="elevated" className="mb-6 animate-fade-in stagger-1 opacity-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-500" />
              <span className="font-medium text-slate-700">Огноо:</span>
            </div>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none"
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex-1" />
            <div className="text-sm text-slate-500">
              Нийт: <span className="font-bold text-slate-700">{reservations.length}</span> захиалга
            </div>
          </div>
        </Card>

        {/* Reservations List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <Card variant="elevated" className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Энэ өдөр захиалга байхгүй
            </h2>
            <p className="text-slate-500">Өөр огноо сонгоно уу</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation, index) => (
              <Card
                key={reservation.id}
                variant="elevated"
                className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Цаг</div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span className="font-bold text-lg text-slate-800">
                          {reservation.reservation_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Нэр</div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-sky-500" />
                        <span className="font-medium text-slate-700">
                          {reservation.customer_name}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Холбоо барих</div>
                      <div className="space-y-1">
                        {reservation.customer_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-sky-500" />
                            <span className="text-slate-600">{reservation.customer_phone}</span>
                          </div>
                        )}
                        {reservation.customer_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-sky-500" />
                            <span className="text-slate-600 truncate">{reservation.customer_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Төлөв</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </span>
                    </div>
                  </div>

                  {reservation.notes && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-slate-50 rounded-lg lg:max-w-xs">
                      <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                      <p className="text-sm text-slate-600">{reservation.notes}</p>
                    </div>
                  )}

                  {reservation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                        className="gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Баталгаажуулах
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                        className="gap-1"
                      >
                        <X className="w-4 h-4" />
                        Цуцлах
                      </Button>
                    </div>
                  )}

                  {reservation.status === 'confirmed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange(reservation.id, 'completed')}
                      className="gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Дууссан
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

