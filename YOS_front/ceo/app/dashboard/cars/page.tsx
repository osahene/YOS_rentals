"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../lib/store/store";
import { setSelectedCar } from "../../lib/store/slices/carsSlice";
import { useRouter } from "next/navigation";
import {
  Plus,
  Car,
  TrendingUp,
  DollarSign,
  Wrench,
  Star,
  MoreVertical,
  Filter,
  Search,
} from "lucide-react";

export default function CarsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { cars } = useSelector((state: RootState) => state.cars);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.color.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === "all" || filter === car.status;

    return matchesSearch && matchesFilter;
  });

  const handleCarClick = (car: (typeof cars)[0]) => {
    dispatch(setSelectedCar(car));
    router.push(`/dashboard/cars/${car.id}`);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600 dark:text-green-400";
    if (profit < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  // Calculate totals
  const totalRevenue = cars.reduce((sum, car) => sum + car.totalRevenue, 0);
  const totalExpenses = cars.reduce((sum, car) => sum + car.totalExpenses, 0);
  const maintenanceCount = cars.filter(
    (car) => car.status === "maintenance"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Fleet Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your rental fleet and vehicle information
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/cars/new")}
          className="inline-flex items-center px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5 mr-2" />
          Register a New Car
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Cars
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {cars.length}
              </p>
            </div>
            <Car className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                $ {totalRevenue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Under Maintenance
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {maintenanceCount}
              </p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-500" />
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
              placeholder="Search cars by make, model, or color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.map((car) => {
          const profit = car.totalRevenue - car.totalExpenses;
          const backgroundColor = car.color || "#3B82F6";

          return (
            <div
              key={car.id}
              onClick={() => handleCarClick(car)}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Car Color Background */}
              <div className="h-32 w-full" style={{ backgroundColor }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Car Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {car.make} {car.model}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {car.year}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Revenue
                    </p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      ${car.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expenses
                    </p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      ${car.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Profit */}
                <div
                  className={`text-center p-3 rounded-lg mb-4 ${
                    profit >= 0
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Net Profit
                  </p>
                  <p className={`text-xl font-bold ${getProfitColor(profit)}`}>
                    ${Math.abs(profit).toLocaleString()}{" "}
                    {profit >= 0 ? "Profit" : "Loss"}
                  </p>
                </div>

                {/* Rating and Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(car.rating)
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {car.rating.toFixed(1)}
                    </span>
                  </div>
                  <span
                    className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${
                      car.status === "available"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : ""
                    }
                    ${
                      car.status === "rented"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : ""
                    }
                    ${
                      car.status === "maintenance"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : ""
                    }
                    ${
                      car.status === "retired"
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        : ""
                    }
                  `}
                  >
                    {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCars.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            No cars found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Register your first car to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
