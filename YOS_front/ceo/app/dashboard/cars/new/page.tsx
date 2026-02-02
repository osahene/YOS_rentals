"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft,
  FaSave,
  FaUpload,
  FaCar,
  FaGasPump,
  FaCogs,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaIdCard,
  FaImage,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { AppDispatch, RootState } from "../../../lib/store/store";
import { createCar, clearError } from "../../../lib/store/slices/carsSlice";
import { CarFormData } from "../../../lib/store/types/car";

// Feature options
const FEATURE_OPTIONS = [
  "Air Conditioning",
  "Bluetooth",
  "GPS Navigation",
  "Backup Camera",
  "Sunroof",
  "Leather Seats",
  "Heated Seats",
  "Automatic Windows",
  "Keyless Entry",
  "Cruise Control",
  "USB Ports",
  "Apple CarPlay",
  "Android Auto",
  "Parking Sensors",
  "Blind Spot Monitor",
  "Lane Departure Warning",
  "Adaptive Cruise Control",
];

// Make options
const MAKE_OPTIONS = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Tesla",
  "Hyundai",
  "Kia",
  "Volkswagen",
  "Mazda",
  "Subaru",
  "Lexus",
  "Jeep",
  "Volvo",
  "Land Rover",
  "Porsche",
  "Mitsubishi",
  "Buick",
  "Cadillac",
  "Chrysler",
  "Dodge",
  "Fiat",
  "Genesis",
  "Infiniti",
  "Jaguar",
  "Lincoln",
  "Maserati",
  "Mini",
  "Ram",
  "Smart",
  "Suzuki",
];


// Color options with hex codes
const COLOR_OPTIONS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gray", hex: "#808080" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Purple", hex: "#800080" },
];

