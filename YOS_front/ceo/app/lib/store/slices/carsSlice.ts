import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationDate: string;
  dailyRate: number;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  imageUrl: string;
  rating: number;
  totalRevenue: number;
  totalExpenses: number;
  timelineEvents: TimelineEvent[];
  maintenanceRecords: MaintenanceRecord[];
  insurancePolicies: InsurancePolicy[];
  bookings: CarBooking[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'revenue' | 'maintenance' | 'insurance' | 'accident' | 'other';
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
  status: 'active' | 'expired' | 'pending';
}

export interface CarBooking {
  id: string;
  customerId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
}

interface CarsState {
  cars: Car[];
  selectedCar: Car | null;
  loading: boolean;
  error: string | null;
}

const initialState: CarsState = {
  cars: [
    {
      id: '1',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      color: '#3B82F6',
      registrationDate: '2023-01-15',
      dailyRate: 120,
      status: 'available',
      imageUrl: '/cars/tesla-model3.jpg',
      rating: 4.5,
      totalRevenue: 45000,
      totalExpenses: 12000,
      timelineEvents: [],
      maintenanceRecords: [],
      insurancePolicies: [],
      bookings: [],
    },
    // Add more sample cars...
  ],
  selectedCar: null,
  loading: false,
  error: null,
};

export const carsSlice = createSlice({
  name: 'cars',
  initialState,
  reducers: {
    setCars: (state, action: PayloadAction<Car[]>) => {
      state.cars = action.payload;
    },
    setSelectedCar: (state, action: PayloadAction<Car | null>) => {
      state.selectedCar = action.payload;
    },
    addCar: (state, action: PayloadAction<Car>) => {
      state.cars.push(action.payload);
    },
    updateCar: (state, action: PayloadAction<Car>) => {
      const index = state.cars.findIndex(car => car.id === action.payload.id);
      if (index !== -1) {
        state.cars[index] = action.payload;
      }
    },
    deleteCar: (state, action: PayloadAction<string>) => {
      state.cars = state.cars.filter(car => car.id !== action.payload);
    },
  },
});

export const { setCars, setSelectedCar, addCar, updateCar, deleteCar } = carsSlice.actions;
export default carsSlice.reducer;