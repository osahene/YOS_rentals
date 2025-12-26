"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  BadgeCheck,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Filter,
  Search,
  Key,
} from "lucide-react";

export default function StaffPage() {
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "driver",
    department: "operations",
    joinDate: new Date().toISOString().split("T")[0],
  });

  const staffMembers = [
    {
      id: "1",
      name: "John Manager",
      email: "john.manager@driveon.com",
      phone: "+1 234 567 8901",
      role: "Transport Manager",
      department: "Operations",
      joinDate: "2022-03-15",
      status: "active",
      permissions: ["manage_bookings", "manage_cars", "view_reports"],
    },
    {
      id: "2",
      name: "Sarah Driver",
      email: "sarah.driver@driveon.com",
      phone: "+1 234 567 8902",
      role: "Driver",
      department: "Operations",
      joinDate: "2023-01-20",
      status: "active",
      permissions: ["drive_cars", "view_schedule"],
    },
    {
      id: "3",
      name: "Mark Finance",
      email: "mark.finance@driveon.com",
      phone: "+1 234 567 8903",
      role: "Finance Officer",
      department: "Finance",
      joinDate: "2022-08-10",
      status: "active",
      permissions: ["manage_payments", "view_reports"],
    },
    {
      id: "4",
      name: "Lisa Admin",
      email: "lisa.admin@driveon.com",
      phone: "+1 234 567 8904",
      role: "Administrator",
      department: "IT",
      joinDate: "2021-11-05",
      status: "inactive",
      permissions: ["full_access"],
    },
    {
      id: "5",
      name: "David Mechanic",
      email: "david.mechanic@driveon.com",
      phone: "+1 234 567 8905",
      role: "Maintenance Technician",
      department: "Maintenance",
      joinDate: "2023-05-15",
      status: "active",
      permissions: ["manage_maintenance", "view_cars"],
    },
  ];

  const roleOptions = [
    "Transport Manager",
    "Driver",
    "Finance Officer",
    "Administrator",
    "Maintenance Technician",
    "Customer Service",
    "Marketing Officer",
  ];

  const departmentOptions = [
    "Operations",
    "Finance",
    "IT",
    "Maintenance",
    "Customer Service",
    "Marketing",
    "HR",
  ];

  const handleAddStaff = () => {
    console.log("Adding new staff:", newStaff);
    // Here you would dispatch an action to add staff to Redux
    setShowAddStaffModal(false);
    setNewStaff({
      name: "",
      email: "",
      phone: "",
      role: "driver",
      department: "operations",
      joinDate: new Date().toISOString().split("T")[0],
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "transport manager":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "driver":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "finance officer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "administrator":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "maintenance technician":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Staff Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage staff members and their permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddStaffModal(true)}
          className="inline-flex items-center px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Register New Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Staff
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                24
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active Staff
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                20
              </p>
            </div>
            <BadgeCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Departments
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                6
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drivers
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                8
              </p>
            </div>
            <Users className="w-8 h-8 text-yellow-500" />
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
              placeholder="Search staff by name, role, or department..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white">
            <option value="all">All Departments</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Staff Members
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Staff Member
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Contact
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Department
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Join Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((staff) => (
                <tr
                  key={staff.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-800 dark:text-white">
                          {staff.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {staff.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {staff.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        {staff.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(
                        staff.role
                      )}`}
                    >
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 text-gray-400 mr-2" />
                      {staff.department}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      {new Date(staff.joinDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${
                        staff.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }
                    `}
                    >
                      {staff.status.charAt(0).toUpperCase() +
                        staff.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4 text-yellow-500" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowAddStaffModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Register New Staff
                  </h3>
                  <button
                    onClick={() => setShowAddStaffModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <span className="sr-only">Close</span>
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newStaff.name}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={newStaff.role}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, role: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                  >
                    {roleOptions.map((role) => (
                      <option
                        key={role}
                        value={role.toLowerCase().replace(" ", "_")}
                      >
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    value={newStaff.department}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, department: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept.toLowerCase()}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={newStaff.joinDate}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, joinDate: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  className="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90"
                >
                  Register Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
