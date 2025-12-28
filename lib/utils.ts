import { format, parseISO, addMinutes } from 'date-fns';

// Mongolia timezone offset is UTC+8
const MONGOLIA_OFFSET = 8 * 60; // in minutes

export function toMongoliaTime(date: Date): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (MONGOLIA_OFFSET * 60000));
}

export function formatDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'yyyy-MM-dd');
}

export function formatTime(timeString: string): string {
  return timeString.slice(0, 5);
}

export function formatDateTime(dateString: string, timeString: string): string {
  return `${dateString} ${formatTime(timeString)}`;
}

export function generateTimeSlots(
  openingTime: string,
  closingTime: string,
  slotDuration: number
): string[] {
  const slots: string[] = [];
  
  const [openHour, openMin] = openingTime.split(':').map(Number);
  const [closeHour, closeMin] = closingTime.split(':').map(Number);
  
  let currentTime = new Date(2000, 0, 1, openHour, openMin);
  const endTime = new Date(2000, 0, 1, closeHour, closeMin);
  
  while (currentTime < endTime) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, slotDuration);
  }
  
  return slots;
}

export function getMongoliaDate(): string {
  const now = toMongoliaTime(new Date());
  return format(now, 'yyyy-MM-dd');
}

export function getMongoliaDateTime(): Date {
  return toMongoliaTime(new Date());
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Хүлээгдэж буй',
    confirmed: 'Баталгаажсан',
    cancelled: 'Цуцлагдсан',
    completed: 'Дууссан'
  };
  return statusMap[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

