export interface Booking {
  id: string;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    ghana_card_number: string;
    driver_license_number?: string;
    driver_license_expiry?: Date
  };
  guarantor?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    relationship: string;
    ghana_card_number: string;
    address: string;
    occupation?: string;
  };
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    category: string;
    color: string;
    daily_rate: number;
    mileage: number;
    fuel_type: string;
    transmission: string;
  };
  start_date: string;
  end_date: string;
  pickup_location: string;
  dropoff_location: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  is_self_drive: boolean;
  duration_days: number;
  special_requests?: string;
}

export interface DashboardMetrics {
  total_bookings: number;
  active_bookings: number;
  revenue: number;
  cancelled: number;
}

export interface BookingTrends {
  chart_data: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  vehicle_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}