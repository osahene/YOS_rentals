// components/homepage/ChartsSection.tsx
"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LuTrendingUp } from "react-icons/lu";
import { FiPieChart, FiBarChart, FiTrendingUp } from "react-icons/fi";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

// Register GSAP Plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ChartsSectionProps {
  revenueData: Array<{
    month: string;
    month_full: string;
    revenue: number;
    bookings: number;
  }>;
  dailyData: Array<{
    day: string;
    full_day: string;
    bookings: number;
  }>;
  carDistribution: Array<{
    name: string;
    value: number;
    count: number;
    color: string;
  }>;
  topCars: Array<{
    id: string;
    name: string;
    license_plate: string;
    revenue: number;
    bookings: number;
    status: string;
    color: string;
  }>;
}

export default function ChartsSection({ revenueData, dailyData, carDistribution, topCars }: ChartsSectionProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (chartRef.current) {
        gsap.from(chartRef.current.children, {
          duration: 1,
          y: 30,
          opacity: 0,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: chartRef.current,
            start: "top 70%",
          },
        });
      }
    }, chartRef);

    return () => ctx.revert();
  }, []);

  // Calculate revenue growth
  const calculateGrowth = () => {
    if (revenueData.length < 2) return 0;
    const current = revenueData[revenueData.length - 1].revenue;
    const previous = revenueData[revenueData.length - 2].revenue;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  return (
    <div className="p-6">
      <div className="space-y-6" ref={chartRef}>
        {/* Revenue Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Revenue Analytics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Monthly revenue and booking trends
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <LuTrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-green-600">
                {calculateGrowth().toFixed(1)}% growth
              </span>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value: any) => [`¢${Number(value).toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => revenueData.find(d => d.month === label)?.month_full || label}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue (¢)"
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Bookings & Car Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Bookings */}
          <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Daily Bookings (7 Days)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Recent daily booking performance
                </p>
              </div>
              <FiBarChart className="w-5 h-5 text-blue-500" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value) => [`${value} bookings`, 'Bookings']}
                    labelFormatter={(label) => dailyData.find(d => d.day === label)?.full_day || label}
                  />
                  <Bar
                    dataKey="bookings"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name="Bookings"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Week Total:
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {dailyData.reduce((sum, day) => sum + day.bookings, 0)} Bookings
                </span>
              </div>
            </div>
          </div>

          {/* Car Type Distribution */}
          <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Fleet Composition
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Car fuel type distribution
                </p>
              </div>
              <FiPieChart className="w-5 h-5 text-purple-500" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {carDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [`${props.payload.count} cars`, props.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Performing Cars */}
        <div className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Top Performing Cars
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Highest revenue generating vehicles
              </p>
            </div>
            <FiTrendingUp className="w-5 h-5 text-green-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Vehicle
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    License Plate
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Total Revenue
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Bookings
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCars.map((car) => (
                  <tr key={car.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded mr-3"
                          style={{ backgroundColor: car.color }}
                        ></div>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {car.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm">{car.license_plate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ¢{car.revenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                        {car.bookings} bookings
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        car.status === 'Available' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {car.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}