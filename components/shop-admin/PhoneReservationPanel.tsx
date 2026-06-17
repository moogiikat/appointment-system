'use client';

import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { TimeSlot } from '@/lib/types';
import { getMongoliaDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PhoneCall, Calendar, Clock, User, FileText, Plus } from 'lucide-react';

interface PhoneReservationPanelProps {
  shopId: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onCreated?: () => void;
}

export default function PhoneReservationPanel({
  shopId,
  onSuccess,
  onError,
  onCreated,
}: PhoneReservationPanelProps) {
  const today = getMongoliaDate();
  const [manualDate, setManualDate] = useState(today);
  const [manualTime, setManualTime] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  const futureDateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(parseISO(today), i);
    return { value: format(date, 'yyyy-MM-dd'), label: format(date, 'yyyy-MM-dd (EEE)') };
  });

  useEffect(() => {
    setSlotsLoading(true);
    fetch(`/api/timeslots?shop_id=${shopId}&date=${manualDate}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAvailableSlots)
      .catch(console.error)
      .finally(() => setSlotsLoading(false));
  }, [shopId, manualDate]);

  const availableCount = availableSlots.filter((s) => s.available).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTime || !manualName.trim()) return;
    setLoading(true);
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
          notes: manualNotes ? `[Утсаар] ${manualNotes}` : '[Утсаар]',
          status: 'confirmed',
        }),
      });
      if (res.ok) {
        setManualTime('');
        setManualName('');
        setManualPhone('');
        setManualNotes('');
        onSuccess('Захиалга амжилттай бүртгэгдлээ!');
        onCreated?.();
      } else {
        const err = await res.json();
        onError(err.error || 'Алдаа гарлаа');
      }
    } catch {
      onError('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5 pb-6">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
          <PhoneCall className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Утсаар захиалга бүртгэх</h2>
          <p className="text-sm text-slate-500">Үйлчлүүлэгчийн мэдээллийг оруулна уу</p>
        </div>
      </div>

      <Card variant="elevated" className="p-5!">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-500" />
          Огноо ба цаг
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Огноо</label>
            <select
              value={manualDate}
              onChange={(e) => {
                setManualDate(e.target.value);
                setManualTime('');
              }}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white text-base"
            >
              {futureDateOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex text-sm font-medium text-slate-700 mb-1.5 items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Цаг
              </span>
              {!slotsLoading && (
                <span className="text-xs text-emerald-600 font-semibold">{availableCount} сул цаг</span>
              )}
            </label>
            {slotsLoading ? (
              <div className="px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-sm animate-pulse">
                Уншиж байна...
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="px-4 py-3 border-2 border-amber-200 rounded-xl bg-amber-50 text-amber-700 text-sm">
                Энэ өдөр боломжит цаг байхгүй
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setManualTime(slot.time)}
                    className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
                      manualTime === slot.time
                        ? 'bg-sky-500 text-white shadow-md scale-105'
                        : slot.available
                        ? 'bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-400'
                        : 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="p-5!">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-sky-500" />
          Үйлчлүүлэгчийн мэдээлэл
        </h3>
        <div className="space-y-4">
          <Input
            id="phoneName"
            label="Нэр *"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Үйлчлүүлэгчийн нэр"
            required
          />
          <Input
            id="phoneNumber"
            label="Утасны дугаар"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            placeholder="99001122"
            type="tel"
          />
          <div>
            <label className="flex text-sm font-medium text-slate-700 mb-1.5 items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              Тэмдэглэл
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none resize-none text-base"
              rows={3}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Нэмэлт мэдээлэл..."
            />
          </div>
        </div>
      </Card>

      {manualTime && manualName.trim() && (
        <Card variant="bordered" className="p-4! bg-sky-50 border-sky-200">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">Баталгаажуулах</p>
          <p className="text-sm text-slate-700">
            <span className="font-bold">{manualName}</span> — {manualDate} {manualTime}
            {manualPhone && <span className="text-slate-500"> · {manualPhone}</span>}
          </p>
        </Card>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full gap-2"
        isLoading={loading}
        disabled={!manualTime || !manualName.trim()}
      >
        <Plus className="w-5 h-5" />
        Захиалга бүртгэх
      </Button>
    </form>
  );
}
