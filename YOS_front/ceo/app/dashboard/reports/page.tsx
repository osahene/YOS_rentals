"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/store/store";
import { ReportGenerator } from "../../lib/store/types/reportGenerator";
import {
  FinancialStatement,
  MonthlyReportData,
} from "../../lib/store/types/reports";
import {
  FaFilePdf,
  FaPrint,
  FaChartLine,
  FaChartBar,
  FaCalendarAlt,
  FaCar,
  FaMoneyBillWave,
  FaCalculator,
  FaEye,
  FaFileExcel,
} from "react-icons/fa";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartOptions,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Import jsPDF and html2canvas for PDF generation
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportPage() {
  const { cars } = useSelector((state: RootState) => state.cars);
  const reportRef = useRef<HTMLDivElement>(null);

  const [reportType, setReportType] = useState<"monthly" | "annual">("monthly");
  const [period, setPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [financialStatement, setFinancialStatement] =
    useState<FinancialStatement | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(true);

  // Initialize report generator
  const reportGenerator = useMemo(() => {
    return new ReportGenerator(cars, period, reportType);
  }, [cars, period, reportType]);

  // Generate report on initial load or when filters change
  const generateReport = useCallback(() => {
    setLoading(true);

    setTimeout(() => {
      const statement = reportGenerator.generateFinancialStatement(
        selectedVehicle === "all" ? undefined : selectedVehicle
      );
      setFinancialStatement(statement);

      const monthlyReport = reportGenerator.generateMonthlyReport();
      setMonthlyData(monthlyReport);

      setLoading(false);
    }, 500);
  }, [selectedVehicle, reportGenerator]);
  useEffect(() => {
    generateReport();
  }, [reportType, period, generateReport, selectedVehicle]);

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;

    setLoading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`financial-report-${period}-${reportType}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //   const handlePrint = () => {
  //     window.print();
  //   };

  const handleExportExcel = () => {
    if (!financialStatement) return;

    // Create CSV content
    const csvContent = [
      ["Financial Report", "Value"],
      ["Report Type", reportType],
      ["Period", period],
      [
        "Generated At",
        new Date(financialStatement.generatedAt).toLocaleString(),
      ],
      ["", ""],
      ["Financial Summary", ""],
      [
        "Total Revenue",
        `$${financialStatement.summary.total_revenue.toLocaleString()}`,
      ],
      [
        "Total Expenses",
        `$${financialStatement.summary.total_expenses.toLocaleString()}`,
      ],
      [
        "Net Profit",
        `$${financialStatement.summary.netProfit.toLocaleString()}`,
      ],
      [
        "Profit Margin",
        `${financialStatement.summary.profitMargin.toFixed(2)}%`,
      ],
      ["ROI", `${financialStatement.summary.roi.toFixed(2)}%`],
      [
        "Utilization Rate",
        `${financialStatement.summary.utilizationRate.toFixed(2)}%`,
      ],
      ["", ""],
      ["Income Statement", ""],
      [
        "Rental Income",
        `$${financialStatement.incomeStatement.revenue.rentalIncome.toLocaleString()}`,
      ],
      [
        "Other Income",
        `$${financialStatement.incomeStatement.revenue.otherIncome.toLocaleString()}`,
      ],
      [
        "Total Revenue",
        `$${financialStatement.incomeStatement.revenue.totalRevenue.toLocaleString()}`,
      ],
      ["", ""],
      ["Expense Breakdown", ""],
      [
        "Maintenance",
        `$${financialStatement.incomeStatement.expenses.maintenance.toLocaleString()}`,
      ],
      [
        "Insurance",
        `$${financialStatement.incomeStatement.expenses.insurance.toLocaleString()}`,
      ],
      [
        "Fuel",
        `$${financialStatement.incomeStatement.expenses.fuel.toLocaleString()}`,
      ],
      [
        "Other",
        `$${financialStatement.incomeStatement.expenses.other.toLocaleString()}`,
      ],
      [
        "Depreciation",
        `$${financialStatement.incomeStatement.expenses.depreciation.toLocaleString()}`,
      ],
      [
        "Total Expenses",
        `$${financialStatement.incomeStatement.expenses.totalExpenses.toLocaleString()}`,
      ],
      ["", ""],
      [
        "Net Income",
        `$${financialStatement.incomeStatement.netIncome.toLocaleString()}`,
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `financial-report-${period}-${reportType}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart configurations
  const monthlyRevenueChartData = {
    labels: monthlyData.map((m) => m.month),
    datasets: [
      {
        label: "Revenue",
        data: monthlyData.map((m) => m.revenue),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: monthlyData.map((m) => m.expenses.total),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const expensePieChartData = financialStatement
    ? {
        labels: ["Maintenance", "Insurance", "Fuel", "Other", "Depreciation"],
        datasets: [
          {
            data: [
              financialStatement.incomeStatement.expenses.maintenance,
              financialStatement.incomeStatement.expenses.insurance,
              financialStatement.incomeStatement.expenses.fuel,
              financialStatement.incomeStatement.expenses.other,
              financialStatement.incomeStatement.expenses.depreciation,
            ],
            backgroundColor: [
              "rgb(59, 130, 246)",
              "rgb(16, 185, 129)",
              "rgb(245, 158, 11)",
              "rgb(139, 92, 246)",
              "rgb(239, 68, 68)",
            ],
            borderWidth: 1,
          },
        ],
      }
    : null;

  const monthlyChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          // Replace 'any' with TooltipItem
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `$${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Replace 'any' with number | string
          callback: function (value: number | string) {
            const numValue = Number(value);
            return `$${
              numValue >= 1000 ? (numValue / 1000).toFixed(1) + "k" : numValue
            }`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Generating report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financial Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate detailed financial reports and performance analysis
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleGeneratePDF}
            disabled={!financialStatement}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaFilePdf className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!financialStatement}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaFileExcel className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setReportType("monthly")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                  reportType === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <FaCalendarAlt className="inline mr-2" />
                Monthly
              </button>
              <button
                onClick={() => setReportType("annual")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                  reportType === "annual"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <FaChartBar className="inline mr-2" />
                Annual
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {reportType === "monthly" ? "Month" : "Year"}
            </label>
            {reportType === "monthly" ? (
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              />
            ) : (
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Vehicle Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
            >
              <option value="all">All Vehicles</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model} ({car.year})
                </option>
              ))}
            </select>
          </div>

          {/* Chart Toggle */}
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`block w-14 h-8 rounded-full ${
                    includeCharts
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                    includeCharts ? "transform translate-x-6" : ""
                  }`}
                ></div>
              </div>
              <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                <FaChartLine className="inline mr-2" />
                Include Charts
              </div>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={generateReport}
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 flex items-center"
          >
            <FaCalculator className="w-5 h-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Preview Toggle */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2 inline-flex">
          <button
            onClick={() => setPreviewMode(true)}
            className={`px-4 py-2 rounded-md flex items-center ${
              previewMode
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <FaEye className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={() => setPreviewMode(false)}
            className={`px-4 py-2 rounded-md flex items-center ${
              !previewMode
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            <FaPrint className="w-4 h-4 mr-2" />
            Print View
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {financialStatement && (
        <div
          ref={reportRef}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${
            previewMode ? "p-8" : "p-12"
          } border border-gray-200 dark:border-gray-700`}
          style={
            previewMode
              ? {}
              : { minHeight: "297mm", background: "white", color: "black" }
          }
        >
          {/* Report Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedVehicle === "all"
                    ? "Fleet"
                    : cars.find((c) => c.id === selectedVehicle)?.make +
                      " " +
                      cars.find((c) => c.id === selectedVehicle)?.model}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Financial Performance Report
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Generated:{" "}
                  {new Date(
                    financialStatement.generatedAt
                  ).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Period:{" "}
                  {reportType === "monthly"
                    ? new Date(period + "-01").toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    : `Year ${period}`}
                </p>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              FINANCIAL REPORT
            </h1>
            <div className="h-1 w-24 bg-blue-600 mx-auto"></div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${financialStatement.summary.total_revenue.toLocaleString()}
                  </p>
                </div>
                <FaMoneyBillWave className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Net Profit
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${financialStatement.summary.netProfit.toLocaleString()}
                  </p>
                </div>
                <FaChartLine className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Profit Margin
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {financialStatement.summary.profitMargin.toFixed(2)}%
                  </p>
                </div>
                <FaCalculator className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-linear-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ROI
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {financialStatement.summary.roi.toFixed(2)}%
                  </p>
                </div>
                <FaCar className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Income Statement */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b">
              Income Statement
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                  Revenue
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Rental Income
                    </span>
                    <span className="font-medium text-green-600">
                      $
                      {financialStatement.incomeStatement.revenue.rentalIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Other Income
                    </span>
                    <span className="font-medium text-green-600">
                      $
                      {financialStatement.incomeStatement.revenue.otherIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="font-semibold">Total Revenue</span>
                    <span className="font-bold text-green-700">
                      $
                      {financialStatement.incomeStatement.revenue.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                  Expenses
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Maintenance
                    </span>
                    <span className="font-medium text-red-600">
                      $
                      {financialStatement.incomeStatement.expenses.maintenance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Insurance
                    </span>
                    <span className="font-medium text-red-600">
                      $
                      {financialStatement.incomeStatement.expenses.insurance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Fuel
                    </span>
                    <span className="font-medium text-red-600">
                      $
                      {financialStatement.incomeStatement.expenses.fuel.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Other
                    </span>
                    <span className="font-medium text-red-600">
                      $
                      {financialStatement.incomeStatement.expenses.other.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Depreciation
                    </span>
                    <span className="font-medium text-red-600">
                      $
                      {financialStatement.incomeStatement.expenses.depreciation.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="font-semibold">Total Expenses</span>
                    <span className="font-bold text-red-700">
                      $
                      {financialStatement.incomeStatement.expenses.totalExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="mt-6 p-4 bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  NET INCOME
                </span>
                <span
                  className={`text-2xl font-bold ${
                    financialStatement.incomeStatement.netIncome >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  $
                  {financialStatement.incomeStatement.netIncome.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {financialStatement.incomeStatement.netIncome >= 0
                  ? "✅ PROFIT"
                  : "⚠️ LOSS"}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {includeCharts && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b">
                Financial Analysis
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue vs Expenses */}
                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                    Monthly Revenue vs Expenses (Last 12 Months)
                  </h4>
                  <div className="h-64">
                    <Line
                      data={monthlyRevenueChartData}
                      options={monthlyChartOptions}
                    />
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                    Expense Breakdown
                  </h4>
                  <div className="h-64">
                    {expensePieChartData && <Pie data={expensePieChartData} />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Performance */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b">
              Vehicle Performance Breakdown
            </h3>

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
                      Expenses
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Profit
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Margin
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {financialStatement.detailedBreakdown.byVehicle?.map(
                    (vehicle) => {
                      const profitMargin =
                        vehicle.revenue > 0
                          ? (vehicle.profit / vehicle.revenue) * 100
                          : 0;
                      return (
                        <tr
                          key={vehicle.vehicleId}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.vehicleId}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-green-600">
                            ${vehicle.revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-red-600">
                            ${vehicle.expenses.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <span
                              className={
                                vehicle.profit >= 0
                                  ? "text-green-700"
                                  : "text-red-700"
                              }
                            >
                              ${vehicle.profit.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-medium ${
                                profitMargin >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {profitMargin.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {/* Calculate utilization rate for this vehicle */}
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (vehicle.profit / 10000) * 100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Capital Expenditure */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b">
              Capital Expenditure Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                      Total Investment
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      $
                      {cars
                        .reduce((sum, car) => sum + (car.purchasePrice ?? 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <FaMoneyBillWave className="w-8 h-8 text-indigo-500" />
                </div>
              </div>

              <div className="bg-linear-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-600 dark:text-cyan-400">
                      Current Value
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      $
                      {cars
                        .reduce((sum, car) => sum + (car.currentValue || 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <FaChartLine className="w-8 h-8 text-cyan-500" />
                </div>
              </div>

              <div className="bg-linear-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-rose-600 dark:text-rose-400">
                      Accumulated Depreciation
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      $
                      {(
                        cars.reduce(
                          (sum, car) => sum + (car.purchasePrice ?? 0),
                          0
                        ) -
                        cars.reduce(
                          (sum, car) => sum + (car.currentValue || 0),
                          0
                        )
                      ).toLocaleString()}
                    </p>
                  </div>
                  <FaCalculator className="w-8 h-8 text-rose-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary & Recommendations */}
          <div className="mt-8 p-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Executive Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Key Findings
                </h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>
                      Overall{" "}
                      {financialStatement.summary.netProfit >= 0
                        ? "profitable"
                        : "unprofitable"}{" "}
                      operation
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">ℹ</span>
                    <span>
                      Utilization rate:{" "}
                      {financialStatement.summary.utilizationRate.toFixed(1)}%
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">📊</span>
                    <span>
                      ROI: {financialStatement.summary.roi.toFixed(1)}% on
                      capital investment
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Recommendations
                </h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  {financialStatement.incomeStatement.expenses.maintenance /
                    financialStatement.incomeStatement.expenses.totalExpenses >
                    0.4 && (
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">⚠</span>
                      <span>
                        Consider preventive maintenance to reduce repair costs
                      </span>
                    </li>
                  )}
                  {financialStatement.summary.utilizationRate < 60 && (
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">🚗</span>
                      <span>
                        Explore marketing strategies to increase vehicle
                        utilization
                      </span>
                    </li>
                  )}
                  {financialStatement.summary.profitMargin > 30 && (
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">💡</span>
                      <span>
                        Consider fleet expansion based on current profitability
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500">
            <p>
              This report was generated automatically by FleetPro Management
              System
            </p>
            <p className="mt-1">
              Report ID: {Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      )}

      {/* Print Instructions */}
      {previewMode && financialStatement && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <FaPrint className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                Printing Instructions
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                For best results when printing or saving as PDF:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 space-y-1 list-disc pl-5">
                <li>Switch to Print View for optimized layout</li>
                <li>Use Chrome or Edge browsers for best PDF quality</li>
                <li>Set page orientation to Portrait</li>
                <li>Check Background graphics in print settings</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
