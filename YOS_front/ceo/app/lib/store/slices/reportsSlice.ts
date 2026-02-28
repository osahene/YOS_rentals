import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import apiService from "@/app/utils/APIPaths";

interface FinancialReport {
  executive_summary: any;
  income_statement: any;
  balance_sheet: any;
  cash_flow_statement: any;
  key_metrics: any;
  vehicle_performance: any[];
  trend_analysis: any[];
  financial_ratios: any;
  management_discussion: any;
  risk_assessment: any;
  period: any;
  generated_at: string;
  report_id: string;
}

interface FinancialProjection {
  projections: any[];
  base_year: number;
  assumptions: any;
  sensitivity_analysis: any[];
}

// Params types
interface FetchReportParams {
  type: "quarterly" | "annual" | "monthly";
  year: string;
  quarter?: number;
  month?: number;
  vehicle_id?: string;
}

interface FetchProjectionsParams {
  years: number;
  growth_rate: number;
}

// Error helper
const getErrorMessage = (error: any): string => {
  return error.response?.data?.message || error.message || "An error occurred";
};

// State interface
interface ReportsState {
  report: FinancialReport | null;
  projections: FinancialProjection | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  report: null,
  projections: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchFinancialReport = createAsyncThunk<
  FinancialReport,
  FetchReportParams,
  { rejectValue: string }
>("reports/fetchFinancialReport", async (params, { rejectWithValue }) => {
  try {
    const response = await apiService.fetchComprehensiveFinancialReport(params);
    console.log("API Response for fetchFinancialReport:", response); // Debugging log
    return response.data; // Assuming API returns data directly
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchFinancialProjections = createAsyncThunk<
  FinancialProjection,
  FetchProjectionsParams,
  { rejectValue: string }
>("reports/fetchFinancialProjections", async (params, { rejectWithValue }) => {
  try {
    const response = await apiService.fetchFinancialProjections(params);
    console.log("API Response for fetchFinancialProjections:", response); // Debugging log
    return response.data;
  } catch (error: any) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Slice
export const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearReport: (state) => {
      state.report = null;
      state.projections = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Financial Report
    builder.addCase(fetchFinancialReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFinancialReport.fulfilled, (state, action: PayloadAction<FinancialReport>) => {
      state.loading = false;
      state.report = action.payload;
    });
    builder.addCase(fetchFinancialReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Financial Projections
    builder.addCase(fetchFinancialProjections.pending, (state) => {
      // We might not want to set loading true here if it's a secondary fetch,
      // but for simplicity we can keep it or handle separately.
      // Let's keep a separate loading state? For now, we'll reuse loading,
      // but you could add projectionsLoading if needed.
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFinancialProjections.fulfilled, (state, action: PayloadAction<FinancialProjection>) => {
      state.loading = false;
      state.projections = action.payload;
    });
    builder.addCase(fetchFinancialProjections.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Actions
export const { clearReport, clearError } = reportsSlice.actions;

// Selectors
export const selectFinancialReport = (state: RootState) => state.reports.report;
export const selectFinancialProjections = (state: RootState) => state.reports.projections;
export const selectReportsLoading = (state: RootState) => state.reports.loading;
export const selectReportsError = (state: RootState) => state.reports.error;

export default reportsSlice.reducer;