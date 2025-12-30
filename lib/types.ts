export interface User {
  id: number;
  facebook_id?: string;
  google_id?: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'shop_admin' | 'super_admin';
  shop_id?: number;
  created_at: Date;
}

export interface Shop {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  opening_time: string;
  closing_time: string;
  slot_duration: number;
  max_capacity: number;
  is_active: boolean;
  created_at: Date;
}

export interface Reservation {
  id: number;
  shop_id: number;
  user_id?: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  reservation_date: string;
  reservation_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: Date;
  shop_name?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  current_count: number;
  max_capacity: number;
}

