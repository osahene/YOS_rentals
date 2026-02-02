"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../lib/store/store";
import { setCurrentPage } from "../../lib/store/slices/uiSlice";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarDays,
  UserCog,
  Menu,
  X,
  // ChevronRight,
  Settings,
  FileBadge,
  // HelpCircle,
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
  {
    id: "report",
    label: "Reports",
    icon: FileBadge,
    path: "/dashboard/reports",
  },
  { id: "staff", label: "Staff", icon: UserCog, path: "/dashboard/staff" },
];

export default function SideNav() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
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
          fixed top-0 left-0 z-50 h-screen transition-all duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${sidebarOpen ? "w-64" : "w-16"}
          bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700
          lg:translate-x-0
        `}
      >
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                YOS Rentals
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg mx-auto" />
          )}

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path) && item.id !== "dashboard";

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`
                  w-full flex items-center ${
                    sidebarOpen
                      ? "justify-start px-4 space-x-3"
                      : "justify-center"
                  }
                  py-3 rounded-xl transition-all duration-200
                  ${
                    active
                      ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
                title={sidebarOpen ? "" : item.label}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-white" : "text-current"
                  }`}
                />
                {sidebarOpen && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <button
              className={`flex items-center ${
                sidebarOpen ? "justify-start px-4 space-x-3" : "justify-center"
              } w-full py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl`}
              title={sidebarOpen ? "" : "Settings"}
              onClick={() => router.push("/dashboard/settings")}
            >
              <Settings className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">Settings</span>}
            </button>
            {/* <button
              className={`flex items-center ${
                sidebarOpen ? "justify-start px-4 space-x-3" : "justify-center"
              } w-full py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl`}
              title={sidebarOpen ? "" : "Help & Support"}
              onClick={() => router.push("/dashboard/help")}
            >
              <HelpCircle className="w-5 h-5" />
              {sidebarOpen && (
                <span className="font-medium">Help & Support</span>
              )}
            </button> */}
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button - Only show on mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>
    </>
  );
}
