"use client";

import { CiCircleCheck, CiClock2 } from "react-icons/ci";
import { BsArrowsExpand } from "react-icons/bs";
import { LuCircleX } from "react-icons/lu";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const bookings = [
  {
    id: "B-2025-01",
    customer: "John Doe",
    vehicle: "Tesla Model 3",
    pickup: "21 Sep 2025",
    return: "25 Sep 2025",
    location: "Dhaka Airport",
    status: "active",
    statusColor: "bg-green-100 text-green-800",
    icon: CiCircleCheck,
  },
  {
    id: "B-2025-02",
    customer: "Sarah Lee",
    vehicle: "Ford Explorer",
    pickup: "21 Sep 2025",
    return: "24 Sep 2025",
    location: "Bawari",
    status: "pending",
    statusColor: "bg-yellow-100 text-yellow-800",
    icon: CiClock2,
  },
  {
    id: "B-2025-03",
    customer: "Mark Smith",
    vehicle: "BMW 5 Series",
    pickup: "21 Sep 2025",
    return: "26 Sep 2025",
    location: "Oakthan",
    status: "cancelled",
    statusColor: "bg-red-100 text-red-800",
    icon: LuCircleX,
  },
  {
    id: "B-2025-04",
    customer: "David Lee",
    vehicle: "Tesla Model 3",
    pickup: "21 Sep 2025",
    return: "27 Sep 2025",
    location: "Diaumondi",
    status: "paid",
    statusColor: "bg-blue-100 text-blue-800",
    icon: CiCircleCheck,
  },
];

export default function RecentBookings() {
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tableRef.current) {
      gsap.from(tableRef.current.querySelectorAll("tr"), {
        duration: 0.6,
        y: 20,
        opacity: 0,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: tableRef.current,
          start: "top 80%",
        },
      });
    }
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Recent Bookings
          </h3>
          <p className="text-sm text-gray-600">Latest rental transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-sm text-green-600 font-semibold">
            <CiCircleCheck className="w-4 h-4 mr-1" />
            +1 new booking
          </span>
        </div>
      </div>

      <div ref={tableRef} className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Booking ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Customer
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Vehicle
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Pickup Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Return Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Location
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const StatusIcon = booking.icon;
              return (
                <tr
                  key={booking.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="font-mono font-semibold text-blue-600">
                      {booking.id}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium">{booking.customer}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-linear-to-r from-blue-100 to-blue-50 rounded mr-3"></div>
                      <span>{booking.vehicle}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">{booking.pickup}</td>
                  <td className="py-4 px-4">{booking.return}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {booking.location}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${booking.statusColor}`}
                    >
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <BsArrowsExpand className="w-5 h-5 text-gray-500" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <button className="w-full py-3 text-center text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors">
          View All Bookings →
        </button>
      </div>
    </div>
  );
}
