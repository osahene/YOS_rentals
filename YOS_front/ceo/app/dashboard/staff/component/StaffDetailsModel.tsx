"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    Badge,
    Banknote,
    CreditCard,
    Car,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    Edit,
    Key,
} from "lucide-react";
import {
    fetchStaffBookings,
    fetchStaffSalaryHistory,
} from "../../../lib/store/slices/staffSlice";
import { DriverBooking, SalaryPayment } from "../../../lib/store/types/staff";

interface StaffDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: any;
}

export default function StaffDetailsModal({ isOpen, onClose, staff }: StaffDetailsModalProps) {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState<'details' | 'bookings' | 'salary'>('details');
    const [bookings, setBookings] = useState<DriverBooking[]>([]);
    const [salaryHistory, setSalaryHistory] = useState<SalaryPayment[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && staff) {
            if (staff.role === 'driver' && activeTab === 'bookings') {
                fetchDriverBookings();
            }
            if (activeTab === 'salary') {
                fetchSalaryData();
            }
        }
    }, [isOpen, staff, activeTab]);

    const fetchDriverBookings = async () => {
        setLoading(true);
        try {
            const result = await dispatch(fetchStaffBookings({ id: staff.id }) as any);
            if (fetchStaffBookings.fulfilled.match(result)) {
                setBookings(result.payload.results || result.payload);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const fetchSalaryData = async () => {
        setLoading(true);
        try {
            const result = await dispatch(fetchStaffSalaryHistory({ id: staff.id }) as any);
            if (fetchStaffSalaryHistory.fulfilled.match(result)) {
                setSalaryHistory(result.payload.results || result.payload);
            }
        } catch (error) {
            console.error('Error fetching salary history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'suspended':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'terminated':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                {/* Modal panel */}
                <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                Staff Details - {staff.employee_id}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {staff.role_display} • {staff.department}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <Edit className="w-5 h-5 text-blue-500" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <Key className="w-5 h-5 text-yellow-500" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'details'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <User className="w-4 h-4 inline mr-2" />
                                Personal Details
                            </button>

                            {staff.role === 'driver' && (
                                <button
                                    onClick={() => setActiveTab('bookings')}
                                    className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'bookings'
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <Car className="w-4 h-4 inline mr-2" />
                                    Driver Bookings ({staff.completed_bookings || 0})
                                </button>
                            )}

                            <button
                                onClick={() => setActiveTab('salary')}
                                className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'salary'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Banknote className="w-4 h-4 inline mr-2" />
                                Salary History
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                                        <User className="w-5 h-5 mr-2" />
                                        Personal Information
                                    </h4>
                                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div className="flex items-center">
                                            <Badge className="w-4 h-4 mr-2 text-gray-500" />
                                            <div>
                                                <div className="font-medium">{staff.name}</div>
                                                <div className="text-sm text-gray-500">Employee ID: {staff.employee_id}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                                            <span>{staff.email}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                                            <span>{staff.phone}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                                            <div>
                                                <div className="font-medium">Employment Date</div>
                                                <div className="text-sm">
                                                    Joined: {new Date(staff.hire_date).toLocaleDateString()}
                                                    {staff.termination_date && (
                                                        <>
                                                            <br />
                                                            Terminated: {new Date(staff.termination_date).toLocaleDateString()}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                                        <Shield className="w-5 h-5 mr-2" />
                                        Employment Details
                                    </h4>
                                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Role</div>
                                                <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium ${getRoleColor(staff.role)}`}>
                                                    {staff.role_display}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Department</div>
                                                <div className="font-medium">{staff.department || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Employment Type</div>
                                                <div className="font-medium">{staff.employment_type_display}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Shift</div>
                                                <div className="font-medium">{staff.shift_display}</div>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                                            <span className={`inline-block px-3 py-1 mt-1 rounded-full text-sm font-medium ${getStatusColor(staff.status)}`}>
                                                {staff.status_display}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                                        <Banknote className="w-5 h-5 mr-2" />
                                        Financial Information
                                    </h4>
                                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Salary</div>
                                            <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                                {formatCurrency(staff.salary)}
                                            </div>
                                        </div>
                                        {staff.bank_name && (
                                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center">
                                                    <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                                                    <div>
                                                        <div className="font-medium">Bank Details</div>
                                                        <div className="text-sm">
                                                            {staff.bank_name} - {staff.account_number}
                                                            <br />
                                                            Account: {staff.account_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Driver Specific Details */}
                                {staff.role === 'driver' && (
                                    <div className="space-y-4">
                                        <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                                            <Car className="w-5 h-5 mr-2" />
                                            Driver Information
                                        </h4>
                                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            {staff.driver_license_id ? (
                                                <>
                                                    <div className="flex items-center">
                                                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                                        <div>
                                                            <div className="font-medium">Driver's License</div>
                                                            <div className="text-sm">
                                                                ID: {staff.driver_license_id}
                                                                {staff.driver_license_class && (
                                                                    <> • Class: {staff.driver_license_class}</>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
                                                            <div className="font-medium text-lg">{staff.total_bookings || 0}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                                                            <div className="font-medium text-lg text-green-600">
                                                                {staff.completed_bookings || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center text-gray-500">
                                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                                    <p>No driver license information</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                                        Driver Booking History
                                    </h4>
                                    <div className="text-sm text-gray-500">
                                        Total Completed: {staff.completed_bookings || 0}
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-500">Loading bookings...</p>
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-gray-500">No bookings found for this driver</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Booking ID
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Customer
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Vehicle
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Period
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Amount
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookings.map((booking) => (
                                                    <tr
                                                        key={booking.id}
                                                        className="border-b border-gray-100 dark:border-gray-700"
                                                    >
                                                        <td className="py-2 px-3 font-mono text-sm">
                                                            {booking.id.substring(0, 8)}...
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <div className="font-medium">
                                                                {booking.customer_name}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <div className="text-sm">
                                                                {booking.car_details.make} {booking.car_details.model}
                                                                <div className="text-xs text-gray-500">
                                                                    {booking.car_details.license_plate}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <div className="text-sm">
                                                                {new Date(booking.start_date).toLocaleDateString()}
                                                                <div className="text-xs text-gray-500">to</div>
                                                                {new Date(booking.end_date).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3 font-medium">
                                                            {formatCurrency(booking.total_amount)}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${booking.status === 'completed'
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    : booking.status === 'active'
                                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                                }`}>
                                                                {booking.status === 'completed' ? (
                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                ) : booking.status === 'active' ? (
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                ) : (
                                                                    <XCircle className="w-3 h-3 mr-1" />
                                                                )}
                                                                {booking.status_display}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'salary' && (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                                        Salary Payment History
                                    </h4>
                                    <div className="text-sm text-gray-500">
                                        Total Paid: {formatCurrency(staff.total_salary_paid || 0)}
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-500">Loading salary history...</p>
                                    </div>
                                ) : salaryHistory.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-gray-500">No salary payments found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Month
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Basic Salary
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Overtime
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Bonuses
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Deductions
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Net Salary
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Status
                                                    </th>
                                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                        Payment Date
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salaryHistory.map((payment) => (
                                                    <tr
                                                        key={payment.id}
                                                        className="border-b border-gray-100 dark:border-gray-700"
                                                    >
                                                        <td className="py-2 px-3">
                                                            <div className="font-medium">
                                                                {new Date(payment.month).toLocaleDateString('en-US', {
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {formatCurrency(payment.basic_salary)}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {payment.overtime ? formatCurrency(payment.overtime) : '-'}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {payment.bonuses ? formatCurrency(payment.bonuses) : '-'}
                                                        </td>
                                                        <td className="py-2 px-3 text-red-600">
                                                            {payment.deductions ? formatCurrency(payment.deductions) : '-'}
                                                        </td>
                                                        <td className="py-2 px-3 font-medium text-green-600">
                                                            {formatCurrency(payment.net_salary)}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${payment.is_paid
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                                }`}>
                                                                {payment.is_paid ? 'Paid' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 text-sm">
                                                            {payment.payment_date
                                                                ? new Date(payment.payment_date).toLocaleDateString()
                                                                : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
                        >
                            Close
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                            <Download className="w-4 h-4 inline mr-2" />
                            Export Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}