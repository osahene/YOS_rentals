"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function CustomersPage() {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("sms");

  const customers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 234 567 8900",
      totalBookings: 12,
      totalSpent: 4500,
      lastBooking: "2023-10-15",
      status: "active",
      badge: "gold",
    },
    {
      id: "2",
      name: "Sarah Lee",
      email: "sarah@example.com",
      phone: "+1 234 567 8901",
      totalBookings: 8,
      totalSpent: 3200,
      lastBooking: "2023-10-10",
      status: "active",
      badge: "silver",
    },
    {
      id: "3",
      name: "Mark Smith",
      email: "mark@example.com",
      phone: "+1 234 567 8902",
      totalBookings: 15,
      totalSpent: 5800,
      lastBooking: "2023-10-18",
      status: "active",
      badge: "platinum",
    },
    {
      id: "4",
      name: "David Lee",
      email: "david@example.com",
      phone: "+1 234 567 8903",
      totalBookings: 5,
      totalSpent: 2100,
      lastBooking: "2023-10-05",
      status: "inactive",
      badge: null,
    },
    {
      id: "5",
      name: "Emma Wilson",
      email: "emma@example.com",
      phone: "+1 234 567 8904",
      totalBookings: 20,
      totalSpent: 8200,
      lastBooking: "2023-10-20",
      status: "active",
      badge: "diamond",
    },
  ];

  const getBadgeIcon = (badge: string | null) => {
    switch (badge) {
      case "diamond":
        return <Crown className="w-5 h-5 text-purple-500" />;
      case "platinum":
        return <Award className="w-5 h-5 text-blue-500" />;
      case "gold":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "silver":
        return <Medal className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c) => c.id));
    }
  };

  const handleSelectCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter((cId) => cId !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const recipients =
      selectedCustomers.length > 0
        ? customers.filter((c) => selectedCustomers.includes(c.id))
        : customers;

    console.log(
      `Sending ${messageType} to:`,
      recipients.map((r) => r.name)
    );
    console.log("Message:", message);

    // Reset form
    setMessage("");
    setSelectedCustomers([]);
    alert("Message sent successfully!");
  };

  return (
    <div className="space-y-6">
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                245
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Customers
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                198
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                VIP Customers
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                24
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg. Bookings
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                8.2
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="vip">VIP</option>
          </select>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Customer List
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length}
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
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
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
                        {customer.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {customer.name}
                          </span>
                          {customer.badge && (
                            <div
                              className="ml-2"
                              title={`${
                                customer.badge.charAt(0).toUpperCase() +
                                customer.badge.slice(1)
                              } Tier`}
                            >
                              {getBadgeIcon(customer.badge)}
                            </div>
                          )}
                        </div>
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
                        {customer.totalBookings}
                      </span>
                      {customer.totalBookings >= 5 && (
                        <Star className="w-4 h-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ${customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(customer.lastBooking).toLocaleDateString()}
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
                      {customer.status.charAt(0).toUpperCase() +
                        customer.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
