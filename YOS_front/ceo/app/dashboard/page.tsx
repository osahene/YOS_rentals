"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MetricsGrid from "../components/homepage/MetricsGrid";
import ChartsSection from "../components/homepage/ChartsSection";
import RecentBookings from "../components/homepage/Bookings";
import CarAnalytics from "../components/homepage/Analytics";
import { LuUser, LuDollarSign, LuCar, LuCalendar, LuTrendingUp } from "react-icons/lu";
import apiService from "../utils/APIPaths";
import type { DashboardData } from "../lib/store/types/dashboard";

gsap.registerPlugin(ScrollTrigger);

// Helper function to calculate growth percentage
const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthRates, setGrowthRates] = useState({
    customers: 12.5,
    revenue: 8.3,
    cars: 5.2,
    bookings: 22,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiService.fetchDashboardData();
        console.log(data)
        setDashboardData(data);

        if (data.trends && data.trends.length >= 2) {
          const lastMonth = data.trends[data.trends.length - 1];
          const prevMonth = data.trends[data.trends.length - 2];
          
          setGrowthRates({
            customers: 12.5, // Would need customer trends data
            revenue: calculateGrowth(lastMonth.revenue, prevMonth.revenue),
            cars: 5.2, // Would need car availability trends
            bookings: calculateGrowth(lastMonth.bookings, prevMonth.bookings),
          });
        }
      } catch (err: any) {
        console.error("Error loading dashboard data:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
        
        // Fallback to mock data if API fails
        // setDashboardData(getMockDashboardData());
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && dashboardData) {
      // Initialize GSAP animations
      gsap.from(".metric-card", {
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Parallax effect for background elements
      gsap.to(".parallax-bg", {
        y: () => -ScrollTrigger.maxScroll(window) * 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    }
  }, [loading, dashboardData]);

  // Transform data for metrics grid
  const metrics = dashboardData ? [
    {
      title: "Active Customers",
      value: dashboardData.metrics.active_customers.toLocaleString(),
      change: `${growthRates.customers >= 0 ? '+' : ''}${growthRates.customers.toFixed(1)}%`,
      icon: LuUser,
      color: "from-blue-500 to-cyan-500",
      trendIcon: LuTrendingUp,
      trendColor: growthRates.customers >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Revenue (30 days)",
      value: `¢${dashboardData.metrics.revenue.toLocaleString()}`,
      change: `${growthRates.revenue >= 0 ? '+' : ''}${growthRates.revenue.toFixed(1)}%`,
      icon: LuDollarSign,
      color: "from-green-500 to-emerald-500",
      trendIcon: LuTrendingUp,
      trendColor: growthRates.revenue >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Available Cars",
      value: dashboardData.metrics.available_cars.toLocaleString(),
      change: `${growthRates.cars >= 0 ? '+' : ''}${growthRates.cars.toFixed(1)}%`,
      icon: LuCar,
      color: "from-purple-500 to-pink-500",
      trendIcon: LuTrendingUp,
      trendColor: growthRates.cars >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Recent Bookings",
      value: dashboardData.metrics.recent_bookings.toLocaleString(),
      change: `${growthRates.bookings >= 0 ? '+' : ''}${growthRates.bookings.toFixed(1)}%`,
      icon: LuCalendar,
      color: "from-orange-500 to-red-500",
      trendIcon: LuTrendingUp,
      trendColor: growthRates.bookings >= 0 ? "text-green-500" : "text-red-500",
    },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <div className="text-red-600 dark:text-red-400">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} >
     
      <div className="relative z-10">
        <header className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights into your car rental business
          </p>
        </header>

        <main className="p-6 space-y-6">
          {/* Key Metrics */}
          <MetricsGrid metrics={metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              {dashboardData && (
                <ChartsSection 
                  revenueData={dashboardData.trends}
                  dailyData={dashboardData.dailyBookings}
                  carDistribution={dashboardData.carDistribution}
                  topCars={dashboardData.topCars}
                />
              )}
            </div>

            {/* Right Column - Analytics and Additional Info */}
            <div className="space-y-6">
              {/* Car Analytics - Using real top car data */}
              {dashboardData?.topCars && dashboardData.topCars.length > 0 && (
                <CarAnalytics topCar={dashboardData.topCars[0]} />
              )}
              
              {/* Booking Status Summary */}
              {dashboardData?.bookingStatus && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Booking Status
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(dashboardData.bookingStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {status}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {String(count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings Table */}
          {dashboardData && (
            <RecentBookings bookings={dashboardData.recentBookings} />
          )}
        </main>
      </div>
    </div>
  );
}

// Fallback mock data function
// function getMockDashboardData(): DashboardData {
//   return {
//     metrics: {
//       active_customers: 1240,
//       revenue: 87200,
//       available_cars: 45,
//       recent_bookings: 1245,
//     },
//     bookingStatus: {
//       active: 15,
//       pending: 8,
//       completed: 120,
//       cancelled: 12,
//     },
//     carStatus: {
//       Available: 45,
//       Rented: 25,
//       'Under Maintenance': 8,
//       'Insurance Expired': 2,
//     },
//     trends: Array.from({ length: 12 }, (_, i) => ({
//       month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
//       month_full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i] + ' 2024',
//       revenue: 50000 + Math.random() * 50000,
//       bookings: 800 + Math.random() * 400,
//     })),
//     recentBookings: Array.from({ length: 10 }, (_, i) => ({
//       id: `B-2024-${String(i + 1).padStart(3, '0')}`,
//       customer: ['John Doe', 'Sarah Lee', 'Mark Smith', 'David Kim', 'Emma Wilson'][i % 5],
//       vehicle: ['Tesla Model 3', 'Ford Explorer', 'BMW 5 Series', 'Toyota Camry', 'Honda Civic'][i % 5],
//       pickup: '21 Sep 2024',
//       return: '25 Sep 2024',
//       location: ['Dhaka Airport', 'Bawari', 'Oakthan', 'Diaumondi', 'Mirpur'][i % 5],
//       status: ['active', 'pending', 'completed', 'cancelled', 'active'][i % 5] as any,
//       payment_status: ['paid', 'pending', 'paid', 'cancelled', 'paid'][i % 5],
//       total_amount: 150 + Math.random() * 350,
//     })),
//     carDistribution: [
//       { name: 'Petrol', value: 45, count: 45, color: '#3B82F6' },
//       { name: 'Diesel', value: 25, count: 25, color: '#8B5CF6' },
//       { name: 'Electric', value: 15, count: 15, color: '#10B981' },
//       { name: 'Hybrid', value: 15, count: 15, color: '#EF4444' },
//     ],
//     dailyBookings: Array.from({ length: 7 }, (_, i) => ({
//       day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
//       full_day: `2024-09-${String(14 + i).padStart(2, '0')}`,
//       bookings: 30 + Math.random() * 40,
//     })),
//     topCars: Array.from({ length: 5 }, (_, i) => ({
//       id: `car-${i + 1}`,
//       name: ['Tesla Model 3', 'BMW 5 Series', 'Ford Explorer', 'Toyota Camry', 'Honda Civic'][i],
//       license_plate: [`ABC-${100 + i}`, `XYZ-${200 + i}`, `DEF-${300 + i}`, `GHI-${400 + i}`, `JKL-${500 + i}`][i],
//       revenue: 15000 + Math.random() * 20000,
//       bookings: 45 + Math.random() * 30,
//       status: ['Available', 'Rented', 'Available', 'Under Maintenance', 'Available'][i],
//       color: ['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B'][i],
//     })),
//   };
// }