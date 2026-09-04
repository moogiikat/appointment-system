'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Shop } from '@/lib/types';
import { isValidMongoliaPhone } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import { ArrowLeft, MapPin, Clock, Phone, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BookingPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: string })?.role;

  // All useState hooks must be at the top, before any conditional returns
  const [shop, setShop] = useState<Shop | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reservationId, setReservationId] = useState<number | null>(null);

  // Require authentication - redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/book/${shopId}`)}`);
    }
  }, [status, shopId, router]);

  // Shop admin cannot make reservations - redirect to shop-admin
  useEffect(() => {
    if (status === 'authenticated' && userRole === 'shop_admin') {
      router.push('/shop-admin');
    }
  }, [status, userRole, router]);

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
    if (status === 'authenticated') {
      fetchShop();
    }
  }, [shopId, status]);

  // Update customer info from session and profile
  useEffect(() => {
    async function loadCustomerInfo() {
      if (session?.user?.name) setCustomerName(session.user.name);
      if (session?.user?.email) setCustomerEmail(session.user.email);

      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.phone) setCustomerPhone(data.phone);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    if (session?.user) {
      loadCustomerInfo();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDate || !selectedTime) {
      setError('Огноо, цагаа сонгоно уу');
      return;
    }

    if (!customerName.trim()) {
      setError('Нэр оруулна уу');
      return;
    }

    if (!customerPhone.trim()) {
      setError('Утасны дугаар оруулна уу');
      return;
    }

    if (!isValidMongoliaPhone(customerPhone)) {
      setError('Зөв утасны дугаар оруулна уу (8 оронтой, 8 эсвэл 9-өөр эхэлнэ)');
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

  // Show loading while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-line rounded w-1/4" />
            <div className="h-20 bg-line rounded-card" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-line rounded-card" />
                <div className="h-48 bg-line rounded-card" />
              </div>
              <div className="h-64 bg-line rounded-card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card variant="elevated" className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-ink-strong mb-2">
              Захиалга амжилттай!
            </h1>
            <p className="text-subtle mb-6">
              Таны захиалга бүртгэгдлээ. Баярлалаа!
            </p>

            <div className="bg-surface rounded-card p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-subtle">Үйлчилгээний газар:</span>
                  <span className="font-medium text-ink">{shop?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle">Огноо:</span>
                  <span className="font-medium text-ink">
                    {selectedDate && format(selectedDate, 'yyyy-MM-dd')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle">Цаг:</span>
                  <span className="font-medium text-ink">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-subtle">Захиалгын дугаар:</span>
                  <span className="font-medium text-brand-dark">#{reservationId}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/">
                <Button variant="primary" className="w-full">
                  Нүүр хуудас руу буцах
                </Button>
              </Link>
              <Link href="/my-reservations">
                <Button variant="outline" className="w-full">
                  Миний захиалгууд
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href={`/shop/${shopId}`} className="inline-flex items-center gap-2 text-subtle hover:text-brand-dark mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </Link>

        {shop && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-card flex items-center justify-center shadow-lg overflow-hidden">
                {shop.icon ? (
                  <img src={shop.icon} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{shop.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink-strong mb-1">{shop.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-subtle">
                  {shop.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-brand" />
                      {shop.address}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-brand" />
                    {shop.opening_time.slice(0, 5)} - {shop.closing_time.slice(0, 5)}
                  </span>
                  {shop.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-brand" />
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
            {/* 空き状況表：EPARK と同じく日付×時間の一覧から直接選ぶ */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-line rounded-card p-4 md:p-5">
                <h2 className="epark-section-title mb-1">Огноо, цагаа сонгоно уу</h2>
                <p className="text-[12px] text-subtle mb-4">
                  Хүснэгтээс сул цагийг дарж сонгоно уу
                </p>
                <AvailabilityGrid
                  shopId={shopId}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelect={(date, time) => {
                    setSelectedDate(date);
                    setSelectedTime(time);
                  }}
                />
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <Card variant="elevated">
                <h2 className="epark-section-title mb-4">Мэдээлэл оруулах</h2>
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
                    label="Утасны дугаар *"
                    placeholder="99001122"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Нэмэлт тэмдэглэл
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-line rounded-card focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-all duration-200 placeholder:text-placeholder resize-none bg-white"
                      placeholder="Нэмэлт мэдээлэл..."
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-card text-sm animate-fade-in">
                  {error}
                </div>
              )}

              {selectedTime && (
                <div className="bg-brand-band rounded-card p-4 border border-line">
                  <h3 className="text-[13px] font-bold text-ink-strong mb-3">Захиалгын мэдээлэл</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-subtle">Огноо:</span>
                      <span className="font-bold text-ink-strong tabular-nums">{selectedDate && format(selectedDate, 'yyyy-MM-dd')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-subtle">Цаг:</span>
                      <span className="font-semibold text-brand-dark">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-subtle">Үйлчилгээний газар:</span>
                      <span className="font-semibold text-ink-strong truncate ml-2">{shop?.name}</span>
                    </div>
                  </div>
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
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
