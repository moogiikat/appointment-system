'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Reservation } from '@/lib/types';
import { getStatusText, getStatusColor, formatDate, parseMongoliaDate, getMongoliaStartOfDay } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ReviewModal from '@/components/ReviewModal';
import { Calendar, Clock, Store, Phone, Mail, XCircle, Lock, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import Link from 'next/link';

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [reviewTarget, setReviewTarget] = useState<Reservation | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchReservations() {
      if (!session?.user) return;

      try {
        const userId = (session.user as { id?: number }).id;
        const res = await fetch(`/api/reservations?user_id=${userId}`);
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
  }, [session]);

  const handleCancel = async (id: number) => {
    if (!confirm('Захиалгаа цуцлах уу?')) return;

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (res.ok) {
        setReservations(
          reservations.map((r) =>
            r.id === id ? { ...r, status: 'cancelled' } : r
          )
        );
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
    }
  };

  // Check if reservation can be modified (pending and confirmed can be cancelled)
  const canModify = (status: string) => status === 'pending' || status === 'confirmed';

  // Get status icon
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

  const today = getMongoliaStartOfDay();

  const filteredReservations = reservations.filter((r) => {
    const reservationDate = parseMongoliaDate(r.reservation_date);
    if (filter === 'upcoming') {
      return reservationDate >= today && r.status !== 'cancelled';
    }
    if (filter === 'past') {
      return reservationDate < today || r.status === 'completed' || r.status === 'cancelled';
    }
    return true;
  });

  const upcomingCount = reservations.filter(
    (r) => parseMongoliaDate(r.reservation_date) >= today && r.status !== 'cancelled'
  ).length;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-line rounded w-1/3" />
            <div className="h-32 bg-line rounded-card" />
            <div className="h-32 bg-line rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-strong mb-2 animate-fade-in">
            Миний захиалгууд
          </h1>
          <p className="text-subtle text-lg">
            Таны бүх захиалгын мэдээлэл
            {!loading && upcomingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-band text-brand-dark">
                {upcomingCount} ирэх захиалга
              </span>
            )}
          </p>
        </div>

        {!loading && reservations.length > 0 && (
          <div className="flex gap-2 mb-6">
            {(['upcoming', 'past', 'all'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-card text-sm font-semibold transition-all ${
                  filter === tab
                    ? 'bg-brand text-white shadow-md'
                    : 'bg-white text-subtle border border-line hover:border-line-strong'
                }`}
              >
                {tab === 'upcoming' ? 'Ирэх' : tab === 'past' ? 'Өнгөрсөн' : 'Бүгд'}
              </button>
            ))}
          </div>
        )}

        {reservations.length === 0 ? (
          <Card variant="elevated" className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-brand-band rounded-full mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-brand" />
            </div>
            <h2 className="text-2xl font-semibold text-ink-strong mb-3">
              Захиалга байхгүй байна
            </h2>
            <p className="text-subtle mb-8 text-lg">
              Та одоогоор захиалга хийгээгүй байна
            </p>
            <Link href="/">
              <Button variant="primary" size="lg">
                Захиалга хийх
              </Button>
            </Link>
          </Card>
        ) : filteredReservations.length === 0 ? (
          <Card variant="elevated" className="text-center py-12">
            <Calendar className="w-12 h-12 text-line-strong mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-ink mb-2">
              {filter === 'upcoming' ? 'Ирэх захиалга байхгүй' : 'Захиалга олдсонгүй'}
            </h2>
            <p className="text-subtle mb-6">
              {filter === 'upcoming' ? 'Шинэ захиалга хийж үзнэ үү' : 'Өөр шүүлтүүр сонгоно уу'}
            </p>
            {filter !== 'all' && (
              <Button variant="outline" onClick={() => setFilter('all')}>
                Бүгдийг харах
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredReservations.map((reservation, index) => {
              const isLocked = !canModify(reservation.status);
              
              return (
                <Card
                  key={reservation.id}
                  variant="elevated"
                  className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0 transition-all hover:shadow-2xl ${
                    isLocked ? 'bg-surface/80 border-2 border-line' : 'border-2 border-transparent hover:border-brand-band'
                  }`}
                >
                  {/* Header Section */}
                  <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b-2 border-line">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-card flex items-center justify-center shadow-lg shrink-0 ${
                        isLocked 
                          ? 'bg-line-strong' 
                          : 'bg-brand'
                      }`}>
                        <Store className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-ink-strong mb-2">
                          {reservation.shop_name}
                        </h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${getStatusColor(reservation.status)}`}>
                          {getStatusIcon(reservation.status)}
                          <span>{getStatusText(reservation.status)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="shrink-0">
                      {(reservation.status === 'pending' || reservation.status === 'confirmed') ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(reservation.id)}
                          className="gap-2 whitespace-nowrap"
                        >
                          <XCircle className="w-4 h-4" />
                          Цуцлах
                        </Button>
                      ) : reservation.status === 'completed' && !reservation.has_review ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewTarget(reservation)}
                          className="gap-2 whitespace-nowrap"
                        >
                          <Star className="w-4 h-4" />
                          Сэтгэгдэл үлдээх
                        </Button>
                      ) : reservation.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-placeholder text-sm px-3 py-2 bg-surface rounded-card">
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline font-medium">Түгжигдсэн</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Locked indicator */}
                  {isLocked && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-card mb-4 border border-amber-200">
                      <Lock className="w-4 h-4" />
                      <span>Энэ захиалгыг өөрчлөх боломжгүй</span>
                    </div>
                  )}

                  {/* Main Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Date & Time Section */}
                    <div className="bg-brand-band rounded-card p-5 border border-line">
                      <h4 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4">
                        Огноо ба Цаг
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-card flex items-center justify-center shadow-sm">
                            <Calendar className="w-5 h-5 text-brand-dark" />
                          </div>
                          <div>
                            <div className="text-xs text-subtle mb-0.5">Огноо</div>
                            <div className="text-lg font-bold text-ink-strong">
                              {formatDate(reservation.reservation_date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-card flex items-center justify-center shadow-sm">
                            <Clock className="w-5 h-5 text-brand-dark" />
                          </div>
                          <div>
                            <div className="text-xs text-subtle mb-0.5">Цаг</div>
                            <div className="text-lg font-bold text-ink-strong">
                              {reservation.reservation_time.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    {(reservation.customer_phone || reservation.customer_email) && (
                      <div className="bg-surface rounded-card p-5 border border-line">
                        <h4 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4">
                          Холбоо Барих Мэдээлэл
                        </h4>
                        <div className="space-y-3">
                          {reservation.customer_phone && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-card flex items-center justify-center shadow-sm">
                                <Phone className="w-5 h-5 text-subtle" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-subtle mb-0.5">Утас</div>
                                <div className="text-base font-semibold text-ink-strong truncate">
                                  {reservation.customer_phone}
                                </div>
                              </div>
                            </div>
                          )}
                          {reservation.customer_email && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-card flex items-center justify-center shadow-sm">
                                <Mail className="w-5 h-5 text-subtle" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-subtle mb-0.5">Имэйл</div>
                                <div className="text-base font-semibold text-ink-strong truncate">
                                  {reservation.customer_email}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  {reservation.notes && (
                    <div className="bg-surface rounded-card p-4 border-l-4 border-brand">
                      <div className="text-xs font-semibold text-subtle uppercase tracking-wider mb-2">
                        Тэмдэглэл
                      </div>
                      <p className="text-sm text-ink leading-relaxed">
                        {reservation.notes}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          shopId={reviewTarget.shop_id}
          reservationId={reviewTarget.id}
          shopName={reviewTarget.shop_name || ''}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() =>
            setReservations((prev) =>
              prev.map((r) => (r.id === reviewTarget.id ? { ...r, has_review: true } : r))
            )
          }
        />
      )}
    </div>
  );
}
