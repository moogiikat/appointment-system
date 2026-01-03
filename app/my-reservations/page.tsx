'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Reservation } from '@/lib/types';
import { getStatusText, getStatusColor, formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Clock, Store, Phone, Mail, XCircle, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 animate-fade-in">
            Миний захиалгууд
          </h1>
          <p className="text-slate-600 text-lg">
            Таны бүх захиалгын мэдээлэл
          </p>
        </div>

        {reservations.length === 0 ? (
          <Card variant="elevated" className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-sky-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-3">
              Захиалга байхгүй байна
            </h2>
            <p className="text-slate-600 mb-8 text-lg">
              Та одоогоор захиалга хийгээгүй байна
            </p>
            <Link href="/">
              <Button variant="primary" size="lg">
                Захиалга хийх
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation, index) => {
              const isLocked = !canModify(reservation.status);
              
              return (
                <Card
                  key={reservation.id}
                  variant="elevated"
                  className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0 transition-all hover:shadow-2xl ${
                    isLocked ? 'bg-slate-50/80 border-2 border-slate-200' : 'border-2 border-transparent hover:border-sky-100'
                  }`}
                >
                  {/* Header Section */}
                  <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b-2 border-slate-100">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                        isLocked 
                          ? 'bg-slate-300' 
                          : 'bg-gradient-to-br from-sky-500 to-cyan-500'
                      }`}>
                        <Store className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {reservation.shop_name}
                        </h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${getStatusColor(reservation.status)}`}>
                          {getStatusIcon(reservation.status)}
                          <span>{getStatusText(reservation.status)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex-shrink-0">
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
                      ) : reservation.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm px-3 py-2 bg-slate-100 rounded-xl">
                          <Lock className="w-4 h-4" />
                          <span className="hidden sm:inline font-medium">Түгжигдсэн</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Locked indicator */}
                  {isLocked && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-xl mb-4 border border-amber-200">
                      <Lock className="w-4 h-4" />
                      <span>Энэ захиалгыг өөрчлөх боломжгүй</span>
                    </div>
                  )}

                  {/* Main Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Date & Time Section */}
                    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-5 border border-sky-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Огноо ба Цаг
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Calendar className="w-5 h-5 text-sky-600" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-0.5">Огноо</div>
                            <div className="text-lg font-bold text-slate-900">
                              {formatDate(reservation.reservation_date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Clock className="w-5 h-5 text-sky-600" />
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-0.5">Цаг</div>
                            <div className="text-lg font-bold text-slate-900">
                              {reservation.reservation_time.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    {(reservation.customer_phone || reservation.customer_email) && (
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          Холбоо Барих Мэдээлэл
                        </h4>
                        <div className="space-y-3">
                          {reservation.customer_phone && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Phone className="w-5 h-5 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-slate-500 mb-0.5">Утас</div>
                                <div className="text-base font-semibold text-slate-900 truncate">
                                  {reservation.customer_phone}
                                </div>
                              </div>
                            </div>
                          )}
                          {reservation.customer_email && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Mail className="w-5 h-5 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-slate-500 mb-0.5">Имэйл</div>
                                <div className="text-base font-semibold text-slate-900 truncate">
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
                    <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-sky-400">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Тэмдэглэл
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
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
    </div>
  );
}
