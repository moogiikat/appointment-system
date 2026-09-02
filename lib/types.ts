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
  icon?: string;
  category?: string;
  district?: string;
  photos?: string[];
  opening_time: string;
  closing_time: string;
  slot_duration: number;
  max_capacity: number;
  is_active: boolean;
  created_at: Date;
  rating_avg?: number;
  rating_count?: number;
}

export interface ShopService {
  id: number;
  shop_id: number;
  name: string;
  price?: number;
  duration_minutes?: number;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Review {
  id: number;
  shop_id: number;
  user_id: number;
  reservation_id?: number;
  rating: number;
  comment?: string;
  shop_reply?: string;
  shop_reply_at?: Date;
  created_at: Date;
  user_name?: string;
  user_avatar?: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  shop_id: number;
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
  has_review?: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  current_count: number;
  max_capacity: number;
}

export interface ShopDashboardStats {
  today_count: number;
  week_count: number;
  month_count: number;
  cancellation_rate: number;
  completion_rate: number;
  status_breakdown: {
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  popular_times: { time: string; count: number }[];
  daily_counts: { date: string; count: number }[];
}

