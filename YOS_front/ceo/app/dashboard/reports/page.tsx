"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import apiService from "@/app/utils/APIPaths";
import {
  FileText,
  BarChart3,
  Download,
  Calendar,
  ReceiptCent,
  Car,
  Users,
  Shield,
  Target,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Building,
  Banknote,
  Calculator,
  ChartLine,
  ChartPie,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useReactToPrint } from "react-to-print";

import * as XLSX from "xlsx";

// Types
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

export default function FinancialReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const [reportType, setReportType] = useState<"quarterly" | "annual" | "monthly">("quarterly");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [includeProjections, setIncludeProjections] = useState<boolean>(true);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [projections, setProjections] = useState<FinancialProjection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["executive", "income", "metrics", "ratios"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Fetch financial report
  const fetchFinancialReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        type: reportType,
        year: year.toString(),
      };

      if (reportType === "quarterly") {
        params.quarter = quarter;
      } else if (reportType === "monthly") {
        params.month = month;
      }

      if (selectedVehicle !== "all") {
        params.vehicle_id = selectedVehicle;
      }

      const response = await apiService.fetchComprehensiveFinancialReport(params);
      setReport(response.data);

      // Fetch projections if enabled
      if (includeProjections) {
        const projResponse = await apiService.fetchFinancialProjections({
          years: 3,
          growth_rate: 15,
        });
        setProjections(projResponse.data);
      }
    } catch (error) {
      console.error("Error fetching financial report:", error);
    } finally {
      setLoading(false);
    }
  }, [reportType, year, quarter, month, selectedVehicle, includeProjections]);

  useEffect(() => {
    fetchFinancialReport();
  }, [fetchFinancialReport]);

  // Export functions
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Financial-Report-${report?.report_id || Date.now()}`,
    onAfterPrint: () => console.log("Report printed successfully"),
  });


  const exportToExcel = () => {
    if (!report) return;

    const workbook = XLSX.utils.book_new();

    // Executive Summary
    const execData = [
      ["EXECUTIVE SUMMARY"],
      ["Company", report.executive_summary.company_name],
      ["Report Period", report.executive_summary.report_period],
      [],
      ["KEY HIGHLIGHTS"],
      ["Total Revenue", `₵${formatCurrency(report.executive_summary.key_highlights.total_revenue)}`],
      ["Net Profit", `₵${formatCurrency(report.executive_summary.key_highlights.net_profit)}`],
      ["Profit Margin", `${report.executive_summary.key_highlights.profit_margin.toFixed(2)}%`],
      ["Total Assets", `₵${formatCurrency(report.executive_summary.key_highlights.total_assets)}`],
      ["ROI", `${report.executive_summary.key_highlights.return_on_investment.toFixed(2)}%`],
    ];

    const execSheet = XLSX.utils.aoa_to_sheet(execData);
    XLSX.utils.book_append_sheet(workbook, execSheet, "Executive Summary");

    // Income Statement
    const incomeData = [
      ["INCOME STATEMENT"],
      ["Revenue", "Amount"],
      ["Booking Revenue", report.income_statement.operating_revenue.booking_revenue],
      ["Late Fee Revenue", report.income_statement.operating_revenue.late_fee_revenue],
      ["Total Revenue", report.income_statement.operating_revenue.total_operating_revenue],
      [],
      ["Expenses", "Amount"],
      ["Maintenance", report.income_statement.operating_expenses.maintenance],
      ["Insurance", report.income_statement.operating_expenses.insurance],
      ["Salaries", report.income_statement.operating_expenses.salaries],
      ["Total Expenses", report.income_statement.operating_expenses.total_operating_expenses],
      [],
      ["Net Income", report.income_statement.net_income],
    ];

    const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
    XLSX.utils.book_append_sheet(workbook, incomeSheet, "Income Statement");

    // Vehicle Performance
    const vehicleData = [
      ["VEHICLE PERFORMANCE"],
      ["Vehicle", "Revenue", "Profit", "Utilization", "Bookings"],
      ...report.vehicle_performance.map(v => [
        `${v.make} ${v.model}`,
        v.revenue,
        v.profit,
        v.utilization_rate,
        v.bookings_count,
      ]),
    ];

    const vehicleSheet = XLSX.utils.aoa_to_sheet(vehicleData);
    XLSX.utils.book_append_sheet(workbook, vehicleSheet, "Vehicle Performance");

    XLSX.writeFile(workbook, `Financial-Report-${report.report_id}.xlsx`);
  };

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUp className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDown className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  // Chart data preparation
  const prepareRevenueExpenseChart = () => {
    if (!report?.trend_analysis) return [];

    return report.trend_analysis.map(item => ({
      period: item.period,
      revenue: item.revenue,
      bookings: item.bookings,
    }));
  };

  const prepareExpenseBreakdownChart = () => {
    if (!report?.income_statement) return [];

    const expenses = report.income_statement.operating_expenses;
    return [
      { name: "Maintenance", value: expenses.maintenance },
      { name: "Insurance", value: expenses.insurance },
      { name: "Salaries", value: expenses.salaries },
    ];
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-400">
            Generating Comprehensive Financial Report...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            This may take a moment as we compile detailed financial analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Financial Reports
              </h1>
              {/* <p className="text-gray-600 dark:text-gray-400 mt-1">
                Professional financial reporting for investors and lenders
              </p> */}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handlePrint()}
                disabled={exporting || !report}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                onClick={exportToExcel}
                disabled={!report}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Report Controls */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              >
                <option value="quarterly">Quarterly Report</option>
                <option value="annual">Annual Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {reportType === "quarterly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quarter
                </label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                >
                  <option value={1}>Q1 (Jan-Mar)</option>
                  <option value={2}>Q2 (Apr-Jun)</option>
                  <option value={3}>Q3 (Jul-Sep)</option>
                  <option value={4}>Q4 (Oct-Dec)</option>
                </select>
              </div>
            )}

            <div className="flex items-end">
              <button
                onClick={fetchFinancialReport}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Update Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {report ? (
          <div ref={reportRef} className="max-w-7xl mx-auto">
            {/* Report Header */}
            <div className=" bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">YOS Car Rentals</h2>
                  <span className="print-only">
                    <p className=" mt-2">
                      Location: Opposite Shell filling station, Mango Down, Patasi, Kumasi, Ghana
                    </p>
                    <p className="">
                      Phone: +233 54 621 3027 | +233 24 445 5757 | Email: info@yoscarrentals.com
                    </p>
                  </span>
                  <p className="text-blue-100 mb-4">
                    Financial Report
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{report.period.start} to {report.period.end}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Generated: {new Date(report.generated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Report ID: {report.report_id}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      ¢{formatCurrency(report.executive_summary.key_highlights.total_revenue)}
                    </div>
                    <div className="text-sm text-blue-100">Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Dashboard */}
            <div className="screen-only grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ReceiptCent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={`text-sm font-medium ${getTrendColor(report.executive_summary.key_highlights.profit_margin)}`}>
                    {getGrowthIcon(report.executive_summary.key_highlights.profit_margin)}
                    {formatPercentage(report.executive_summary.key_highlights.profit_margin)}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  ₵{formatCurrency(report.executive_summary.key_highlights.net_profit)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Net Profit</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Building className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {getGrowthIcon(report.executive_summary.key_highlights.return_on_investment)}
                    {formatPercentage(report.executive_summary.key_highlights.return_on_investment)}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  ₵{formatCurrency(report.executive_summary.key_highlights.total_assets)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Total Assets</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Car className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-purple-600">
                    {formatPercentage(report.executive_summary.key_highlights.fleet_utilization)}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatPercentage(report.executive_summary.key_highlights.fleet_utilization)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Fleet Utilization</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {getGrowthIcon(report.executive_summary.key_highlights.customer_growth || 0)}
                    {formatPercentage(report.executive_summary.key_highlights.customer_growth || 0)}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatPercentage(report.executive_summary.key_highlights.customer_growth || 0)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Customer Growth</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <div
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => toggleSection("executive")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Target className="w-5 h-5" />
                    Executive Summary
                  </h3>
                  {expandedSections.has("executive") ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
              {expandedSections.has("executive") && (
                <div className="p-6">
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
                      <h4 className="font-bold text-lg mb-3">Business Overview</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {report.executive_summary.business_overview}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-bold text-lg mb-3">Financial Performance</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {report.executive_summary.financial_performance}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-3">Business Outlook</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {report.executive_summary.outlook}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Income Statement */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <div
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => toggleSection("income")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Banknote className="w-5 h-5" />
                    Income Statement
                  </h3>
                  {expandedSections.has("income") ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
              {expandedSections.has("income") && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Section */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-4 text-green-800 dark:text-green-300">
                        Revenue
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Booking Revenue
                          </span>
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            ₵{formatCurrency(report.income_statement.operating_revenue.booking_revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Late Fee Revenue
                          </span>
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            ₵{formatCurrency(report.income_statement.operating_revenue.late_fee_revenue)}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-green-200 dark:border-green-700">
                          <div className="flex justify-between">
                            <span className="font-bold">Total Revenue</span>
                            <span className="font-bold text-green-800 dark:text-green-300">
                              ₵{formatCurrency(report.income_statement.operating_revenue.total_operating_revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-4 text-red-800 dark:text-red-300">
                        Expenses
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Maintenance
                          </span>
                          <span className="font-semibold text-red-700 dark:text-red-400">
                            ₵{formatCurrency(report.income_statement.operating_expenses.maintenance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Insurance
                          </span>
                          <span className="font-semibold text-red-700 dark:text-red-400">
                            ₵{formatCurrency(report.income_statement.operating_expenses.insurance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Salaries
                          </span>
                          <span className="font-semibold text-red-700 dark:text-red-400">
                            ₵{formatCurrency(report.income_statement.operating_expenses.salaries)}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-red-200 dark:border-red-700">
                          <div className="flex justify-between">
                            <span className="font-bold">Total Expenses</span>
                            <span className="font-bold text-red-800 dark:text-red-300">
                              ₵{formatCurrency(report.income_statement.operating_expenses.total_operating_expenses)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net Income */}
                    <div className={`rounded-xl p-6 ${report.income_statement.net_income >= 0
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-red-50 dark:bg-red-900/20"
                      }`}>
                      <h4 className="font-bold text-lg mb-4">Net Income</h4>
                      <div className="text-center py-6">
                        <div className={`text-4xl font-bold mb-2 ${report.income_statement.net_income >= 0
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                          }`}>
                          ₵{formatCurrency(report.income_statement.net_income)}
                        </div>
                        <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${report.income_statement.net_income >= 0
                          ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-300"
                          }`}>
                          {report.income_statement.net_income >= 0 ? "PROFIT" : "LOSS"}
                        </div>
                      </div>
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        EBITDA: ₵{formatCurrency(report.income_statement.ebitda)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Trend Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ChartLine className="w-5 h-5" />
                  Revenue Trend Analysis
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareRevenueExpenseChart()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        formatter={(value) => [`₵${formatCurrency(Number(value))}`, "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Breakdown Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ChartPie className="w-5 h-5" />
                  Expense Breakdown
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={prepareExpenseBreakdownChart()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${percent ? (percent * 100).toFixed(1) : 0}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareExpenseBreakdownChart().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₵${formatCurrency(Number(value))}`, "Amount"]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Financial Ratios */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <div
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => toggleSection("ratios")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Calculator className="w-5 h-5" />
                    Financial Ratios & Analysis
                  </h3>
                  {expandedSections.has("ratios") ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
              {expandedSections.has("ratios") && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(report.financial_ratios).map(([category, ratios]: [string, any]) => (
                      <div key={category} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-3 capitalize">
                          {category.replace("_", " ")}
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(ratios).map(([name, value]: [string, any]) => (
                            <div key={name} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {name.replace("_", " ")}
                              </span>
                              <span className={`font-medium ${typeof value === "number" && value > 0
                                ? "text-green-600"
                                : "text-gray-600"
                                }`}>
                                {typeof value === "number"
                                  ? value.toFixed(2) + (name.includes("ratio") || name.includes("margin") ? "%" : "")
                                  : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Car className="w-5 h-5" />
                  Vehicle Performance Analysis
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Vehicle
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Revenue
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Maintenance Cost
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Profit
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Utilization
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Bookings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.vehicle_performance.map((vehicle, index) => (
                      <tr
                        key={vehicle.vehicle_id}
                        className={`border-b border-gray-100 dark:border-gray-700 ${index % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/50" : ""
                          }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-xs text-gray-500">
                            {vehicle.year} • {vehicle.license_plate}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-green-600">
                          ₵{formatCurrency(vehicle.revenue)}
                        </td>
                        <td className="py-3 px-4 font-medium text-red-600">
                          ₵{formatCurrency(vehicle.maintenance_cost)}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span className={vehicle.profit >= 0 ? "text-green-700" : "text-red-700"}>
                            ₵{formatCurrency(vehicle.profit)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(vehicle.utilization_rate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {vehicle.utilization_rate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-center font-medium">
                            {vehicle.bookings_count}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Management Discussion */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <div
                className="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => toggleSection("management")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Building className="w-5 h-5" />
                    Management Discussion & Analysis
                  </h3>
                  {expandedSections.has("management") ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
              {expandedSections.has("management") && (
                <div className="p-6">
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    {Object.entries(report.management_discussion).map(([section, content]: [string, any]) => (
                      <div key={section} className="mb-6 last:mb-0">
                        <h4 className="font-bold text-lg mb-3 capitalize">
                          {section.replace("_", " ")}
                        </h4>
                        {typeof content === "string" ? (
                          <p className="text-gray-700 dark:text-gray-300 mb-4">{content}</p>
                        ) : Array.isArray(content) ? (
                          <ul className="space-y-2">
                            {content.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : typeof content === "object" ? (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            {Object.entries(content).map(([key, value]: [string, any]) => (
                              <div key={key} className="mb-2">
                                <span className="font-medium capitalize">{key.replace("_", " ")}:</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{value}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk Assessment */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  Risk Assessment & Mitigation
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(report.risk_assessment || {}).map(([category, risks]: [string, any]) => (
                    <div key={category} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-3 capitalize">
                        {category.replace("_", " ")} Risks
                      </h4>
                      <div className="space-y-3">
                        {Array.isArray(risks) && risks.map((risk: any, index: number) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-800 dark:text-white">
                                {risk.risk}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${risk.level === 'High'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : risk.level === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                {risk.level}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Mitigation: {risk.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Report Footer */}
            <div className="print-only mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="justify-between flex">
                <span>
                  <div className="w-64 border-b-2 border-dotted border-gray-500 pt-10"></div>
                  <p className="text-gray-600 mt-2">Chief Executive office</p>
                  <p className="text-gray-600 mt-2">Dennis Oduro Akomeah</p>
                </span>
                <span>
                  <div className="w-64 border-b-2 border-dotted border-gray-500 pt-10"></div>
                  <p className="text-gray-600 mt-2">Finance Officer</p>
                  {/* <div className="w-64 border-b-2 border-dotted border-gray-500 pt-10"></div> */}
                </span>
              </div>
              <p className="mt-2">
                Report ID: {report.report_id} | Generated: {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Financial Report Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your report parameters and click "Update Report" to generate
            </p>
          </div>
        )}
      </div>

      {/* Print Section (Hidden for PDF export)
      <div ref={reportRef} className="hidden">
        {report && (
          <div className="p-8 bg-white">
            <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
                YOS Car Rentals - Financial Report
              </h1>
            </div>
          </div>
        )}
      </div> */}
    </div>
  );
}