// types/dashboard.ts
export interface DashboardMetrics {
  active_customers: number;
  revenue: number;
  available_cars: number;
  recent_bookings: number;
}

export interface BookingStatus {
  active: number;
  pending: number;
  completed: number;
  cancelled: number;
}

export interface CarStatus {
  [key: string]: number;
}

export interface RevenueTrend {
  month: string;
  month_full: string;
  revenue: number;
  bookings: number;
}

export interface DailyBooking {
  day: string;
  full_day: string;
  bookings: number;
}

export interface CarDistribution {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface TopCar {
  id: string;
  name: string;
  license_plate: string;
  revenue: number;
  bookings: number;
  status: string;
  color: string;
}

export interface RecentBooking {
  id: string;
  customer: string;
  vehicle: string;
  pickup: string;
  return: string;
  location: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  payment_status: string;
  total_amount: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  bookingStatus: BookingStatus;
  carStatus: CarStatus;
  trends: RevenueTrend[];
  recentBookings: RecentBooking[];
  carDistribution: CarDistribution[];
  dailyBookings: DailyBooking[];
  topCars: TopCar[];
}