// types/car.ts
export interface TimelineEvent {
  id: string;
  date: string;
  type: "revenue" | "maintenance" | "insurance" | "accident" | "inspection" | "other";
  title: string;
  description: string;
  amount?: number;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  cost: number;
  description: string;
  garage: string;
}

export interface InsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  premium: number;
  status: "active" | "expired" | "pending";
}

export interface CarBooking {
  id: string;
  customerId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: "active" | "completed" | "cancelled";
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationDate: string;
  dailyRate?: number;
  depreciationRate?: number;
  currentValue?: number;
  status: "available" | "rented" | "maintenance" | "retired";
  imageUrl: string;
  rating: number;
  totalRevenue: number;
  totalExpenses: number;
  purchasePrice?: number;
  timelineEvents: TimelineEvent[];
  maintenanceRecords: MaintenanceRecord[];
  insurancePolicies: InsurancePolicy[];
  bookings: CarBooking[];
  
  // Additional fields for backend integration
  license_plate?: string;
  vin?: string;
  weekly_rate?: number;
  monthly_rate?: number;
  fuel_type?: "petrol" | "diesel" | "electric" | "hybrid";
  transmission?: "automatic" | "manual";
  seats?: number;
  mileage?: number;
  features?: string[];
  images?: string[];
  description?: string;
  insurance_expiry?: string;
  last_service_date?: string;
  next_service_date?: string;
}

export interface CarFormData {
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  vin?: string;
  purchase_price: number;
  purchase_date: string;
  fuel_type: "petrol" | "diesel" | "electric" | "hybrid";
  transmission: "automatic" | "manual";
  seats: number;
  mileage: number;
  features: string[];
  description?: string;
  insurance_company?: string;
  policy_number?: string;
  policy_type?: string;
  insurance_amount?: number;
  insurance_start_date?: string;
  insurance_end_date?: string;
  images?: File[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}