'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Shop, TimeSlot } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/DatePicker';
import TimeSlotPicker from '@/components/TimeSlotPicker';
import { ArrowLeft, MapPin, Clock, Phone, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BookingPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(session?.user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(session?.user?.email || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<number | null>(null);

  // Fetch shop info
  useEffect(() => {
    async function fetchShop() {
      try {
        const res = await fetch(`/api/shops/${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data);
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
      }
    }
    fetchShop();
  }, [shopId]);

  // Fetch time slots when date changes
  useEffect(() => {
    async function fetchTimeSlots() {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/timeslots?shop_id=${shopId}&date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          setTimeSlots(data);
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
      } finally {
        setLoading(false);
      }
    }
    if (shopId) {
      fetchTimeSlots();
      setSelectedTime(null);
    }
  }, [shopId, selectedDate]);

  // Update customer info from session
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setCustomerName(session.user.name);
      if (session.user.email) setCustomerEmail(session.user.email);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTime) {
      setError('Цаг сонгоно уу');
      return;
    }

    if (!customerName.trim()) {
      setError('Нэр оруулна уу');
      return;
    }

    if (!customerPhone.trim() && !customerEmail.trim()) {
      setError('Утас эсвэл и-мэйл оруулна уу');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shopId,
          user_id: (session?.user as { id?: number })?.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          reservation_date: format(selectedDate, 'yyyy-MM-dd'),
          reservation_time: selectedTime,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReservationId(data.id);
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Захиалга хийхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      setError('Захиалга хийхэд алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card variant="elevated" className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Захиалга амжилттай!
            </h1>
            <p className="text-slate-600 mb-6">
              Таны захиалга бүртгэгдлээ. Баярлалаа!
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Дэлгүүр:</span>
                  <span className="font-medium text-slate-700">{shop?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Огноо:</span>
                  <span className="font-medium text-slate-700">
                    {format(selectedDate, 'yyyy-MM-dd')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Цаг:</span>
                  <span className="font-medium text-slate-700">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Захиалгын дугаар:</span>
                  <span className="font-medium text-sky-600">#{reservationId}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/">
                <Button variant="primary" className="w-full">
                  Нүүр хуудас руу буцах
                </Button>
              </Link>
              {session && (
                <Link href="/my-reservations">
                  <Button variant="outline" className="w-full">
                    Миний захиалгууд
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </Link>

        {shop && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/25">
                <span className="text-2xl font-bold text-white">{shop.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-1">{shop.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {shop.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-sky-500" />
                      {shop.address}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-sky-500" />
                    {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                  </span>
                  {shop.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-sky-500" />
                      {shop.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date & Time Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card variant="elevated" className="animate-fade-in stagger-1 opacity-0">
                <h2 className="text-lg font-bold text-slate-800 mb-4">1. Огноо сонгох</h2>
                <DatePicker
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </Card>

              <Card variant="elevated" className="animate-fade-in stagger-2 opacity-0">
                <h2 className="text-lg font-bold text-slate-800 mb-4">2. Цаг сонгох</h2>
                {loading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <TimeSlotPicker
                    timeSlots={timeSlots}
                    selectedTime={selectedTime}
                    onSelectTime={setSelectedTime}
                  />
                )}
              </Card>
            </div>

            {/* Customer Info */}
            <div className="space-y-6">
              <Card variant="elevated" className="animate-fade-in stagger-3 opacity-0">
                <h2 className="text-lg font-bold text-slate-800 mb-4">3. Мэдээлэл оруулах</h2>
                <div className="space-y-4">
                  <Input
                    id="name"
                    label="Нэр *"
                    placeholder="Таны нэр"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                  <Input
                    id="phone"
                    label="Утасны дугаар"
                    placeholder="99001122"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                  <Input
                    id="email"
                    label="И-мэйл"
                    placeholder="example@mail.com"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Нэмэлт тэмдэглэл
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all duration-200 placeholder:text-slate-400 resize-none bg-white"
                      placeholder="Нэмэлт мэдээлэл..."
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={submitting}
                disabled={!selectedTime || submitting}
              >
                Захиалга баталгаажуулах
              </Button>

              {!session && (
                <p className="text-xs text-slate-500 text-center">
                  <Link href="/auth/signin" className="text-sky-600 hover:underline">
                    Facebook-ээр нэвтэрч
                  </Link>
                  {' '}захиалгаа хялбар удирдаарай
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

