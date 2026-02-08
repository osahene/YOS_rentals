export interface Staff {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  role_display: string;
  department: string;
  employment_type: string;
  employment_type_display: string;
  shift: string;
  shift_display: string;
  salary: number;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  status: string;
  status_display: string;
  hire_date: string;
  termination_date?: string;
  driver_license_id?: string;
  driver_license_class?: string;
  created_at: string;
  full_name: string;
  total_bookings?: number;
  completed_bookings?: number;
  total_salary_paid?: number;
}

export interface SalaryPayment {
  id: string;
  staff: string;
  staff_name: string;
  staff_role: string;
  month: string;
  basic_salary: number;
  overtime?: number;
  bonuses?: number;
  deductions?: number;
  net_salary: number;
  is_paid: boolean;
  payment_date?: string;
  payment_method?: string;
  created_at: string;
}

export interface DriverBooking {
  id: string;
  customer_name: string;
  car_details: {
    make: string;
    model: string;
    license_plate: string;
  };
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  status_display: string;
  created_at: string;
}

export interface StaffDashboardMetrics {
  total_staff: number;
  active_staff: number;
  suspended_staff: number;
  terminated_staff: number;
  by_department: Array<{ department: string; count: number }>;
  by_role: Array<{ role: string; count: number }>;
  driver_stats: Array<{
    id: string;
    name: string;
    completed_bookings: number;
    status: string;
  }>;
}

export interface DriverPerformance {
  driver_id: string;
  driver_name: string;
  total_bookings: number;
  completed_bookings: number;
  completion_rate: number;
  total_revenue: number;
  average_rating: number;
  status: string;
}