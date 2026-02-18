"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../lib/store/store";
import { toggleDarkMode, toggleSidebar } from "../../lib/store/slices/uiSlice";
import { usePathname } from "next/navigation";
import { Bell, Search, User, Moon, Sun, Menu, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard Overview",
  cars: "Fleet Management",
  customers: "Customer Management",
  bookings: "Booking Management",
  staff: "Staff Management",
  report: "Operations Report",
};

interface Notification {
  id: string;
  title: string;
  message: string;
  time: Date;
  type: "booking" | "maintenance" | "payment";
  read: boolean;
}

export default function Header() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const { darkMode } = useSelector((state: RootState) => state.ui);
  const { first_name, last_name, email } = useSelector((state: RootState) => state.auth);

  const currentPage = pathname?.split("/").pop() || "dashboard";
  const title = pageTitles[currentPage] || "Dashboard";

  const [notifications, setNotifications] = useState<Notification[]>([
    // {
    //   id: "1",
    //   title: "New Booking",
    //   message: "Customer booked Tesla Model 3 for 3 days",
    //   time: new Date(),
    //   type: "booking",
    //   read: false,
    // },
    // {
    //   id: "2",
    //   title: "New Booking",
    //   message: "Customer booked Tesla Model 3 for 3 days",
    //   time: new Date(),
    //   type: "booking",
    //   read: false,
    // },
  ]);
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Super Admin Panel
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="p-2 bg-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {darkMode ? (
              <Sun className="w-6 h-6 text-yellow-500" />
            ) : (
              <Moon className="w-6 h-6 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {unreadCount > 0 && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                {notifications
                  .filter((n) => !n.read)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(notification.time, "h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <div
                        className={`inline-flex px-2 py-1 rounded text-xs mt-2 ${notification.type === "booking"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : notification.type === "maintenance"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                              : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          }`}
                      >
                        {notification.type}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {first_name} {last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {email}
              </p>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
