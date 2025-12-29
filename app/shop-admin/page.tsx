'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { Reservation, Shop, TimeSlot } from '@/lib/types';
import { getStatusText, getStatusColor } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Check, 
  X, 
  FileText, 
  Settings, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  PhoneCall,
  Store,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';

export default function ShopAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Manual reservation state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualTime, setManualTime] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Shop settings form
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
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
          setShopDescription(data.description || '');
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

  // Fetch available time slots for manual reservation
  useEffect(() => {
    async function fetchSlots() {
      const shopId = (session?.user as { shopId?: number })?.shopId;
      if (!shopId || !showManualForm) return;

      setSlotsLoading(true);
      try {
        const res = await fetch(`/api/timeslots?shop_id=${shopId}&date=${manualDate}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data);
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
  }, [session, manualDate, showManualForm]);

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
          description: shopDescription,
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

  const handleManualReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    const shopId = (session?.user as { shopId?: number })?.shopId;
    if (!shopId || !manualTime || !manualName.trim()) return;

    setManualLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shopId,
          customer_name: manualName,
          customer_phone: manualPhone,
          reservation_date: manualDate,
          reservation_time: manualTime,
          notes: manualNotes ? `[電話予約] ${manualNotes}` : '[電話予約]',
          status: 'confirmed',
        }),
      });

      if (res.ok) {
        setManualTime('');
        setManualName('');
        setManualPhone('');
        setManualNotes('');
        setShowManualForm(false);
        
        if (manualDate === selectedDate) {
          const shopId = (session?.user as { shopId?: number })?.shopId;
          const refreshRes = await fetch(`/api/reservations?shop_id=${shopId}&date=${selectedDate}`);
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setReservations(data);
          }
        }
        
        alert('Захиалга амжилттай бүртгэгдлээ!');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Захиалга бүртгэхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error creating manual reservation:', error);
      alert('Захиалга бүртгэхэд алдаа гарлаа');
    } finally {
      setManualLoading(false);
    }
  };

  // Navigate date
  const goToPreviousDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(format(current, 'yyyy-MM-dd'));
  };

  const goToNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(format(current, 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  // Generate future date options for manual reservation
  const futureDateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'yyyy-MM-dd (EEE)'),
    };
  });

  // Stats
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const completedCount = reservations.filter(r => r.status === 'completed').length;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/25">
                <Store className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {shop?.name || 'Дэлгүүрийн удирдлага'}
                </h1>
                <p className="text-slate-500 text-sm">Захиалгын менежмент</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => setShowManualForm(!showManualForm)}
                className="gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span className="hidden sm:inline">Утсаар захиалга</span>
                <span className="sm:hidden">Нэмэх</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Тохиргоо</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Manual Reservation Form */}
        {showManualForm && (
          <Card variant="elevated" className="mb-6 border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sky-200">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Утсаар захиалга бүртгэх</h2>
                <p className="text-sm text-slate-500">Үйлчлүүлэгчийн мэдээллийг оруулна уу</p>
              </div>
            </div>
            <form onSubmit={handleManualReservation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    📅 Огноо
                  </label>
                  <select
                    value={manualDate}
                    onChange={(e) => {
                      setManualDate(e.target.value);
                      setManualTime('');
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white font-medium"
                  >
                    {futureDateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    🕐 Цаг
                  </label>
                  {slotsLoading ? (
                    <div className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-100 text-slate-500">
                      Уншиж байна...
                    </div>
                  ) : (
                    <select
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white font-medium"
                      required
                    >
                      <option value="">Цаг сонгох</option>
                      {availableSlots.map((slot) => (
                        <option 
                          key={slot.time} 
                          value={slot.time}
                          disabled={!slot.available}
                        >
                          {slot.time} {!slot.available ? '❌ дүүрсэн' : `✓ ${slot.max_capacity - slot.current_count} сул`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <Input
                  id="manualName"
                  label="👤 Нэр"
                  placeholder="Үйлчлүүлэгчийн нэр"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  required
                />

                <Input
                  id="manualPhone"
                  label="📞 Утас"
                  placeholder="99001122"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  📝 Тэмдэглэл
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white resize-none"
                  placeholder="Нэмэлт мэдээлэл..."
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setShowManualForm(false);
                    setManualTime('');
                    setManualName('');
                    setManualPhone('');
                    setManualNotes('');
                  }}
                >
                  Болих
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  isLoading={manualLoading}
                  disabled={!manualTime || !manualName.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Бүртгэх
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Settings Modal */}
        {showSettings && shop && (
          <Card variant="elevated" className="mb-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Дэлгүүрийн тохиргоо</h2>
                <p className="text-sm text-slate-500">Үндсэн мэдээлэл засах</p>
              </div>
            </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Дэлгүүрийн тодорхойлолт
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white resize-none"
                  placeholder="Дэлгүүрийн тухай мэдээлэл..."
                  rows={4}
                  value={shopDescription}
                  onChange={(e) => setShopDescription(e.target.value)}
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

        {/* Date Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousDay}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl text-white">
                <Calendar className="w-5 h-5" />
                <span className="font-bold text-lg">
                  {format(new Date(selectedDate), 'yyyy.MM.dd')}
                </span>
                <span className="text-sky-100 text-sm">
                  ({format(new Date(selectedDate), 'EEEE')})
                </span>
              </div>
              
              <button
                type="button"
                onClick={goToNextDay}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
              
              <button
                type="button"
                onClick={goToToday}
                className="ml-2 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
              >
                Өнөөдөр
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">{pendingCount}</span>
                <span className="text-sm hidden sm:inline">хүлээгдэж буй</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">{confirmedCount}</span>
                <span className="text-sm hidden sm:inline">баталгаажсан</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{reservations.length}</span>
                <span className="text-sm hidden sm:inline">нийт</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Энэ өдөр захиалга байхгүй
            </h2>
            <p className="text-slate-500 mb-6">Өөр огноо сонгох эсвэл шинэ захиалга нэмэх</p>
            <Button
              variant="primary"
              onClick={() => setShowManualForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Захиалга нэмэх
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation) => {
              const isLocked = reservation.status === 'completed' || reservation.status === 'cancelled';
              const isPhoneReservation = reservation.notes?.includes('[電話予約]');
              
              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'confirmed':
                    return <CheckCircle2 className="w-4 h-4" />;
                  case 'completed':
                    return <Lock className="w-4 h-4" />;
                  case 'cancelled':
                    return <XCircle className="w-4 h-4" />;
                  default:
                    return <AlertCircle className="w-4 h-4" />;
                }
              };

              const getStatusBgColor = (status: string) => {
                switch (status) {
                  case 'pending':
                    return 'border-l-amber-400 bg-amber-50/30';
                  case 'confirmed':
                    return 'border-l-green-400 bg-green-50/30';
                  case 'completed':
                    return 'border-l-slate-400 bg-slate-50';
                  case 'cancelled':
                    return 'border-l-red-400 bg-red-50/30';
                  default:
                    return '';
                }
              };
              
              return (
                <div
                  key={reservation.id}
                  className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 border-l-4 transition-all hover:shadow-md ${getStatusBgColor(reservation.status)}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Time */}
                    <div className="flex items-center gap-4 lg:w-32">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isLocked ? 'bg-slate-200' : 'bg-sky-100'
                      }`}>
                        <Clock className={`w-6 h-6 ${isLocked ? 'text-slate-500' : 'text-sky-600'}`} />
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                          {reservation.reservation_time.slice(0, 5)}
                        </div>
                        {isPhoneReservation && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <PhoneCall className="w-3 h-3" />
                            <span>Утсаар</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isLocked ? 'bg-slate-200' : 'bg-sky-100'
                        }`}>
                          <User className={`w-5 h-5 ${isLocked ? 'text-slate-500' : 'text-sky-600'}`} />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Үйлчлүүлэгч</div>
                          <div className={`font-semibold ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                            {reservation.customer_name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isLocked ? 'bg-slate-200' : 'bg-sky-100'
                        }`}>
                          <Phone className={`w-5 h-5 ${isLocked ? 'text-slate-500' : 'text-sky-600'}`} />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Утас</div>
                          <div className={`font-semibold ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                            {reservation.customer_phone || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(reservation.status)}`}>
                          {getStatusIcon(reservation.status)}
                          {getStatusText(reservation.status)}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {reservation.notes && !isPhoneReservation && (
                      <div className="flex items-start gap-2 px-3 py-2 bg-slate-100 rounded-xl lg:max-w-xs">
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600 line-clamp-2">{reservation.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 lg:ml-auto">
                      {reservation.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                            className="gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Баталгаажуулах</span>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                            className="gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span className="hidden sm:inline">Цуцлах</span>
                          </Button>
                        </>
                      )}

                      {reservation.status === 'confirmed' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'completed')}
                            className="gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span className="hidden sm:inline">Дууссан</span>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                            className="gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span className="hidden sm:inline">Цуцлах</span>
                          </Button>
                        </>
                      )}
                      
                      {isLocked && (
                        <div className="flex items-center gap-2 text-slate-400 px-3">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm hidden sm:inline">Түгжигдсэн</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
