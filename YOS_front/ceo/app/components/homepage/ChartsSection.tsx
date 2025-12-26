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
// Fixed imports
import { FiPieChart, FiBarChart } from "react-icons/fi";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

// Register GSAP Plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const revenueData = [
  { month: "Jan", revenue: 65000, bookings: 980 },
  { month: "Feb", revenue: 72000, bookings: 1050 },
  { month: "Mar", revenue: 82000, bookings: 1200 },
  { month: "Apr", revenue: 78000, bookings: 1100 },
  { month: "May", revenue: 87200, bookings: 1245 },
  { month: "Jun", revenue: 92000, bookings: 1350 },
];

const carTypeData = [
  { name: "Economy", value: 45, color: "#3B82F6" },
  { name: "Luxury", value: 25, color: "#8B5CF6" },
  { name: "SUV", value: 20, color: "#10B981" },
  { name: "Sports", value: 10, color: "#EF4444" },
];

export default function ChartsSection() {
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

    return () => ctx.revert(); // Cleanup GSAP to prevent memory leaks
  }, []);

  return (
    <div className="p-6">
      <div className="space-y-6" ref={chartRef}>
        {/* Revenue Trend Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Revenue Analytics
              </h3>
              <p className="text-sm text-gray-600">
                Monthly revenue and booking trends
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <LuTrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-green-600">
                +15.2% growth
              </span>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
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
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Car Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Car Type Distribution
                </h3>
                <p className="text-sm text-gray-600">
                  Fleet composition analysis
                </p>
              </div>
              <FiPieChart className="w-5 h-5 text-purple-500" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carTypeData}
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
                    {carTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Performance */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Daily Bookings
                </h3>
                <p className="text-sm text-gray-600">
                  Today{"'"}s booking performance
                </p>
              </div>
              <FiBarChart className="w-5 h-5 text-blue-500" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { hour: "9AM", bookings: 45 },
                    { hour: "12PM", bookings: 68 },
                    { hour: "3PM", bookings: 72 },
                    { hour: "6PM", bookings: 55 },
                    { hour: "9PM", bookings: 30 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Bar
                    dataKey="bookings"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Today{"'"}s Total:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  240 Bookings
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
