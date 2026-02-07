import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import apiService from "@/app/utils/APIPaths";
import { Customer, CustomerDetail, Booking } from "../types/customers";

interface CustomersState {
  customers: Customer[];
  selectedCustomer: CustomerDetail | null;
  customerBookings: Booking[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: {
    status: string;
    loyalty_tier: string;
    min_bookings: number;
  };
}

const initialState: CustomersState = {
  customers: [],
  selectedCustomer: null,
  customerBookings: [],
  loading: false,
  error: null,
  searchTerm: '',
  filters: {
    status: 'all',
    loyalty_tier: 'all',
    min_bookings: 0,
  },
};

const getErrorMessage = (error: any) => {
  return error.response?.data?.message || error.message || "An error occurred";
};

// Async Thunks
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchCustomers(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  "customers/fetchCustomerById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchCustomerById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCustomerBookings = createAsyncThunk(
  "customers/fetchCustomerBookings",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchCustomerBookings(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const sendBulkMessage = createAsyncThunk(
  "customers/sendBulkMessage",
  async (data: {
    customerIds: string[];
    message: string;
    type: 'email' | 'sms';
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendBulkMessage(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSelectedCustomer: (state, action: PayloadAction<CustomerDetail | null>) => {
      state.selectedCustomer = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<CustomersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = '';
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCustomerBookings: (state) => {
      state.customerBookings = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Customers
    builder.addCase(fetchCustomers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      state.loading = false;
      state.customers = Array.isArray(action.payload) ? action.payload : (action.payload.customers || []);
    });
    builder.addCase(fetchCustomers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Customer by ID
    builder.addCase(fetchCustomerById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomerById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedCustomer = action.payload;
    });
    builder.addCase(fetchCustomerById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Customer Bookings
    builder.addCase(fetchCustomerBookings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomerBookings.fulfilled, (state, action) => {
      state.loading = false;
      state.customerBookings = action.payload.bookings || [];
    });
    builder.addCase(fetchCustomerBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Send Bulk Message
    builder.addCase(sendBulkMessage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(sendBulkMessage.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(sendBulkMessage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setSelectedCustomer,
  setSearchTerm,
  setFilter,
  resetFilters,
  clearError,
  clearCustomerBookings,
} = customersSlice.actions;

// Selectors
export const selectCustomers = (state: RootState) => state.customers.customers;
export const selectSelectedCustomer = (state: RootState) => state.customers.selectedCustomer;
export const selectCustomerBookings = (state: RootState) => state.customers.customerBookings;
export const selectCustomersLoading = (state: RootState) => state.customers.loading;
export const selectCustomersError = (state: RootState) => state.customers.error;
export const selectCustomersFilters = (state: RootState) => state.customers.filters;
export const selectCustomersSearchTerm = (state: RootState) => state.customers.searchTerm;

export const selectFilteredCustomers = (state: RootState) => {
  const { customers, searchTerm, filters } = state.customers;
  
  return customers.filter(customer => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    
    // Status filter
    const matchesStatus = filters.status === 'all' || customer.status === filters.status;
    
    // Loyalty tier filter
    const matchesLoyaltyTier = filters.loyalty_tier === 'all' || customer.loyalty_tier === filters.loyalty_tier;
    
    // Min bookings filter
    const matchesMinBookings = customer.total_bookings >= filters.min_bookings;
    
    return matchesSearch && matchesStatus && matchesLoyaltyTier && matchesMinBookings;
  });
};

export default customersSlice.reducer;