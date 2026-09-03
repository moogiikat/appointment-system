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
  const isPhoneReservation = reservation.notes?.includes('[Утсаар]');

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
    completed: 'border-l-placeholder',
    cancelled: 'border-l-red-400',
  }[reservation.status] || 'border-l-line';

  return (
    <div
      id={`reservation-${reservation.id}`}
      className={`bg-white rounded-card border border-line border-l-4 ${borderColor} p-4 transition-all hover:shadow-md ${
        highlighted ? 'ring-2 ring-brand shadow-lg' : ''
      } ${isLocked ? 'opacity-75' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Time block */}
        <div className="flex items-center gap-3 sm:w-28 shrink-0">
          <div
            className={`w-11 h-11 rounded-card flex items-center justify-center ${
              isLocked ? 'bg-surface' : 'bg-brand-band'
            }`}
          >
            <Clock className={`w-5 h-5 ${isLocked ? 'text-placeholder' : 'text-brand-dark'}`} />
          </div>
          <div>
            <div className={`text-xl font-bold ${isLocked ? 'text-placeholder' : 'text-ink-strong'}`}>
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
            <User className="w-4 h-4 text-placeholder shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-placeholder">Үйлчлүүлэгч</p>
              <p className="font-semibold text-ink-strong truncate">{reservation.customer_name}</p>
            </div>
          </div>
          {reservation.customer_phone && (
            <a
              href={`tel:${reservation.customer_phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 min-w-0 group"
            >
              <Phone className="w-4 h-4 text-placeholder shrink-0 group-hover:text-brand" />
              <div className="min-w-0">
                <p className="text-xs text-placeholder">Утас — дарж залгах</p>
                <p className="font-semibold text-brand-dark truncate group-hover:underline">
                  {reservation.customer_phone}
                </p>
              </div>
            </a>
          )}
        </div>

        {/* Status */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${getStatusColor(reservation.status)}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {getStatusText(reservation.status)}
        </span>

        {/* Actions */}
        <div className="flex gap-2 sm:ml-auto shrink-0">
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
          {isLocked && <Lock className="w-4 h-4 text-line-strong self-center" />}
        </div>
      </div>

      {reservation.notes && !isPhoneReservation && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-surface rounded-card text-sm text-subtle">
          <FileText className="w-4 h-4 text-placeholder mt-0.5 shrink-0" />
          <p>{reservation.notes}</p>
        </div>
      )}
    </div>
  );
}
