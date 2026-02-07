"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    ReceiptCentIcon,
    Wrench,
    Shield,
    Plus,
    AlertTriangle,
    RefreshCw,
    Info,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface CarDetailContentProps {
    car: any;
}

export default function CarDetailContent({ car }: CarDetailContentProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    const insurancePolicies = car.insurance_policies || [];
    const maintenanceRecords = car.maintenance_records || [];
    const bookings = car.bookings || [];
    const timelineEvents = car.timeline_events || [];
    const analyticsData = car.analytics_data || {};

    // Get monthly data for charts
    const monthlyData = analyticsData.monthly_data || [];
    const performanceMetrics = analyticsData.performance_metrics || {};
    const summary = analyticsData.summary || {};

    // Get alias for frontend compatibility
    const registrationDate = car.purchase_date || car.created_at;

    const getInsuranceStatus = (endDate: string) => {
        const today = new Date();
        const end = new Date(endDate);
        const daysRemaining = Math.ceil(
            (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining < 0)
            return { status: "expired", color: "bg-red-500", text: "Expired" };
        if (daysRemaining < 30)
            return {
                status: "warning",
                color: "bg-yellow-500",
                text: "Expiring Soon",
            };
        return { status: "active", color: "bg-green-500", text: "Active" };
    };

    const getEventIcon = (iconName: string) => {
        const iconMap: { [key: string]: any } = {
            'wrench': <Wrench className="w-4 h-4" />,
            'shield': <Shield className="w-4 h-4" />,
            'alert-triangle': <AlertTriangle className="w-4 h-4" />,
            'refresh-cw': <RefreshCw className="w-4 h-4" />,
            'calendar': <Calendar className="w-4 h-4" />,
            'cedi-sign': <ReceiptCentIcon className="w-4 h-4" />,
            'info': <Info className="w-4 h-4" />,
        };
        return iconMap[iconName] || <Info className="w-4 h-4" />;
    };

    const getEventColor = (eventType: string) => {
        const colorMap: { [key: string]: string } = {
            'maintenance': 'bg-yellow-500',
            'insurance': 'bg-blue-500',
            'booking': 'bg-green-500',
            'accident': 'bg-red-500',
            'status_change': 'bg-purple-500',
            'event': 'bg-gray-500',
            'revenue': 'bg-green-600',
        };
        return colorMap[eventType] || 'bg-gray-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {car.make} {car.model} ({car.year})
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Vehicle ID: {car.id} • Registered:{" "}
                            {new Date(registrationDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                {/* <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Edit className="w-4 h-4 inline mr-2" />
                        Edit
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Plus className="w-4 h-4 inline mr-2" />
                        Add Event
                    </button>
                </div> */}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                    {[
                        "overview",
                        "analytics",
                        "maintenance",
                        "insurance",
                        "bookings",
                    ].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                }
              `}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === "overview" && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Vehicle Timeline
                            </h3>
                            {timelineEvents.length > 0 ? (
                                <div className="space-y-4">
                                    {timelineEvents.map((event: any, index: number) => (
                                        <div key={event.id} className="flex items-start space-x-4">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.event_type)} text-white`}
                                                >
                                                    {getEventIcon(event.icon)}
                                                </div>
                                                {index < timelineEvents.length - 1 && (
                                                    <div className="w-px h-full bg-gray-300 dark:bg-gray-600 mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium text-gray-800 dark:text-white">
                                                        {event.title}
                                                    </h4>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(event.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                                    {event.description}
                                                </p>
                                                {event.amount && (
                                                    <p className="text-sm font-medium mt-1">
                                                        Amount:{" "}
                                                        <span className="text-blue-600">¢{event.amount.toLocaleString()}</span>
                                                    </p>
                                                )}
                                                {event.cost && (
                                                    <p className="text-sm font-medium mt-1">
                                                        Cost:{" "}
                                                        <span className="text-yellow-600">¢{event.cost.toLocaleString()}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No timeline events found</p>
                            )}
                        </div>
                    )}

                    {/* Analytics Charts */}
                    {activeTab === "analytics" && (
                        <>
                            {/* Revenue vs Bookings Chart */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                    Monthly Revenue vs Bookings
                                </h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="month_short" stroke="#9CA3AF" />
                                            <YAxis yAxisId="left" stroke="#9CA3AF" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#1F2937",
                                                    border: "1px solid #374151",
                                                    borderRadius: "0.5rem",
                                                }}
                                                labelStyle={{ color: "#F3F4F6" }}
                                            />
                                            <Legend />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="revenue"
                                                name="Revenue (¢)"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="bookings"
                                                name="Bookings"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                        Performance Metrics
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Utilization Rate</span>
                                            <span className="font-medium text-blue-600">
                                                {performanceMetrics.utilization_rate?.toFixed(1) || 0}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Revenue Growth</span>
                                            <span className={`font-medium ${performanceMetrics.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {performanceMetrics.revenue_growth?.toFixed(1) || 0}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Booking Growth</span>
                                            <span className={`font-medium ${performanceMetrics.booking_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {performanceMetrics.booking_growth?.toFixed(1) || 0}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Avg. Booking Value</span>
                                            <span className="font-medium text-green-600">
                                                ¢{summary.average_revenue_per_booking?.toFixed(2) || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                        Monthly Performance
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={monthlyData.slice(-6)}> {/* Last 6 months */}
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis dataKey="month_short" stroke="#9CA3AF" />
                                                <YAxis stroke="#9CA3AF" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#1F2937",
                                                        border: "1px solid #374151",
                                                        borderRadius: "0.5rem",
                                                    }}
                                                    labelStyle={{ color: "#F3F4F6" }}
                                                />
                                                <Bar
                                                    dataKey="revenue"
                                                    name="Revenue"
                                                    fill="#10B981"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <Bar
                                                    dataKey="bookings"
                                                    name="Bookings"
                                                    fill="#3B82F6"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}


                    {/* Maintenance Records */}
                    {activeTab === "maintenance" && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Maintenance Records
                                </h3>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    Add Record
                                </button>
                            </div>
                            {maintenanceRecords.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Date
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Type
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Description
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Cost
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Garage
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {maintenanceRecords.map((record: any) => (
                                                <tr
                                                    key={record.id}
                                                    className="border-b border-gray-100 dark:border-gray-700"
                                                >
                                                    <td className="py-3 px-4">
                                                        {new Date(record.date || record.start_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">{record.type}</td>
                                                    <td className="py-3 px-4">{record.description}</td>
                                                    <td className="py-3 px-4 font-medium">
                                                        ¢{record.cost}
                                                    </td>
                                                    <td className="py-3 px-4">{record.garage || "N/A"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No maintenance records found</p>
                            )}
                        </div>
                    )}

                    {/* Insurance Policies */}
                    {activeTab === "insurance" && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Insurance Policies
                                </h3>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    Add Policy
                                </button>
                            </div>
                            {insurancePolicies.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {insurancePolicies.map((policy: any) => {
                                        const status = getInsuranceStatus(policy.endDate || policy.end_date);
                                        return (
                                            <div
                                                key={policy.id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-800 dark:text-white">
                                                        {policy.provider || policy.insurance_company}
                                                    </h4>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} text-white`}
                                                    >
                                                        {status.text}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            Policy #
                                                        </span>
                                                        <span className="font-medium">
                                                            {policy.policyNumber || policy.policy_number}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            Coverage
                                                        </span>
                                                        <span className="font-medium">
                                                            {new Date(policy.startDate || policy.start_date).toLocaleDateString()} -{" "}
                                                            {new Date(policy.endDate || policy.end_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            Insurance Amount
                                                        </span>
                                                        <span className="font-medium">
                                                            ¢{policy.insurance_amount}/year
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No insurance policies found</p>
                            )}
                        </div>
                    )}

                    {/* Bookings */}
                    {activeTab === "bookings" && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Booking History
                            </h3>
                            {bookings.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Customer
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Period
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Duration
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Amount
                                                </th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map((booking: any) => (
                                                <tr
                                                    key={booking.id}
                                                    className="border-b border-gray-100 dark:border-gray-700"
                                                >
                                                    <td className="py-3 px-4">{booking.customerName || "Unknown"}</td>
                                                    <td className="py-3 px-4">
                                                        {new Date(booking.startDate || booking.start_date).toLocaleDateString()} -{" "}
                                                        {new Date(booking.endDate || booking.end_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {Math.ceil(
                                                            (new Date(booking.endDate || booking.end_date).getTime() -
                                                                new Date(booking.startDate || booking.start_date).getTime()) /
                                                            (1000 * 60 * 60 * 24)
                                                        )}{" "}
                                                        days
                                                    </td>
                                                    <td className="py-3 px-4 font-medium">
                                                        ¢{booking.totalAmount || booking.total_amount}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span
                                                            className={`
                              px-2 py-1 rounded-full text-xs font-medium
                              ${booking.status === "completed"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : ""
                                                                }
                              ${booking.status === "active"
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : ""
                                                                }
                              ${booking.status === "cancelled"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : ""
                                                                }
                            `}
                                                        >
                                                            {booking.status.charAt(0).toUpperCase() +
                                                                booking.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No booking history found</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    {/* Car Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Vehicle Summary
                            </h3>
                            <div
                                className="w-8 h-8 rounded"
                                style={{ backgroundColor: car.color || car.color_hex }}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Status</span>
                                <span
                                    className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${car.status === "available"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : ""
                                        }
                  ${car.status === "rented"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                            : ""
                                        }
                  ${car.status === "maintenance"
                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                            : ""
                                        }
                `}
                                >
                                    {car.status_display || car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Total Bookings
                                </span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {bookings.length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Mileage
                                </span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {car.mileage?.toLocaleString()} km
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Fuel Type
                                </span>
                                <span className="font-medium text-gray-800 dark:text-white">
                                    {car.fuel_type_display || car.fuel_type}
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Financial Summary
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <ReceiptCentIcon className="w-5 h-5 text-green-500 mr-2" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Total Revenue
                                    </span>
                                </div>
                                <span className="font-bold text-green-600">
                                    ¢{(car.total_revenue || 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Wrench className="w-5 h-5 text-yellow-500 mr-2" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Total Expenses
                                    </span>
                                </div>
                                <span className="font-bold text-yellow-600">
                                    ¢{(car.total_expenses || 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-800 dark:text-white font-medium">
                                        Net Profit
                                    </span>
                                    <span
                                        className={`font-bold ${(car.total_revenue || 0) - (car.total_expenses || 0) >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                            }`}
                                    >
                                        ¢
                                        {Math.abs(
                                            (car.total_revenue || 0) - (car.total_expenses || 0)
                                        ).toLocaleString()}
                                        {(car.total_revenue || 0) - (car.total_expenses || 0) >= 0
                                            ? " Profit"
                                            : " Loss"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}