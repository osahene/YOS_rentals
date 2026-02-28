"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../lib/store/store";
import { fetchCars, updateCar, deleteCar, fetchCarById } from "../../lib/store/slices/carsSlice";
import { useRouter } from "next/navigation";
import MetricsGrid from "@/app/components/homepage/MetricsGrid";
import {
  Plus,
  Car,
  TrendingUp,
  Wrench,
  Filter,
  Search,
  ReceiptCent,
  X,
  Upload,
  AlertTriangle,
} from "lucide-react";
import type { Car as CarType, CarFormData } from "@/app/lib/store/types/car";

export default function CarsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { cars, loading, error } = useSelector((state: RootState) => state.cars);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [detailedCar, setDetailedCar] = useState<CarType | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [imagesToKeep, setImagesToKeep] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState<Partial<CarFormData>>({});
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchCars());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);


  useEffect(() => {
    if (isDeleteModalOpen && selectedCar) {
      dispatch(fetchCarById(selectedCar.id)).then((action) => {
        if (action.payload) {
          setDetailedCar(action.payload as CarType);
        }
      });
    } else {
      setDetailedCar(null);
    }
  }, [isDeleteModalOpen, selectedCar, dispatch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setNewImagePreviews(previews);
    }
  };

  // Open edit modal and pre‑fill form
  const handleEditClick = (car: CarType) => {
    setSelectedCar(car);
    // Map Car to CarFormData (excluding insurance fields)
    setEditFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      color: car.color,
      license_plate: car.license_plate || "",
      vin: car.vin || "",
      purchase_price: car.purchasePrice || 0,    // adjust if property name differs
      purchase_date: car.registrationDate || new Date().toISOString().split("T")[0],
      car_type: car.car_type || "",
      fuel_type: car.fuel_type || "petrol",
      transmission: car.transmission || "automatic",
      seats: car.seats || 5,
      mileage: car.mileage || 0,
      features: car.features || [],
      description: car.description || "",
      // images are handled separately via existingImages in the UI
    });
    setImagesToKeep(car.images || []);
    setNewImages([]);
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (car: CarType) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  // Close modals and reset state
  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedCar(null);
    setEditFormData({});
    setNewImages([]);
    setImagesToKeep([]);
    setNewImagePreviews([]);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) return;

    // Build FormData
    const formData = new FormData();
    Object.entries(editFormData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Append images_to_keep as a JSON string
    formData.append('images_to_keep', JSON.stringify(imagesToKeep));

    // Append new images
    newImages.forEach((file) => {
      formData.append("new_images", file);
    });

    // Dispatch update action
    await dispatch(updateCar({ id: selectedCar.id, carData: formData as any }));
    closeModals();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedCar) return;
    setDeleting(true);
    await dispatch(deleteCar(selectedCar.id));
    setDeleting(false);
    closeModals();
  };



  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.color.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === "all" || filter === car.status;

    return matchesSearch && matchesFilter;
  });

  const handleCarClick = (car: (typeof cars)[0]) => {
    router.push(`/dashboard/cars/${car.id}`);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600 dark:text-green-400";
    if (profit < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  // Calculate totals
  const totalRevenue = cars.reduce((sum, car) => sum + Number(car.total_revenue), 0);
  const totalExpenses = cars.reduce((sum, car) => sum + Number(car.total_expenses), 0);
  const maintenanceCount = cars.filter((car) => car.status === "maintenance").length;

  const carMetrics = [
    {
      title: "Total Cars",
      value: cars.length,
      change: "0%",
      icon: Car,
      color: "from-pink-500 to-rose-500",
    },
    {
      title: "Total Revenue",
      value: totalRevenue,
      change: "",
      icon: TrendingUp,
      color: "from-blue-500 to-indigo-500",
    },
    {
      title: "Total Expenses",
      value: `¢${totalExpenses.toLocaleString()}`,
      change: "",
      icon: ReceiptCent,
      color: "from-red-500 to-orange-500",
    },
    {
      title: "Under Maintenance",
      value: maintenanceCount,
      change: "",
      icon: Wrench,
      color: "from-yellow-500 to-amber-500",
    },
  ];
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
      <MetricsGrid metrics={carMetrics} />

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
          const profit = car.total_revenue - car.total_expenses;
          const backgroundColor = car.color || "#3B82F6";

          return (
            <div
              key={car.id}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Car Color Background */}
              <div className="h-32 w-full relative overflow-hidden" style={{ backgroundColor }}>
                {car.images && car.images.length > 0 ? (
                  <img
                    src={car.images[0]} // Using the first image URL from your Django /media/
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                )}
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
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Revenue
                    </p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      ¢{car.total_revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expenses
                    </p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      ¢{car.total_expenses.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Profit */}
                <div
                  className={`text-center p-3 rounded-lg mb-4 ${profit >= 0
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-red-50 dark:bg-red-900/20"
                    }`}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Net Profit
                  </p>
                  <p className={`text-xl font-bold ${getProfitColor(profit)}`}>
                    ¢{Math.abs(profit).toLocaleString()}{" "}
                    {profit >= 0 ? "Profit" : "Loss"}
                  </p>
                </div>
                <div className="my-4">
                  <button
                    onClick={() => handleCarClick(car)}
                    className="w-full bg-gray-600 cursor-pointer  dark:text-white py-2 rounded-lg  transition font-medium ">
                    View Details
                  </button>
                </div>

                {/* Rating and Status */}
                <div className="flex items-center justify-between">
                  {/* <div className="flex items-center space-x-1">
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
                  </div> */}
                  <span
                    className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${car.status === "available"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : ""
                      }
                    ${car.status === "rented"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : ""
                      }
                    ${car.status === "maintenance"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : ""
                      }
                    ${car.status === "retired"
                        ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        : ""
                      }
                  `}
                  >
                    {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                  </span>

                  <button
                    onClick={() => handleEditClick(car)}
                    className="flex cursor-pointer text-center bg-blue-700 hover:bg-blue-400 px-6 py-2 rounded-lg"
                  >
                    <span className="text-sm text-white">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(car)}
                    className="flex cursor-pointer text-center bg-red-600 hover:bg-red-400 px-6 py-2 rounded-lg"
                  >
                    <span className="text-sm text-white">Delete</span>
                  </button>
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

      {/* Edit Modal */}
      {isEditModalOpen && selectedCar && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="inset-0 transition-opacity" aria-hidden="true">
              <div className="inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleEditSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Edit Car
                    </h3>
                    <button
                      type="button"
                      onClick={closeModals}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Form fields (similar to registration, excluding insurance) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Make */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Make
                      </label>
                      <input
                        type="text"
                        value={editFormData.make || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, make: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    {/* Model */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Model
                      </label>
                      <input
                        type="text"
                        value={editFormData.model || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, model: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    {/* Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Year
                      </label>
                      <input
                        type="number"
                        value={editFormData.year || new Date().getFullYear()}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            year: parseInt(e.target.value),
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Color
                      </label>
                      <input
                        type="color"
                        value={editFormData.color || "#3B82F6"}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, color: e.target.value })
                        }
                        className="mt-1 block w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                      />
                    </div>
                    {/* License Plate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        License Plate
                      </label>
                      <input
                        type="text"
                        value={editFormData.license_plate || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, license_plate: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    {/* VIN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        VIN
                      </label>
                      <input
                        type="text"
                        value={editFormData.vin || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, vin: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    {/* Purchase Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Purchase Price
                      </label>
                      <input
                        type="number"
                        value={editFormData.purchase_price || 0}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            purchase_price: parseFloat(e.target.value),
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    {/* Purchase Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.purchase_date || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, purchase_date: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    {/* Car Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Car Type
                      </label>
                      <input
                        type="text"
                        value={editFormData.car_type || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, car_type: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    {/* Fuel Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fuel Type
                      </label>
                      <select
                        value={editFormData.fuel_type || "petrol"}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            fuel_type: e.target.value as CarFormData["fuel_type"],
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    {/* Transmission */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Transmission
                      </label>
                      <select
                        value={editFormData.transmission || "automatic"}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            transmission: e.target.value as CarFormData["transmission"],
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    {/* Seats */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Seats
                      </label>
                      <input
                        type="number"
                        value={editFormData.seats || 5}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, seats: parseInt(e.target.value) })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        min="1"
                        required
                      />
                    </div>
                    {/* Mileage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mileage (km)
                      </label>
                      <input
                        type="number"
                        value={editFormData.mileage || 0}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, mileage: parseInt(e.target.value) })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        min="0"
                        required
                      />
                    </div>
                    {/* Features (simplified: comma separated) */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Features (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editFormData.features?.join(", ") || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            features: e.target.value.split(",").map((f) => f.trim()),
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    {/* Description */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <textarea
                        value={editFormData.description || ""}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, description: e.target.value })
                        }
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Existing Images */}
                  {/* {selectedCar.images && selectedCar.images.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Existing Images
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCar.images.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Car ${idx}`}
                            className="w-20 h-20 object-cover rounded border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )} */}

                  {/* Existing Images with delete option */}
                  {imagesToKeep.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Images (click ✕ to remove)
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {imagesToKeep.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={url}
                              alt={`Car ${idx}`}
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                            <button
                              type="button"
                              onClick={() => setImagesToKeep(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Preview */}
                  {newImagePreviews.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Images to Upload
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {newImagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={preview}
                              alt={`New ${idx}`}
                              className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setNewImages(prev => prev.filter((_, i) => i !== idx));
                                setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Upload */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Add New Images
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedCar && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className=" inset-0 transition-opacity" aria-hidden="true">
              <div className="inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Car
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold">
                          {selectedCar.make} {selectedCar.model} ({selectedCar.license_plate})
                        </span>
                        ? This action cannot be undone and the following data will be permanently lost:
                      </p>
                      {detailedCar ? (
                        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <li className="flex justify-between">
                            <span>Maintenance records:</span>
                            <span className="font-medium">{detailedCar.maintenanceRecords?.length || 0}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Insurance policies:</span>
                            <span className="font-medium">{detailedCar.insurancePolicies?.length || 0}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Bookings:</span>
                            <span className="font-medium">{detailedCar.bookings?.length || 0}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Timeline events:</span>
                            <span className="font-medium">{detailedCar.timelineEvents?.length || 0}</span>
                          </li>
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">Loading associated data...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={closeModals}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
