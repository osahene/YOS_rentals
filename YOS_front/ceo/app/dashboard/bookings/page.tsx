"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays,
  TrendingUp,
  ReceiptCent,
  Car,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Printer,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import MetricsGrid from "@/app/components/homepage/MetricsGrid";
import BookingModal from "./bookingModal/BookingModal";
import {
  fetchDashboardMetrics,
  fetchBookingTrends,
  fetchBookings,
  fetchBookingById,
  setSelectedBooking,
  selectBookings,
  selectDashboardMetrics,
  selectBookingTrends,
  selectBookingsLoading,
  selectBookingsFilters,
  selectBookingsPagination,
  selectFilteredBookings,
} from "../../lib/store/slices/bookingsSlice";
import { RootState, AppDispatch } from "../../lib/store/store";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "active":
    case "confirmed":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "cancelled":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

export default function BookingsPage() {
    const dispatch = useDispatch<AppDispatch>();
  const [dateRange, setDateRange] = useState("month");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Select data from Redux store
  const bookings = useSelector(selectFilteredBookings);
  const dashboardMetrics = useSelector(selectDashboardMetrics);
  const bookingTrends = useSelector(selectBookingTrends);
  const loading = useSelector(selectBookingsLoading);
  const pagination = useSelector(selectBookingsPagination);
  const selectedBooking = useSelector((state: RootState) => state.bookings.selectedBooking);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);
  
  useEffect(() => {
    fetchBookingsData();
  }, [statusFilter, currentPage]);
  
  const fetchDashboardData = async () => {
    const daysMap: Record<string, number> = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };
    const days = daysMap[dateRange] || 30;
    const monthsMap: Record<string, number> = {
      week: 1,
      month: 3,
      quarter: 6,
      year: 12
    };
    const months = monthsMap[dateRange] || 3;
    
    await Promise.all([
      dispatch(fetchDashboardMetrics({ days })),
      dispatch(fetchBookingTrends({ months }))
    ]);
  };
  
  const fetchBookingsData = async () => {
    const params: any = {
      page: currentPage,
      page_size: 10
    };
    
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    
    await dispatch(fetchBookings(params));
  };
  
  const handleViewDetails = async (bookingId: string) => {
    const result = await dispatch(fetchBookingById(bookingId));
    if (fetchBookingById.fulfilled.match(result)) {
      setIsModalOpen(true);
    }
  };
  
  const handleExportData = () => {
    const exportData = bookings.map(booking => ({
      'Booking ID': booking.id,
      'Customer': `${booking.customer.first_name} ${booking.customer.last_name}`,
      'Vehicle': `${booking.car.make} ${booking.car.model}`,
      'Start Date': booking.start_date,
      'End Date': booking.end_date,
      'Pickup Location': booking.pickup_location,
      'Amount': booking.total_amount,
      'Status': booking.status,
      'Payment Status': booking.payment_status
    }));
    
    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const bookingMetrics = [
    {
      title: "Total Bookings",
      value: dashboardMetrics.total_bookings.toLocaleString(),
      change: "",
      icon: CalendarDays,
      color: "bg-blue-600",
      loading: loading
    },
    {
      title: "Active Bookings",
      value: dashboardMetrics.active_bookings.toString(),
      change: "",
      icon: Clock,
      color: "bg-blue-600",
      loading: loading
    },
    {
      title: "Revenue",
      value: formatCurrency(dashboardMetrics.revenue),
      change: "",
      icon: ReceiptCent,
      color: "bg-blue-600",
      loading: loading
    },
    {
      title: "Cancellation",
      value: dashboardMetrics.cancelled.toString(),
      change: "",
      icon: TrendingUp,
      color: "bg-blue-600",
      loading: loading
    },
  ];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Booking Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage all rental bookings
          </p>
        </div>
        {fetchBookingsData.length > 0 && (
          
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExportData}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
        )}
      </div>
      
      {/* Stats */}
      <MetricsGrid metrics={bookingMetrics} />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Booking Trends
            </h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrends.chart_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Vehicle Type Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Vehicle Type Distribution
            </h3>
            <Car className="w-6 h-6 text-gray-400" />
          </div>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingTrends.vehicle_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookingTrends.vehicle_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
      {/* Bookings List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Recent Bookings
            </h3>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No bookings found
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Booking ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Vehicle
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Period
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {booking.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">
                        {booking.customer.first_name} {booking.customer.last_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Car className="w-4 h-4 text-gray-400 mr-2" />
                          {booking.car_details.make} {booking.car_details.model}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{new Date(booking.start_date).toLocaleDateString()}</div>
                          <div className="text-gray-500">to</div>
                          <div>{new Date(booking.end_date).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                          {booking.pickup_location || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(booking.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getStatusIcon(booking.status)}
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'completed'
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : booking.status === 'active' || booking.status === 'confirmed'
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : booking.status === 'pending'
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewDetails(booking.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} bookings
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNumber;
                      if (pagination.totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNumber = pagination.totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 rounded-lg ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            dispatch(setSelectedBooking(null));
          }}
          booking={selectedBooking}
        />
      )}
    </div>
  );
}