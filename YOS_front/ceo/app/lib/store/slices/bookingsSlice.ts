// lib/store/slices/bookingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'overdue';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer';
  bookingDate: string;
  notes: string;
  extras: {
    insurance: boolean;
    gps: boolean;
    childSeat: boolean;
    additionalDriver: boolean;
  };
  driverLicense: {
    number: string;
    expiry: string;
    verified: boolean;
  };
}

interface BookingsState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: string;
    dateRange: {
      start: string | null;
      end: string | null;
    };
    vehicleType: string;
    minAmount: number;
    maxAmount: number;
  };
  stats: {
    total: number;
    revenue: number;
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
}

const initialState: BookingsState = {
  bookings: [
    {
      id: 'B-2025-01',
      customerId: '1',
      customerName: 'John Doe',
      vehicleId: '1',
      vehicleMake: 'Tesla',
      vehicleModel: 'Model 3',
      startDate: '2023-10-21',
      endDate: '2023-10-25',
      pickupLocation: 'Dhaka Airport',
      dropoffLocation: 'Dhaka Airport',
      totalAmount: 480,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      bookingDate: '2023-10-15',
      notes: 'Customer requested early check-in',
      extras: {
        insurance: true,
        gps: false,
        childSeat: false,
        additionalDriver: false,
      },
      driverLicense: {
        number: 'DL123456',
        expiry: '2025-08-31',
        verified: true,
      },
    },
    {
      id: 'B-2025-02',
      customerId: '2',
      customerName: 'Sarah Lee',
      vehicleId: '2',
      vehicleMake: 'Ford',
      vehicleModel: 'Explorer',
      startDate: '2023-10-22',
      endDate: '2023-10-24',
      pickupLocation: 'Bawari',
      dropoffLocation: 'Bawari',
      totalAmount: 360,
      status: 'active',
      paymentStatus: 'paid',
      paymentMethod: 'debit_card',
      bookingDate: '2023-10-18',
      notes: '',
      extras: {
        insurance: true,
        gps: true,
        childSeat: true,
        additionalDriver: false,
      },
      driverLicense: {
        number: 'DL789012',
        expiry: '2024-12-31',
        verified: true,
      },
    },
    {
      id: 'B-2025-03',
      customerId: '3',
      customerName: 'Mark Smith',
      vehicleId: '3',
      vehicleMake: 'BMW',
      vehicleModel: '5 Series',
      startDate: '2023-10-20',
      endDate: '2023-10-26',
      pickupLocation: 'Oakthan',
      dropoffLocation: 'Oakthan',
      totalAmount: 720,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      bookingDate: '2023-10-12',
      notes: 'Corporate booking',
      extras: {
        insurance: true,
        gps: true,
        childSeat: false,
        additionalDriver: true,
      },
      driverLicense: {
        number: 'DL345678',
        expiry: '2026-03-15',
        verified: true,
      },
    },
    {
      id: 'B-2025-04',
      customerId: '4',
      customerName: 'David Lee',
      vehicleId: '1',
      vehicleMake: 'Tesla',
      vehicleModel: 'Model 3',
      startDate: '2023-10-23',
      endDate: '2023-10-27',
      pickupLocation: 'Diaumondi',
      dropoffLocation: 'Diaumondi',
      totalAmount: 480,
      status: 'cancelled',
      paymentStatus: 'refunded',
      paymentMethod: 'credit_card',
      bookingDate: '2023-10-19',
      notes: 'Customer cancelled due to travel restrictions',
      extras: {
        insurance: true,
        gps: false,
        childSeat: false,
        additionalDriver: false,
      },
      driverLicense: {
        number: 'DL901234',
        expiry: '2025-11-30',
        verified: true,
      },
    },
  ],
  selectedBooking: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    dateRange: {
      start: null,
      end: null,
    },
    vehicleType: 'all',
    minAmount: 0,
    maxAmount: 10000,
  },
  stats: {
    total: 1245,
    revenue: 87200,
    active: 42,
    pending: 18,
    completed: 1150,
    cancelled: 35,
  },
};

export const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
      // Update stats when bookings change
      state.stats = {
        total: action.payload.length,
        revenue: action.payload.reduce((sum, booking) => sum + booking.totalAmount, 0),
        active: action.payload.filter(b => b.status === 'active').length,
        pending: action.payload.filter(b => b.status === 'pending').length,
        completed: action.payload.filter(b => b.status === 'completed').length,
        cancelled: action.payload.filter(b => b.status === 'cancelled').length,
      };
    },
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => {
      state.selectedBooking = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.push(action.payload);
      state.stats.total += 1;
      state.stats.revenue += action.payload.totalAmount;
      if (action.payload.status === 'active') state.stats.active += 1;
      if (action.payload.status === 'pending') state.stats.pending += 1;
      if (action.payload.status === 'completed') state.stats.completed += 1;
      if (action.payload.status === 'cancelled') state.stats.cancelled += 1;
    },
    updateBooking: (state, action: PayloadAction<Booking>) => {
      const index = state.bookings.findIndex(booking => booking.id === action.payload.id);
      if (index !== -1) {
        // Subtract old values from stats
        const oldBooking = state.bookings[index];
        state.stats.revenue -= oldBooking.totalAmount;
        if (oldBooking.status === 'active') state.stats.active -= 1;
        if (oldBooking.status === 'pending') state.stats.pending -= 1;
        if (oldBooking.status === 'completed') state.stats.completed -= 1;
        if (oldBooking.status === 'cancelled') state.stats.cancelled -= 1;
        
        // Update booking
        state.bookings[index] = action.payload;
        
        // Add new values to stats
        state.stats.revenue += action.payload.totalAmount;
        if (action.payload.status === 'active') state.stats.active += 1;
        if (action.payload.status === 'pending') state.stats.pending += 1;
        if (action.payload.status === 'completed') state.stats.completed += 1;
        if (action.payload.status === 'cancelled') state.stats.cancelled += 1;
      }
    },
    deleteBooking: (state, action: PayloadAction<string>) => {
      const booking = state.bookings.find(b => b.id === action.payload);
      if (booking) {
        // Update stats
        state.stats.total -= 1;
        state.stats.revenue -= booking.totalAmount;
        if (booking.status === 'active') state.stats.active -= 1;
        if (booking.status === 'pending') state.stats.pending -= 1;
        if (booking.status === 'completed') state.stats.completed -= 1;
        if (booking.status === 'cancelled') state.stats.cancelled -= 1;
        
        // Remove booking
        state.bookings = state.bookings.filter(booking => booking.id !== action.payload);
      }
    },
    setBookingFilter: (state, action: PayloadAction<{ key: keyof BookingsState['filters']; value: string | number | { start: string | null; end: string | null } }>) => {
      if (action.payload.key === 'dateRange') {
        state.filters.dateRange = action.payload.value as { start: string | null; end: string | null };
      } else {
        (state.filters[action.payload.key] as string | number) = action.payload.value as string | number;
      }
    },
    resetBookingFilters: (state) => {
      state.filters = initialState.filters;
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: string; status: Booking['status'] }>) => {
      const booking = state.bookings.find(b => b.id === action.payload.id);
      if (booking) {
        // Update stats for old status
        if (booking.status === 'active') state.stats.active -= 1;
        if (booking.status === 'pending') state.stats.pending -= 1;
        if (booking.status === 'completed') state.stats.completed -= 1;
        if (booking.status === 'cancelled') state.stats.cancelled -= 1;
        
        // Update booking status
        booking.status = action.payload.status;
        
        // Update stats for new status
        if (action.payload.status === 'active') state.stats.active += 1;
        if (action.payload.status === 'pending') state.stats.pending += 1;
        if (action.payload.status === 'completed') state.stats.completed += 1;
        if (action.payload.status === 'cancelled') state.stats.cancelled += 1;
      }
    },
    processPayment: (state, action: PayloadAction<{ id: string; paymentStatus: Booking['paymentStatus'] }>) => {
      const booking = state.bookings.find(b => b.id === action.payload.id);
      if (booking) {
        booking.paymentStatus = action.payload.paymentStatus;
      }
    },
  },
});

export const {
  setBookings,
  setSelectedBooking,
  addBooking,
  updateBooking,
  deleteBooking,
  setBookingFilter,
  resetBookingFilters,
  updateBookingStatus,
  processPayment,
} = bookingsSlice.actions;

export default bookingsSlice.reducer;