import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/lib/store/store";
import { clearCustomerBookings, fetchCustomerById } from "@/app/lib/store/slices/customersSlice";
import {
  X,
  Calendar,
  Car,
  ReceiptCentIcon,
  Shield,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface CustomerDetailModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { customerBookings, loading } = useSelector((state: RootState) => state.customers);
  const selectedCustomer = useSelector((state: RootState) => state.customers.selectedCustomer);
  const [activeTab, setActiveTab] = useState("bookings");
  

  useEffect(() => {
    if (isOpen && (!selectedCustomer || selectedCustomer.id !== customerId)) {
      dispatch(fetchCustomerById(customerId));
    }
  }, [isOpen, customerId, selectedCustomer, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearCustomerBookings());
    }
  }, [isOpen, dispatch]);

  if (!isOpen || !selectedCustomer) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partially_paid":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLoyaltyIcon = (tier: string) => {
    switch (tier) {
      case "diamond":
        return <Award className="w-5 h-5 text-purple-500" />;
      case "platinum":
        return <Award className="w-5 h-5 text-blue-500" />;
      case "gold":
        return <Award className="w-5 h-5 text-yellow-500" />;
      case "silver":
        return <Award className="w-5 h-5 text-gray-400" />;
      case "bronze":
        return <Award className="w-5 h-5 text-orange-700" />;
      default:
        return <Award className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="inset-0 bg-opacity-75 transition-opacity"
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full bg-white dark:bg-gray-800">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {selectedCustomer.first_name.charAt(0)}
                  {selectedCustomer.last_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedCustomer.full_name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {getLoyaltyIcon(selectedCustomer.loyalty_tier)}
                  <span className="ml-2 font-medium">
                    {selectedCustomer.loyalty_tier_display}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-red-800 dark:hover:bg-red-700 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6">
              {["bookings", "guarantors", "details"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    py-3 px-4 font-medium text-sm transition-colors border-b-2
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

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {/* Bookings Tab */}
            {activeTab === "bookings" && (
              <div>
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">Total Bookings</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                      {selectedCustomer.total_bookings}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <ReceiptCentIcon className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                      ¢{selectedCustomer.total_spent.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-yellow-500 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">Avg. Booking</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                      ¢{selectedCustomer.total_bookings > 0
                        ? (selectedCustomer.total_spent / selectedCustomer.total_bookings).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-purple-500 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">Last Booking</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white mt-2">
                      {selectedCustomer.last_booking
                        ? new Date(selectedCustomer.last_booking).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading bookings...</p>
                  </div>
                ) : customerBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Booking ID
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Dates
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Vehicle
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Payment
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                            Guarantor
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <td className="py-3 px-4">
                              <div className="text-sm font-mono text-gray-600 dark:text-gray-300">
                                {booking.id.slice(0, 8)}...
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                <div className="font-medium">
                                  {new Date(booking.start_date).toLocaleDateString()}
                                </div>
                                <div className="text-gray-500">
                                  to {new Date(booking.end_date).toLocaleDateString()}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {booking.car_details ? (
                                <div className="flex items-center">
                                  <Car className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="font-medium">
                                    {booking.car_details.make} {booking.car_details.model}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">Unknown</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              ¢{booking.total_amount?.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col space-y-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                                  {booking.payment_status_display}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {booking.payment_method_display}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status_display}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="group relative">
                                <button className="text-blue-600 hover:text-blue-800 text-sm">
                                  {booking.guarantor_name}
                                </button>
                                {/* Guarantor Tooltip */}
                                <div className="hidden group-hover:block absolute z-10 w-64 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <User className="w-4 h-4 text-gray-400 mr-2" />
                                      <span className="font-medium">{booking.guarantor_name}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                      <span className="text-sm">Phone: {booking.guarantor_name === "No guarantor" ? "N/A" : "Contact customer"}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Shield className="w-4 h-4 text-gray-400 mr-2" />
                                      <span className="text-sm">Relationship: {booking.guarantor_name === "No guarantor" ? "N/A" : "Not specified"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No Bookings Found
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      This customer hasn't made any bookings yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Guarantors Tab */}
            {activeTab === "guarantors" && (
              <div>
                {selectedCustomer.guarantors && Array.isArray(selectedCustomer.guarantors) && selectedCustomer.guarantors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCustomer.guarantors.map((guarantor) => (
                      <div
                        key={guarantor.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <h4 className="font-bold text-gray-800 dark:text-white">
                                {guarantor.full_name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {guarantor.relationship || "Guarantor"}
                              </p>
                            </div>
                          </div>
                          <Shield className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {guarantor.email || "No email"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {guarantor.phone}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-gray-700 dark:text-gray-300">
                              Ghana Card: {guarantor.ghana_card_id || "Not provided"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {guarantor.address_city}, {guarantor.address_region}
                            </span>
                          </div>
                          {guarantor.occupation && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-3" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {guarantor.occupation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No Guarantors Found
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      This customer hasn't added any guarantors yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Personal Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Full Name</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.full_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phone</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.phone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Ghana Card ID</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.ghana_card_id || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Driver Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">License ID</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.driver_license_id || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">License Class</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.driver_license_class || "Not provided"}
                        </span>
                      </div>
                      {selectedCustomer.driver_license_expiry_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">License Expiry</span>
                          <span className={`font-medium ${new Date(selectedCustomer.driver_license_expiry_date) < new Date()
                            ? "text-red-600"
                            : "text-green-600"
                            }`}>
                            {new Date(selectedCustomer.driver_license_expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Address & Preferences
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Occupation</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.occupation || "Not specified"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Location</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.address_city}, {selectedCustomer.address_region}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">GPS Address</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.gps_address || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Preferred Vehicle</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedCustomer.preferred_vehicle_type || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Communication Preferences
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email Notifications</span>
                        {selectedCustomer.communication_preferences?.email ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">SMS Notifications</span>
                        {selectedCustomer.communication_preferences?.sms ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Phone Calls</span>
                        {selectedCustomer.communication_preferences?.phone ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;