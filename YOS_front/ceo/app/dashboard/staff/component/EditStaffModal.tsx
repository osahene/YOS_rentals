"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { AppDispatch, RootState } from "@/app/lib/store/store";
import { updateStaff, fetchStaff } from "@/app/lib/store/slices/staffSlice";
import { Staff } from "@/app/lib/store/types/staff";

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditStaffModal: React.FC<EditStaffModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedStaff = useSelector((state: RootState) => state.staff.selectedStaff);
  const loading = useSelector((state: RootState) => state.staff.loading);

  // Form state
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    email: "",
    phone: "",
    role: "driver",
    department: "",
    employment_type: "full_time",
    shift: "day",
    salary: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    hire_date: "",
    driver_license_id: "",
    driver_license_class: "",
  });

  // Populate form when selectedStaff changes
  useEffect(() => {
    if (selectedStaff) {
      setFormData({
        employee_id: selectedStaff.employee_id || "",
        name: selectedStaff.name || "",
        email: selectedStaff.email || "",
        phone: selectedStaff.phone || "",
        role: selectedStaff.role || "driver",
        department: selectedStaff.department || "",
        employment_type: selectedStaff.employment_type || "full_time",
        shift: selectedStaff.shift || "day",
        salary: selectedStaff.salary?.toString() || "",
        bank_name: selectedStaff.bank_name || "",
        account_number: selectedStaff.account_number || "",
        account_name: selectedStaff.account_name || "",
        hire_date: selectedStaff.hire_date ? selectedStaff.hire_date.split("T")[0] : "",
        driver_license_id: selectedStaff.driver_license_id || "",
        driver_license_class: selectedStaff.driver_license_class || "",
      });
    }
  }, [selectedStaff]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      // Convert salary to number
      const payload = {
        ...formData,
        salary: parseFloat(formData.salary) || 0,
      };

      await dispatch(updateStaff({ id: selectedStaff.id, data: payload })).unwrap();
      
      // Refresh staff list
      dispatch(fetchStaff({}));
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update staff:", error);
      // You could show a toast notification here
    }
  };

  if (!isOpen || !selectedStaff) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Staff Information
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Details */}
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Personal Information</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hire Date *
                </label>
                <input
                  type="date"
                  name="hire_date"
                  required
                  value={formData.hire_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Employment Details */}
              <div className="col-span-2 mt-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Employment Details</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="driver">Driver</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. Operations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employment Type *
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shift *
                </label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                  <option value="flexible">Flexible</option>
                  <option value="24_hour">24 Hour</option>
                </select>
              </div>

              {/* Financial */}
              <div className="col-span-2 mt-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Financial Information</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salary (GHS) *
                </label>
                <input
                  type="number"
                  name="salary"
                  required
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={formData.account_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Driver Specific */}
              {formData.role === "driver" && (
                <>
                  <div className="col-span-2 mt-2">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Driver License</h4>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      License ID
                    </label>
                    <input
                      type="text"
                      name="driver_license_id"
                      value={formData.driver_license_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      License Class
                    </label>
                    <input
                      type="text"
                      name="driver_license_class"
                      value={formData.driver_license_class}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStaffModal;