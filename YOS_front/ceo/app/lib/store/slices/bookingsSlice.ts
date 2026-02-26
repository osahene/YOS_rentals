import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import apiService from "@/app/utils/APIPaths";
import { Booking, DashboardMetrics, BookingTrends, PaginatedResponse } from "../types/bookings";

interface BookingsState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  dashboardMetrics: DashboardMetrics;
  bookingTrends: BookingTrends;
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
  searchTerm: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const initialState: BookingsState = {
  bookings: [],
  selectedBooking: null,
  dashboardMetrics: {
    total_bookings: 0,
    active_bookings: 0,
    revenue: 0,
    cancelled: 0
  },
  bookingTrends: {
    chart_data: [],
    vehicle_distribution: []
  },
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
  searchTerm: '',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
};

const getErrorMessage = (error: any) => {
  return error.response?.data?.message || error.message || "An error occurred";
};

// Async Thunks
export const fetchDashboardMetrics = createAsyncThunk(
  "bookings/fetchDashboardMetrics",
  async (params: { days?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchDashboardMetrics(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchBookingTrends = createAsyncThunk(
  "bookings/fetchBookingTrends",
  async (params: { months?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchBookingTrends(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchBookings = createAsyncThunk(
  "bookings/fetchBookings",
  async (params: {
    page?: number;
    page_size?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchBookings(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  "bookings/fetchBookingById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchBookingById(id);
      console.log("API Response for fetchBookingById:", response); // Debugging log
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createBooking = createAsyncThunk(
  "bookings/createBooking",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiService.createBooking(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateBooking = createAsyncThunk(
  "bookings/updateBooking",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateBooking(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteBooking = createAsyncThunk(
  "bookings/deleteBooking",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.deleteBooking(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelBooking = createAsyncThunk(
  "bookings/cancelBooking",
  async ({ id, reason, refund_amount }: { 
    id: string; 
    reason: string; 
    refund_amount?: number 
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.cancelBooking(id, { reason, refund_amount });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markBookingReturned = createAsyncThunk(
  "bookings/markBookingReturned",
  async ({ 
    id, 
    actual_return_time, 
    return_mileage 
  }: { 
    id: string; 
    actual_return_time?: string; 
    return_mileage?: number 
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.markBookingReturned(id, { 
        actual_return_time, 
        return_mileage 
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const checkAvailability = createAsyncThunk(
  "bookings/checkAvailability",
  async ({ 
    car_id, 
    start_date, 
    end_date 
  }: { 
    car_id: number; 
    start_date: string; 
    end_date: string 
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.checkAvailability({ car_id, start_date, end_date });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setSelectedBooking: (state, action: PayloadAction<Booking | null>) => {
      state.selectedBooking = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<BookingsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<BookingsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = '';
      state.pagination = initialState.pagination;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedBooking: (state) => {
      state.selectedBooking = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard Metrics
    builder.addCase(fetchDashboardMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.dashboardMetrics = action.payload;
    });
    builder.addCase(fetchDashboardMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Booking Trends
    builder.addCase(fetchBookingTrends.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBookingTrends.fulfilled, (state, action) => {
      state.loading = false;
      state.bookingTrends = action.payload;
    });
    builder.addCase(fetchBookingTrends.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Bookings
    builder.addCase(fetchBookings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBookings.fulfilled, (state, action) => {
      state.loading = false;
      
      if (action.payload.results) {
        // Paginated response
        state.bookings = action.payload.results;
        state.pagination = {
          currentPage: action.meta.arg.page || 1,
          totalItems: action.payload.count,
          totalPages: Math.ceil(action.payload.count / (action.meta.arg.page_size || 10)),
          itemsPerPage: action.meta.arg.page_size || 10
        };
      } else {
        // Non-paginated response
        state.bookings = Array.isArray(action.payload) ? action.payload : [];
      }
    });
    builder.addCase(fetchBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Booking by ID
    builder.addCase(fetchBookingById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBookingById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedBooking = action.payload;
    });
    builder.addCase(fetchBookingById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Booking
    builder.addCase(createBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBooking.fulfilled, (state, action) => {
      state.loading = false;
      state.bookings.unshift(action.payload);
      // Update metrics
      state.dashboardMetrics.total_bookings += 1;
      state.dashboardMetrics.revenue += action.payload.total_amount;
    });
    builder.addCase(createBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Booking
    builder.addCase(updateBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateBooking.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
      if (state.selectedBooking?.id === action.payload.id) {
        state.selectedBooking = action.payload;
      }
    });
    builder.addCase(updateBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete Booking
    builder.addCase(deleteBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteBooking.fulfilled, (state, action) => {
      state.loading = false;
      state.bookings = state.bookings.filter(booking => booking.id !== action.payload);
      if (state.selectedBooking?.id === action.payload) {
        state.selectedBooking = null;
      }
      state.dashboardMetrics.total_bookings -= 1;
    });
    builder.addCase(deleteBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Cancel Booking
    builder.addCase(cancelBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(cancelBooking.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.bookings.findIndex(b => b.id === action.meta.arg.id);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...action.payload };
      }
      if (state.selectedBooking?.id === action.meta.arg.id) {
        state.selectedBooking = { ...state.selectedBooking, ...action.payload };
      }
      state.dashboardMetrics.cancelled += 1;
    });
    builder.addCase(cancelBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setSelectedBooking,
  setSearchTerm,
  setFilter,
  setPagination,
  resetFilters,
  clearError,
  clearSelectedBooking,
} = bookingsSlice.actions;

// Selectors
export const selectBookings = (state: RootState) => state.bookings.bookings;
export const selectSelectedBooking = (state: RootState) => state.bookings.selectedBooking;
export const selectDashboardMetrics = (state: RootState) => state.bookings.dashboardMetrics;
export const selectBookingTrends = (state: RootState) => state.bookings.bookingTrends;
export const selectBookingsLoading = (state: RootState) => state.bookings.loading;
export const selectBookingsError = (state: RootState) => state.bookings.error;
export const selectBookingsFilters = (state: RootState) => state.bookings.filters;
export const selectBookingsSearchTerm = (state: RootState) => state.bookings.searchTerm;
export const selectBookingsPagination = (state: RootState) => state.bookings.pagination;

export const selectFilteredBookings = (state: RootState) => {
  const { bookings, searchTerm, filters } = state.bookings;
  
  return bookings.filter(booking => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      booking.customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer.phone.includes(searchTerm) ||
      booking.car.license_plate.includes(searchTerm);
    
    // Status filter
    const matchesStatus = filters.status === 'all' || booking.status === filters.status;
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.dateRange.start && filters.dateRange.end) {
      const bookingDate = new Date(booking.created_at);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      matchesDateRange = bookingDate >= startDate && bookingDate <= endDate;
    }
    
    // Vehicle type filter
    const matchesVehicleType = filters.vehicleType === 'all' || 
      booking.car.category === filters.vehicleType;
    
    // Amount filter
    const matchesAmount = booking.total_amount >= filters.minAmount && 
      booking.total_amount <= filters.maxAmount;
    
    return matchesSearch && matchesStatus && matchesDateRange && 
           matchesVehicleType && matchesAmount;
  });
};

export default bookingsSlice.reducer;