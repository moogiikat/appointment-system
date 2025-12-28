'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Reservation } from '@/lib/types';
import { getStatusText, getStatusColor } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Clock, Store, Phone, Mail, XCircle } from 'lucide-react';
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
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 animate-fade-in">
          Миний захиалгууд
        </h1>

        {reservations.length === 0 ? (
          <Card variant="elevated" className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Захиалга байхгүй байна
            </h2>
            <p className="text-slate-500 mb-6">
              Та одоогоор захиалга хийгээгүй байна
            </p>
            <Link href="/">
              <Button variant="primary">Захиалга хийх</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation, index) => (
              <Card
                key={reservation.id}
                variant="elevated"
                className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {reservation.shop_name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-sky-500" />
                        <span>{reservation.reservation_date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <span>{reservation.reservation_time.slice(0, 5)}</span>
                      </div>
                      {reservation.customer_phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4 text-sky-500" />
                          <span>{reservation.customer_phone}</span>
                        </div>
                      )}
                      {reservation.customer_email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4 text-sky-500" />
                          <span className="truncate">{reservation.customer_email}</span>
                        </div>
                      )}
                    </div>

                    {reservation.notes && (
                      <p className="text-sm text-slate-500 mt-2 italic">
                        {reservation.notes}
                      </p>
                    )}
                  </div>

                  {reservation.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleCancel(reservation.id)}
                      className="gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Цуцлах
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

