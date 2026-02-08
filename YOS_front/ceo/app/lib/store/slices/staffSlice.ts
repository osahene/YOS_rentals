import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import apiService from "@/app/utils/APIPaths";
import { Staff, SalaryPayment, StaffDashboardMetrics, DriverPerformance, DriverBooking } from "../types/staff";

interface StaffState {
  staff: Staff[];
  selectedStaff: Staff | null;
  salaryHistory: SalaryPayment[];
  driverBookings: DriverBooking[];
  dashboardMetrics: StaffDashboardMetrics | null;
  driverPerformance: DriverPerformance[];
  loading: boolean;
  error: string | null;
  filters: {
    role: string;
    department: string;
    status: string;
    employment_type: string;
  };
  searchTerm: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const initialState: StaffState = {
  staff: [],
  selectedStaff: null,
  salaryHistory: [],
  driverBookings: [],
  dashboardMetrics: null,
  driverPerformance: [],
  loading: false,
  error: null,
  filters: {
    role: 'all',
    department: 'all',
    status: 'active',
    employment_type: 'all'
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
export const fetchStaff = createAsyncThunk(
  "staff/fetchStaff",
  async (params: {
    page?: number;
    page_size?: number;
    role?: string;
    department?: string;
    status?: string;
    search?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchStaff(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchStaffById = createAsyncThunk(
  "staff/fetchStaffById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchStaffById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createStaff = createAsyncThunk(
  "staff/createStaff",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiService.createStaff(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateStaff = createAsyncThunk(
  "staff/updateStaff",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateStaff(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteStaff = createAsyncThunk(
  "staff/deleteStaff",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.deleteStaff(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const suspendStaff = createAsyncThunk(
  "staff/suspendStaff",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.suspendStaff(id);
      return { id, ...response.data };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const terminateStaff = createAsyncThunk(
  "staff/terminateStaff",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await apiService.terminateStaff(id, data);
      return { id, ...response.data };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const reactivateStaff = createAsyncThunk(
  "staff/reactivateStaff",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.reactivateStaff(id);
      return { id, ...response.data };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchStaffBookings = createAsyncThunk(
  "staff/fetchStaffBookings",
  async ({ id, params }: { id: string; params?: any }, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchStaffBookings(id, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchStaffSalaryHistory = createAsyncThunk(
  "staff/fetchStaffSalaryHistory",
  async ({ id, params }: { id: string; params?: any }, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchStaffSalaryHistory(id, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchStaffDashboardMetrics = createAsyncThunk(
  "staff/fetchStaffDashboardMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchStaffDashboardMetrics();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchDriverPerformance = createAsyncThunk(
  "staff/fetchDriverPerformance",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchDriverPerformance();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchSalaryPayments = createAsyncThunk(
  "staff/fetchSalaryPayments",
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchSalaryPayments(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createSalaryPayment = createAsyncThunk(
  "staff/createSalaryPayment",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiService.createSalaryPayment(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const bulkPaySalaries = createAsyncThunk(
  "staff/bulkPaySalaries",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiService.bulkPaySalaries(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setSelectedStaff: (state, action: PayloadAction<Staff | null>) => {
      state.selectedStaff = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<StaffState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<StaffState['pagination']>>) => {
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
    clearSelectedStaff: (state) => {
      state.selectedStaff = null;
      state.salaryHistory = [];
      state.driverBookings = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Staff
    builder.addCase(fetchStaff.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStaff.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.results) {
        // Paginated response
        state.staff = action.payload.results;
        state.pagination = {
          currentPage: action.meta.arg.page || 1,
          totalItems: action.payload.count,
          totalPages: Math.ceil(action.payload.count / (action.meta.arg.page_size || 10)),
          itemsPerPage: action.meta.arg.page_size || 10
        };
      } else {
        // Non-paginated response
        state.staff = Array.isArray(action.payload) ? action.payload : [];
      }
    });
    builder.addCase(fetchStaff.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Staff by ID
    builder.addCase(fetchStaffById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStaffById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedStaff = action.payload;
    });
    builder.addCase(fetchStaffById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Staff
    builder.addCase(createStaff.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createStaff.fulfilled, (state, action) => {
      state.loading = false;
      state.staff.unshift(action.payload);
      if (state.dashboardMetrics) {
        state.dashboardMetrics.total_staff += 1;
        state.dashboardMetrics.active_staff += 1;
      }
    });
    builder.addCase(createStaff.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Staff
    builder.addCase(updateStaff.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateStaff.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.staff.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.staff[index] = action.payload;
      }
      if (state.selectedStaff?.id === action.payload.id) {
        state.selectedStaff = action.payload;
      }
    });
    builder.addCase(updateStaff.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete Staff
    builder.addCase(deleteStaff.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteStaff.fulfilled, (state, action) => {
      state.loading = false;
      state.staff = state.staff.filter(staff => staff.id !== action.payload);
      if (state.selectedStaff?.id === action.payload) {
        state.selectedStaff = null;
      }
      if (state.dashboardMetrics) {
        state.dashboardMetrics.total_staff -= 1;
        if (state.selectedStaff?.status === 'active') {
          state.dashboardMetrics.active_staff -= 1;
        }
      }
    });
    builder.addCase(deleteStaff.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Suspend Staff
    builder.addCase(suspendStaff.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(suspendStaff.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.staff.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.staff[index].status = 'suspended';
        state.staff[index].status_display = 'Suspended';
      }
      if (state.selectedStaff && state.selectedStaff.id === action.payload.id) {
        state.selectedStaff.status = 'suspended';
        state.selectedStaff.status_display = 'Suspended';
      }
      if (state.dashboardMetrics) {
        state.dashboardMetrics.active_staff -= 1;
        state.dashboardMetrics.suspended_staff += 1;
      }
    });
    builder.addCase(suspendStaff.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Terminate Staff
    builder.addCase(terminateStaff.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(terminateStaff.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.staff.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.staff[index].status = 'terminated';
        state.staff[index].status_display = 'Terminated';
        state.staff[index].termination_date = action.payload.termination_date;
      }
      if (state.selectedStaff && state.selectedStaff.id === action.payload.id) {
        state.selectedStaff.status = 'terminated';
        state.selectedStaff.status_display = 'Terminated';
        state.selectedStaff.termination_date = action.payload.termination_date;
      }
      if (state.dashboardMetrics) {
        state.dashboardMetrics.active_staff -= 1;
        state.dashboardMetrics.terminated_staff += 1;
      }
    });
    builder.addCase(terminateStaff.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Reactivate Staff
    builder.addCase(reactivateStaff.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(reactivateStaff.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.staff.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.staff[index].status = 'active';
        state.staff[index].status_display = 'Active';
      }
      if (state.selectedStaff && state.selectedStaff.id === action.payload.id) {
        state.selectedStaff.status = 'active';
        state.selectedStaff.status_display = 'Active';
      }
      if (state.dashboardMetrics) {
        state.dashboardMetrics.active_staff += 1;
        state.dashboardMetrics.suspended_staff -= 1;
      }
    });
    builder.addCase(reactivateStaff.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Staff Bookings
    builder.addCase(fetchStaffBookings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStaffBookings.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.results) {
        state.driverBookings = action.payload.results;
      } else {
        state.driverBookings = Array.isArray(action.payload) ? action.payload : [];
      }
    });
    builder.addCase(fetchStaffBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Staff Salary History
    builder.addCase(fetchStaffSalaryHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStaffSalaryHistory.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.results) {
        state.salaryHistory = action.payload.results;
      } else {
        state.salaryHistory = Array.isArray(action.payload) ? action.payload : [];
      }
    });
    builder.addCase(fetchStaffSalaryHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Staff Dashboard Metrics
    builder.addCase(fetchStaffDashboardMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStaffDashboardMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.dashboardMetrics = action.payload;
    });
    builder.addCase(fetchStaffDashboardMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Driver Performance
    builder.addCase(fetchDriverPerformance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDriverPerformance.fulfilled, (state, action) => {
      state.loading = false;
      state.driverPerformance = action.payload;
    });
    builder.addCase(fetchDriverPerformance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setSelectedStaff,
  setSearchTerm,
  setFilter,
  setPagination,
  resetFilters,
  clearError,
  clearSelectedStaff,
} = staffSlice.actions;

// Selectors
export const selectStaff = (state: RootState) => state.staff.staff;
export const selectSelectedStaff = (state: RootState) => state.staff.selectedStaff;
export const selectSalaryHistory = (state: RootState) => state.staff.salaryHistory;
export const selectDriverBookings = (state: RootState) => state.staff.driverBookings;
export const selectDashboardMetrics = (state: RootState) => state.staff.dashboardMetrics;
export const selectDriverPerformance = (state: RootState) => state.staff.driverPerformance;
export const selectStaffLoading = (state: RootState) => state.staff.loading;
export const selectStaffError = (state: RootState) => state.staff.error;
export const selectStaffFilters = (state: RootState) => state.staff.filters;
export const selectStaffSearchTerm = (state: RootState) => state.staff.searchTerm;
export const selectStaffPagination = (state: RootState) => state.staff.pagination;

export const selectFilteredStaff = (state: RootState) => {
  const { staff, searchTerm, filters } = state.staff;
  
  return staff.filter(staff => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.phone.includes(searchTerm) ||
      staff.employee_id.includes(searchTerm);
    
    // Role filter
    const matchesRole = filters.role === 'all' || staff.role === filters.role;
    
    // Department filter
    const matchesDepartment = filters.department === 'all' || 
      (staff.department && staff.department.toLowerCase() === filters.department);
    
    // Status filter
    const matchesStatus = filters.status === 'all' || staff.status === filters.status;
    
    // Employment type filter
    const matchesEmploymentType = filters.employment_type === 'all' || 
      staff.employment_type === filters.employment_type;
    
    return matchesSearch && matchesRole && matchesDepartment && 
           matchesStatus && matchesEmploymentType;
  });
};

export default staffSlice.reducer;