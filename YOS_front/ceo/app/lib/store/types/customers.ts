export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_name: string;
  total_bookings: number;
  total_spent: number;
  total_amount: number;
  last_booking: string | null;
  status: 'active' | 'inactive' | 'blocked' | 'suspended';
  status_display: string;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  loyalty_tier_display: string;
  occupation: string;
  address_city: string;
  created_at: string;
}

export interface CustomerDetail extends Customer {
  ghana_card_id?: string;
  driver_license_id?: string;
  driver_license_class?: string;
  driver_license_issue_date?: string;
  driver_license_expiry_date?: string;
  gps_address?: string;
  address_region?: string;
  address_country?: string;
  preferred_vehicle_type?: string;
  communication_preferences: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  guarantors: Guarantor[];
  bookings: any[];
  last_booking_date?: string;
}

export interface Guarantor {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  ghana_card_id?: string;
  relationship?: string;
  occupation?: string;
  gps_address?: string;
  address_city?: string;
  address_region?: string;
  address_country?: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  car: any;
  car_details: any;
  start_date: string;
  end_date: string;
  duration_days: number;
  total_amount: number;
  status: string;
  status_display: string;
  payment_method: string;
  payment_method_display: string;
  payment_status: string;
  payment_status_display: string;
  guarantor_name: string;
  created_at: string;
}
