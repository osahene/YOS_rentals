// components/SideNav.tsx
"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../lib/store/store";
import { setCurrentPage, setSidebar } from "../../lib/store/slices/uiSlice";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarDays,
  UserCog,
  Menu,
  X,
  ChevronRight,
  Settings,
  Bell,
  HelpCircle,
} from "lucide-react";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  { id: "cars", label: "Cars", icon: Car, path: "/dashboard/cars" },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    path: "/dashboard/customers",
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: CalendarDays,
    path: "/dashboard/bookings",
  },
  { id: "staff", label: "Staff", icon: UserCog, path: "/dashboard/staff" },
];

export default function SideNav() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, currentPage } = useSelector(
    (state: RootState) => state.ui
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleNavigation = (item: (typeof navItems)[0]) => {
    dispatch(setCurrentPage(item.id));
    router.push(item.path);
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          w-64 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700
          lg:translate-x-0
        `}
      >
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              DriveOn
            </span>
          </div>
          <button
            onClick={() => dispatch(setSidebar(!sidebarOpen))}
            className="hidden lg:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                sidebarOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    active
                      ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-white" : "text-current"
                  }`}
                />
                <span className="font-medium">{item.label}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <button className="flex items-center space-x-3 w-full px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button className="flex items-center space-x-3 w-full px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Help & Support</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>
    </>
  );
}
