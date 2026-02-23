"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/lib/store/store";
import {
  fetchCustomers,
  setSearchTerm,
  setFilter,
  selectFilteredCustomers,
  selectCustomersFilters,
  selectCustomersSearchTerm,
  sendBulkMessage,
} from "@/app/lib/store/slices/customersSlice";
import {
  Users,
  Star,
  Crown,
  Award,
  Trophy,
  Medal,
  Mail,
  MessageSquare,
  Filter,
  Search,
  Phone,
  Calendar,
  TrendingUp,
  Eye,
} from "lucide-react";
import MetricsGrid from "@/app/components/homepage/MetricsGrid";
import CustomerDetailModal from "./customerDetail/CustomerDetailModal";

export default function CustomersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"sms" | "email">("sms");
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Get data from Redux
  const { customers, loading, error } = useSelector((state: RootState) => state.customers);
  const filteredCustomers = useSelector(selectFilteredCustomers);
  const filters = useSelector(selectCustomersFilters);
  const searchTerm = useSelector(selectCustomersSearchTerm);

  // Fetch customers on component mount
  useEffect(() => {
    dispatch(fetchCustomers(customers));
  }, [dispatch]);

  const getBadgeIcon = (tier: string) => {
    switch (tier) {
      case "diamond":
        return <Crown className="w-5 h-5 text-purple-500" />;
      case "platinum":
        return <Award className="w-5 h-5 text-blue-500" />;
      case "gold":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "silver":
        return <Medal className="w-5 h-5 text-gray-400" />;
      case "bronze":
        return <Medal className="w-5 h-5 text-orange-700" />;
      default:
        return null;
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map((c) => c.id));
    }
  };

  const handleSelectCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter((cId) => cId !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      await dispatch(sendBulkMessage({
        customerIds: selectedCustomers,
        message,
        type: messageType,
      })).unwrap();

      alert("Message sent successfully!");
      setMessage("");
      setSelectedCustomers([]);
    } catch (error: any) {
      alert(`Failed to send message: ${error}`);
    }
  };

  const handleViewDetails = (customerId: string) => {
    setDetailCustomerId(customerId);
    setIsDetailModalOpen(true);
  };

  const customerMetrics = [
    {
      title: "Total Customers",
      value: customers.length,
      change: "0%",
      icon: Users,
      color: "from-pink-500 to-rose-500",
    },
    {
      title: "Active Customers",
      value: customers.filter(c => c.status === 'active').length,
      change: "+3%",
      icon: Users,
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "VIP Customers",
      value: customers.filter(c => ['gold', 'platinum', 'diamond'].includes(c.loyalty_tier)).length,
      change: "+5%",
      icon: Star,
      color: "from-red-500 to-orange-500",
    },
    {
      title: "Avg. Bookings",
      value: customers.length > 0 
        ? (customers.reduce((sum, c) => sum + Number(c.total_bookings), 0) / customers.length).toFixed(1)
        : "0.0",
      change: "6%",
      icon: TrendingUp,
      color: "from-yellow-500 to-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Customer Detail Modal */}
      {detailCustomerId && (
        <CustomerDetailModal
          customerId={detailCustomerId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailCustomerId(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Customer Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customer relationships and communications
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Stats */}
      <MetricsGrid metrics={customerMetrics} />

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => dispatch(setSearchTerm(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filters.status}
            onChange={(e) => dispatch(setFilter({ status: e.target.value }))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={filters.loyalty_tier}
            onChange={(e) => dispatch(setFilter({ loyalty_tier: e.target.value }))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
            <option value="diamond">Diamond</option>
          </select>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Customer List
          </h3>
          {loading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Contact
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Total Bookings
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Total Spent
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Last Booking
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-800 mr-2 dark:text-white">
                            {customer.full_name}
                          </span>
                          {customer.loyalty_tier && (
                            <div
                              className="ml-2"
                              title={`${customer.loyalty_tier_display} Tier`}
                            >
                              {getBadgeIcon(customer.loyalty_tier)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {customer.occupation || "No occupation"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium">
                        {customer.total_bookings}
                      </span>
                      {customer.total_bookings >= 5 && (
                        <Star className="w-4 h-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ¢{customer.total_spent.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {customer.last_booking
                      ? new Date(customer.last_booking).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }
                      `}
                    >
                      {customer.status_display}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewDetails(customer.id)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                No customers found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || Object.values(filters).some(v => v !== 'all' && v !== 0)
                  ? "Try adjusting your search or filters"
                  : "No customers in the system yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Message Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Broadcast Message
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Selected: {selectedCustomers.length} customers
          </div>
        </div>

        <div className="space-y-4">
          {/* Message Type Selection */}
          <div className="flex space-x-4">
            <button
              onClick={() => setMessageType("sms")}
              className={`flex-1 py-3 px-4 rounded-lg border ${
                messageType === "sms"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <MessageSquare
                className={`w-5 h-5 mx-auto mb-2 ${
                  messageType === "sms" ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <span
                className={`font-medium ${
                  messageType === "sms"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                SMS Message
              </span>
            </button>
            <button
              onClick={() => setMessageType("email")}
              className={`flex-1 py-3 px-4 rounded-lg border ${
                messageType === "email"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <Mail
                className={`w-5 h-5 mx-auto mb-2 ${
                  messageType === "email" ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <span
                className={`font-medium ${
                  messageType === "email"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Email Message
              </span>
            </button>
          </div>

          {/* Message Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compose Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Type your ${
                messageType === "sms" ? "SMS" : "email"
              } message here...`}
              rows={4}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {message.length} characters
              </span>
              {messageType === "sms" && (
                <span className="text-sm text-gray-500">
                  {Math.ceil(message.length / 160)} SMS
                </span>
              )}
            </div>
          </div>

          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Special offer: 20% off your next booking!",
                "Thank you for being a loyal customer!",
                "New luxury cars available for booking.",
                "Maintenance reminder for your current rental.",
              ].map((template) => (
                <button
                  key={template}
                  onClick={() => setMessage(template)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                message.trim()
                  ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Mail className="w-5 h-5 inline mr-2" />
              Send {messageType === "sms" ? "SMS" : "Email"} to{" "}
              {selectedCustomers.length > 0
                ? `${selectedCustomers.length} Selected Customers`
                : "All Customers"}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              {selectedCustomers.length === 0
                ? "Message will be sent to all customers"
                : `Message will be sent to ${selectedCustomers.length} selected customers`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}