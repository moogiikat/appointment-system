'use client';

import { Reservation } from '@/lib/types';
import { getStatusText, getStatusColor } from '@/lib/utils';
import Button from '@/components/ui/Button';
import {
  Clock,
  User,
  Phone,
  Check,
  X,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PhoneCall,
} from 'lucide-react';

interface ReservationCardProps {
  reservation: Reservation;
  highlighted?: boolean;
  onStatusChange: (id: number, status: string) => void;
}

export default function ReservationCard({
  reservation,
  highlighted,
  onStatusChange,
}: ReservationCardProps) {
  const isLocked = reservation.status === 'completed' || reservation.status === 'cancelled';
  const isPhoneReservation = reservation.notes?.includes('[電話予約]');

  const statusIcon = {
    confirmed: CheckCircle2,
    completed: Lock,
    cancelled: XCircle,
    pending: AlertCircle,
  }[reservation.status] || AlertCircle;

  const StatusIcon = statusIcon;

  const borderColor = {
    pending: 'border-l-amber-400',
    confirmed: 'border-l-emerald-400',
    completed: 'border-l-slate-400',
    cancelled: 'border-l-red-400',
  }[reservation.status] || 'border-l-slate-200';

  return (
    <div
      id={`reservation-${reservation.id}`}
      className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${borderColor} p-4 transition-all hover:shadow-md ${
        highlighted ? 'ring-2 ring-sky-400 shadow-lg' : ''
      } ${isLocked ? 'opacity-75' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Time block */}
        <div className="flex items-center gap-3 sm:w-28 flex-shrink-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isLocked ? 'bg-slate-100' : 'bg-sky-100'
            }`}
          >
            <Clock className={`w-5 h-5 ${isLocked ? 'text-slate-400' : 'text-sky-600'}`} />
          </div>
          <div>
            <div className={`text-xl font-bold ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
              {reservation.reservation_time.slice(0, 5)}
            </div>
            {isPhoneReservation && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                <PhoneCall className="w-3 h-3" /> Утсаар
              </span>
            )}
          </div>
        </div>

        {/* Customer */}
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Үйлчлүүлэгч</p>
              <p className="font-semibold text-slate-800 truncate">{reservation.customer_name}</p>
            </div>
          </div>
          {reservation.customer_phone && (
            <a
              href={`tel:${reservation.customer_phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 min-w-0 group"
            >
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-sky-500" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Утас — дарж залгах</p>
                <p className="font-semibold text-sky-600 truncate group-hover:underline">
                  {reservation.customer_phone}
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Status */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${getStatusColor(reservation.status)}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {getStatusText(reservation.status)}
        </span>

        {/* Actions */}
        <div className="flex gap-2 sm:ml-auto flex-shrink-0">
          {reservation.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStatusChange(reservation.id, 'confirmed')}
                className="gap-1"
                title="Баталгаажуулах"
              >
                <Check className="w-4 h-4" />
                <span className="hidden md:inline">Баталгаажуулах</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onStatusChange(reservation.id, 'cancelled')}
                title="Цуцлах"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          {reservation.status === 'confirmed' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onStatusChange(reservation.id, 'completed')}
                className="gap-1"
                title="Дууссан"
              >
                <Check className="w-4 h-4" />
                <span className="hidden md:inline">Дууссан</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onStatusChange(reservation.id, 'cancelled')}
                title="Цуцлах"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          {isLocked && <Lock className="w-4 h-4 text-slate-300 self-center" />}
        </div>
      </div>

      {reservation.notes && !isPhoneReservation && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-slate-50 rounded-xl text-sm text-slate-600">
          <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <p>{reservation.notes}</p>
        </div>
      )}
    </div>
  );
}