export default function RegisterNewCarPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { creating, error } = useSelector((state: RootState) => state.cars);
  
  // Form state
  const [formData, setFormData] = useState<CarFormData>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "#3B82F6",
    license_plate: "",
    vin: "",
    purchase_price: 0,
    purchase_date: new Date().toISOString().split("T")[0],
    daily_rate: 0,
    weekly_rate: 0,
    monthly_rate: 0,
    fuel_type: "petrol",
    transmission: "automatic",
    seats: 5,
    mileage: 0,
    features: [],
    description: "",
    insurance_company: "",
    policy_number: "",
    policy_type: "",
    insurance_amount: 0,
    insurance_start_date: "",
    insurance_end_date: "",
    images: [],
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextService = new Date(today);
    nextService.setMonth(nextService.getMonth() + 6);

    setFormData((prev) => ({
      ...prev,
      insurance_expiry: nextYear.toISOString().split("T")[0],
      last_service_date: today.toISOString().split("T")[0],
      next_service_date: nextService.toISOString().split("T")[0],
    }));
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" 
          ? parseFloat(value) || 0
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle feature selection
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures((prev) => {
      const newFeatures = prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature];
      
      setFormData((prevData) => ({
        ...prevData,
        features: newFeatures,
      }));
      
      return newFeatures;
    });
  };

  // Handle image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        newImages.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        };
        reader.readAsDataURL(file);
      }
    });

    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...newImages],
    }));
  };

  // Remove image
  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.make.trim()) errors.make = "Make is required";
    if (!formData.model.trim()) errors.model = "Model is required";
    if (!formData.license_plate.trim()) errors.license_plate = "License plate is required";
    if (!formData.purchase_price || formData.purchase_price <= 0) 
      errors.purchase_price = "Valid purchase price is required";
    if (!formData.daily_rate || formData.daily_rate <= 0) 
      errors.daily_rate = "Valid daily rate is required";
    if (!formData.mileage && formData.mileage !== 0) 
      errors.mileage = "Mileage is required";
    if (!formData.insurance_company) 
      errors.insurance_company = "Insurance company name is required";
    if (!formData.policy_number) 
      errors.policy_number = "Policy number is required";
    if (!formData.policy_type) 
      errors.policy_type = "Policy type is required";
    if (!formData.insurance_start_date) 
      errors.insurance_start_date = "Insurance start date is required";
    if (!formData.insurance_end_date) 
      errors.insurance_end_date = "Insurance end date is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Create FormData for file upload
    const formDataToSend = new FormData();
    
    // Append all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images" && Array.isArray(value)) {
        value.forEach((file, index) => {
          formDataToSend.append(`images`, file);
        });
      } else if (Array.isArray(value)) {
        formDataToSend.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formDataToSend.append(key, value.toString());
      }
    });

    try {
      const result = await dispatch(createCar(formDataToSend)).unwrap();
      if (result) {
        alert("Car registered successfully!");
        router.push("/dashboard/cars");
      }
    } catch (error) {
      console.error("Failed to register car:", error);
    }
  };

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Generate year options (last 40 years)
  const yearOptions = Array.from(
    { length: 40 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-gray-900">
              Register New Car
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Add a new vehicle to your rental fleet
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="shrink-0">
              <FaTimes className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaCar />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Make */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Make *
              </label>
              <select
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.make
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              >
                <option value="">Select Make</option>
                {MAKE_OPTIONS.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
              {formErrors.make && (
                <p className="mt-1 text-sm text-red-600">{formErrors.make}</p>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.model
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="e.g., Camry, Civic, Model 3"
                required
              />
              {formErrors.model && (
                <p className="mt-1 text-sm text-red-600">{formErrors.model}</p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-10 h-10 cursor-pointer rounded border border-gray-300"
                />
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {COLOR_OPTIONS.map((color) => (
                    <option key={color.name} value={color.hex}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                License Plate *
              </label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.license_plate
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="e.g., ABC-1234"
                required
              />
              {formErrors.license_plate && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.license_plate}
                </p>
              )}
            </div>

            {/* VIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chasis Number 
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="17-character CHASIS number"
                maxLength={17}
              />
            </div>
          </div>
        </motion.div>

        {/* Technical Specifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaCogs />
            Technical Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Fuel Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fuel Type *
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transmission *
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Seats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Seats *
              </label>
              <input
                type="number"
                name="seats"
                value={formData.seats}
                onChange={handleInputChange}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Mileage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mileage (km) *
              </label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.mileage
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.mileage && (
                <p className="mt-1 text-sm text-red-600">{formErrors.mileage}</p>
              )}
            </div>

            {/* Features */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Features & Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => handleFeatureToggle(feature)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      selectedFeatures.includes(feature)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {feature}
                    {selectedFeatures.includes(feature) && (
                      <FaCheck className="inline ml-2" size={12} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describe the vehicle condition, special features, etc."
              />
            </div>
          </div>
        </motion.div>

        {/* Pricing & Financial Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaMoneyBillWave />
            Pricing & Financial Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Price ($) *
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.purchase_price
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.purchase_price && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.purchase_price}
                </p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Date *
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Daily Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daily Rental Rate ($) *
              </label>
              <input
                type="number"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.daily_rate
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.daily_rate && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.daily_rate}
                </p>
              )}
            </div>

            {/* Weekly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weekly Rate ($)
              </label>
              <input
                type="number"
                name="weekly_rate"
                value={formData.weekly_rate || 0}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Monthly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Rate ($)
              </label>
              <input
                type="number"
                name="monthly_rate"
                value={formData.monthly_rate || 0}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </motion.div>

        {/* Maintenance & Insurance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaCalendarAlt />
            Initial Insurance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Last Service Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance Company Name *
              </label>
              <input
                type="text"
                name="insurance_company"
                value={formData.insurance_company}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.insurance_company
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.insurance_company && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.insurance_company}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Policy Number *
              </label>
              <input
                type="text"
                name="policy_number"
                value={formData.policy_number}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.policy_number
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.last_service_date && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.last_service_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance Policy Type *
              </label>
              
              <select
                name="policy_type"
                value={formData.policy_type}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.policy_type
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              >
                <option value="">Select Policy Type</option>
                <option value="comprehensive">Comprehensive</option>
                <option value="third-party">Third Party</option>
                <option value="liability">Liability</option>
              </select>
              {formErrors.policy_type && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.policy_type}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance Amount *
              </label>
              <input
                type="text"
                name="insurance_amount"
                value={formData.insurance_amount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.insurance_amount
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.insurance_amount && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.insurance_amount}
                </p>
              )}
            </div>

            {/* Next Service Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Policy Start Date *
              </label>
              <input
                type="date"
                name="insurance_start_date"
                value={formData.insurance_start_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.insurance_start_date
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.insurance_start_date && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.insurance_start_date}
                </p>
              )}
            </div>

            {/* Insurance Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Policy Expiry Date *
              </label>
              <input
                type="date"
                name="insurance_expiry"
                value={formData.insurance_end_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  formErrors.insurance_expiry
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                required
              />
              {formErrors.insurance_expiry && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.insurance_expiry}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaImage />
            Vehicle Images
          </h2>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Images
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaUpload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Uploaded Images ({imagePreviews.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            disabled={creating}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Registering...
              </>
            ) : (
              <>
                <FaSave />
                Register Car
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}