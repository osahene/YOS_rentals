"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserPlus,
  Shield,
  BadgeCheck,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  Eye,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  Car,
  UserX,
} from "lucide-react";
import MetricsGrid from "@/app/components/homepage/MetricsGrid";
import {
  fetchStaff,
  fetchStaffById,
  deleteStaff,
  suspendStaff,
  terminateStaff,
  reactivateStaff,
  fetchStaffDashboardMetrics,
  fetchDriverPerformance,
  setSelectedStaff,
  selectDashboardMetrics,
  selectDriverPerformance,
  selectStaffLoading,
  selectStaffFilters,
  selectStaffSearchTerm,
  selectFilteredStaff,
  selectStaffPagination,
  setSearchTerm,
  setFilter,

} from "../../lib/store/slices/staffSlice";
import { RootState, AppDispatch} from "../../lib/store/store";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Modal Components
import AddStaffModal from "./component/AddStaffModal";
import StaffDetailsModal from "./component/StaffDetailsModel";
import ActionConfirmationModal from "./component/ActionConfirmationModal";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function StaffPage() {
  const dispatch = useDispatch<AppDispatch>();

  // State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showStaffDetailsModal, setShowStaffDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'terminate' | 'delete' | 'reactivate'>('suspend');
  const [actionReason, setActionReason] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'performance'>('list');

  // Select data from Redux store
  const staff = useSelector(selectFilteredStaff);
  const dashboardMetrics = useSelector(selectDashboardMetrics);
  const driverPerformance = useSelector(selectDriverPerformance);
  const loading = useSelector(selectStaffLoading);
  const filters = useSelector(selectStaffFilters);
  const searchTerm = useSelector(selectStaffSearchTerm);
  const selectedStaff = useSelector((state: RootState) => state.staff.selectedStaff);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      dispatch(fetchStaff({}) as any),
      dispatch(fetchStaffDashboardMetrics() as any),
      dispatch(fetchDriverPerformance() as any)
    ]);
  };

  const handleSearch = (value: string) => {
    dispatch(setSearchTerm(value));
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    dispatch(setFilter({ [key]: value }));
  };

  const handleViewStaffDetails = async (staffId: string) => {
    const result = await dispatch(fetchStaffById(staffId));
    if (fetchStaffById.fulfilled.match(result)) {
      setShowStaffDetailsModal(true);
    }
  };

  const handleActionClick = (staffId: string, action: typeof actionType) => {
    setSelectedStaffId(staffId);
    setActionType(action);
    setActionReason('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedStaffId) return;

    try {
      switch (actionType) {
        case 'suspend':
          await dispatch(suspendStaff(selectedStaffId));
          break;
        case 'terminate':
          await dispatch(terminateStaff({
            id: selectedStaffId,
            data: {
              termination_date: new Date().toISOString().split('T')[0],
              reason: actionReason
            }
          }));
          break;
        case 'delete':
          await dispatch(deleteStaff(selectedStaffId));
          break;
        case 'reactivate':
          await dispatch(reactivateStaff(selectedStaffId));
          break;
      }

      setShowActionModal(false);
      setSelectedStaffId(null);
      setActionReason('');
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const toggleDriverExpansion = (driverId: string) => {
    setExpandedDriverId(expandedDriverId === driverId ? null : driverId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'driver':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'mechanic':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Prepare chart data
  const departmentChartData = dashboardMetrics?.by_department.map(dept => ({
    name: dept.department || 'Unassigned',
    value: dept.count
  })) || [];

  const roleChartData = dashboardMetrics?.by_role.map(role => ({
    name: role.role,
    value: role.count
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Staff metrics for dashboard
  const staffMetrics = [
    {
      title: "Total Staff",
      value: dashboardMetrics?.total_staff || 0,
      change: "0%",
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      loading: loading
    },
    {
      title: "Active Staff",
      value: dashboardMetrics?.active_staff || 0,
      change: "0%",
      icon: BadgeCheck,
      color: "from-green-500 to-emerald-500",
      loading: loading
    },
    {
      title: "Departments",
      value: dashboardMetrics?.by_department?.length || 0,
      change: "0%",
      icon: Shield,
      color: "from-purple-500 to-fuchsia-500",
      loading: loading
    },
    {
      title: "Drivers",
      value: dashboardMetrics?.driver_stats?.length || 0,
      change: "0%",
      icon: Car,
      color: "from-yellow-500 to-amber-500",
      loading: loading
    },
  ];

  if (loading && !staff.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Staff Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage staff members, track performance, and handle payroll
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'performance' : 'list')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
          >
            {viewMode === 'list' ? (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance View
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                List View
              </>
            )}
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="inline-flex items-center px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Register New Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <MetricsGrid metrics={staffMetrics} />

      {/* Performance Charts (Visible in both views) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Department Distribution
            </h3>
            <Shield className="w-6 h-6 text-gray-400" />
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
                    data={departmentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Role Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Role Distribution
            </h3>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Driver Performance Section */}
      {viewMode === 'performance' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Driver Performance
              </h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Sorted by Completion Rate</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {driverPerformance.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No driver performance data available</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Driver
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Total Bookings
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Completed
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Completion Rate
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Total Revenue
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Rating
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerformance.map((driver) => (
                    <React.Fragment key={driver.driver_id}>
                      <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleDriverExpansion(driver.driver_id)}
                            className="flex items-center hover:text-blue-600"
                          >
                            {expandedDriverId === driver.driver_id ? (
                              <ChevronUp className="w-4 h-4 mr-2" />
                            ) : (
                              <ChevronDown className="w-4 h-4 mr-2" />
                            )}
                            <span className="font-medium">{driver.driver_name}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-center font-medium">
                            {driver.total_bookings}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-center font-medium text-green-600">
                            {driver.completed_bookings}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(driver.completion_rate, 100)}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              {driver.completion_rate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-green-600">
                          {formatCurrency(driver.total_revenue)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i}>
                                  {i < Math.floor(driver.average_rating) ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="ml-2 text-sm">
                              {driver.average_rating.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                            {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {expandedDriverId === driver.driver_id && (
                        <tr className="bg-blue-50/50 dark:bg-blue-900/20">
                          <td colSpan={7} className="p-4">
                            <div className="pl-8">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                                    Performance Summary
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                                      <span className="font-medium">
                                        {driver.completion_rate.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Avg Revenue per Booking:</span>
                                      <span className="font-medium">
                                        {driver.completed_bookings > 0
                                          ? formatCurrency(driver.total_revenue / driver.completed_bookings)
                                          : formatCurrency(0)
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                                    Booking Stats
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Total Assigned:</span>
                                      <span className="font-medium">{driver.total_bookings}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Successfully Completed:</span>
                                      <span className="font-medium text-green-600">
                                        {driver.completed_bookings}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Pending/Cancelled:</span>
                                      <span className="font-medium text-yellow-600">
                                        {driver.total_bookings - driver.completed_bookings}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                                    Actions
                                  </h4>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleViewStaffDetails(driver.driver_id)}
                                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center justify-center"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => handleActionClick(driver.driver_id, 'suspend')}
                                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg"
                                    >
                                      Suspend
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search staff by name, email, phone, or ID..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              >
                <option value="all">All Departments</option>
                <option value="operations">Operations</option>
                <option value="finance">Finance</option>
                <option value="maintenance">Maintenance</option>
                <option value="it">IT</option>
                <option value="hr">HR</option>
                <option value="marketing">Marketing</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="driver">Driver</option>
                <option value="manager">Manager</option>
                <option value="mechanic">Mechanic</option>
                <option value="admin">Administrator</option>
                <option value="finance">Finance Officer</option>
                <option value="other">Other</option>
              </select>

              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Staff Members ({staff.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Printer className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {staff.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No staff members found</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">Try a different search term</p>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Staff Member
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Contact
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Join Date
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
                    {staff.map((staffMember) => (
                      <tr
                        key={staffMember.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {staffMember.name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-800 dark:text-white">
                                {staffMember.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {staffMember.employee_id}
                              </div>
                              {staffMember.role === 'driver' && staffMember.completed_bookings && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {staffMember.completed_bookings} completed bookings
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="truncate max-w-37.5">{staffMember.email}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              {staffMember.phone}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(staffMember.role)}`}>
                            {staffMember.role_display}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Shield className="w-4 h-4 text-gray-400 mr-2" />
                            {staffMember.department || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(staffMember.hire_date)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(staffMember.status)}`}>
                            {staffMember.status_display}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewStaffDetails(staffMember.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </button>

                            <button
                              onClick={() => handleActionClick(staffMember.id, 'suspend')}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              title="Suspend"
                              disabled={staffMember.status === 'suspended' || staffMember.status === 'terminated'}
                            >
                              <AlertCircle className={`w-4 h-4 ${staffMember.status === 'suspended' || staffMember.status === 'terminated'
                                  ? 'text-gray-400'
                                  : 'text-yellow-500'
                                }`} />
                            </button>

                            <button
                              onClick={() => handleActionClick(staffMember.id, 'terminate')}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              title="Terminate"
                              disabled={staffMember.status === 'terminated'}
                            >
                              <UserX className={`w-4 h-4 ${staffMember.status === 'terminated'
                                  ? 'text-gray-400'
                                  : 'text-red-500'
                                }`} />
                            </button>

                            <button
                              onClick={() => handleActionClick(staffMember.id, 'delete')}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onSuccess={() => {
          setShowAddStaffModal(false);
          fetchData();
        }}
      />

      {selectedStaff && (
        <StaffDetailsModal
          isOpen={showStaffDetailsModal}
          onClose={() => {
            setShowStaffDetailsModal(false);
            dispatch(setSelectedStaff(null));
          }}
          staff={selectedStaff}
        />
      )}

      <ActionConfirmationModal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedStaffId(null);
          setActionReason('');
        }}
        onConfirm={confirmAction}
        actionType={actionType}
        reason={actionReason}
        onReasonChange={setActionReason}
      />
    </div>
  );
}