'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Reservation } from '@/lib/types';
import { getStatusText, getStatusColor } from '@/lib/utils';
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
            {reservations.map((reservation, index) => {
              const isLocked = !canModify(reservation.status);
              
              return (
                <Card
                  key={reservation.id}
                  variant="elevated"
                  className={`animate-fade-in stagger-${(index % 5) + 1} opacity-0 ${
                    isLocked ? 'bg-slate-50 border border-slate-200' : ''
                  }`}
                >
                  {/* Locked indicator */}
                  {isLocked && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-200">
                      <Lock className="w-3 h-3" />
                      <span>Энэ захиалгыг өөрчлөх боломжгүй</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                          isLocked 
                            ? 'bg-slate-400' 
                            : 'bg-gradient-to-br from-sky-500 to-cyan-500'
                        }`}>
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">
                            {reservation.shop_name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(reservation.status)}`}>
                            {getStatusIcon(reservation.status)}
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

                    {/* Show cancel button for pending and confirmed reservations */}
                    {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
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
                    
                    {/* Show locked state for completed only */}
                    {reservation.status === 'completed' && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Lock className="w-4 h-4" />
                        <span className="hidden sm:inline">Түгжигдсэн</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
