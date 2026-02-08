"use client";

import { CiCircleCheck, CiClock2 } from "react-icons/ci";
import { BsArrowsExpand } from "react-icons/bs";
import { LuCircleX } from "react-icons/lu";
import { useState } from "react";

interface Booking {
  id: string;
  customer: string;
  vehicle: string;
  pickup: string;
  return: string;
  location: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  payment_status: string;
  total_amount: number;
}

interface RecentBookingsProps {
  bookings: Booking[];
}

export default function RecentBookings({ bookings }: RecentBookingsProps) {
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const getStatusInfo = (status: string, paymentStatus: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          icon: CiCircleCheck,
          text: 'Active'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          icon: CiClock2,
          text: 'Pending'
        };
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          icon: CiCircleCheck,
          text: 'Completed'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          icon: LuCircleX,
          text: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
          icon: CiClock2,
          text: status
        };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'partially_paid':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Recent Bookings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Latest rental transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-sm text-green-600 dark:text-green-400 font-semibold">
            <CiCircleCheck className="w-4 h-4 mr-1" />
            {bookings.filter(b => b.status === 'active').length} active
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
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
                Dates
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Amount
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Payment
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const statusInfo = getStatusInfo(booking.status, booking.payment_status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <tr
                  key={booking.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-4 px-4">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {booking.id}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-800 dark:text-white">
                    {booking.customer}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="text-sm">{booking.vehicle}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm">Pickup: {booking.pickup}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Return: {booking.return}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold">
                      ${booking.total_amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-sm font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                      {booking.payment_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button 
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                    >
                      <BsArrowsExpand className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <button className="w-full py-3 text-center text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
          View All Bookings →
        </button>
      </div>
    </div>
  );
}