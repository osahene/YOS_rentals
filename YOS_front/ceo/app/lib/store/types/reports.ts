export interface FinancialReportFilters {
  reportType: "monthly" | "annual";
  period: string; // e.g., "2023-01" for January 2023 or "2023" for the year 2023
  vehicleId?: string; // Optional: specific vehicle or all
  includeCharts: boolean;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  roi: number; // Return on Investment
  utilizationRate: number;
  averageDailyRate: number;
}

export interface ExpenseBreakdown {
  maintenance: number;
  insurance: number;
  fuel: number;
  other: number;
  total: number;
}

export interface MonthlyReportData {
  month: string;
  revenue: number;
  expenses: ExpenseBreakdown;
  bookings: number;
  utilization: number;
}

export interface AnnualReportData {
  year: string;
  quarterlyData: {
    quarter: number;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  monthlySummaries: MonthlyReportData[];
  topPerformingVehicles: {
    vehicleId: string;
    make: string;
    model: string;
    revenue: number;
    profit: number;
    utilization: number;
  }[];
}

export interface FinancialStatement {
  filters: FinancialReportFilters;
  generatedAt: string;
  summary: FinancialMetrics;
  incomeStatement: {
    revenue: {
      rentalIncome: number;
      otherIncome: number;
      totalRevenue: number;
    };
    expenses: ExpenseBreakdown & {
      depreciation: number;
      totalExpenses: number;
    };
    netIncome: number;
  };
  balanceSheet?: {
    assets: {
      currentValue: number;
      accumulatedDepreciation: number;
      totalAssets: number;
    };
    liabilities?: number;
    equity?: number;
  };
  detailedBreakdown: {
    byVehicle?: Array<{
      vehicleId: string;
      make: string;
      model: string;
      revenue: number;
      expenses: number;
      profit: number;
    }>;
    byCategory?: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
}
