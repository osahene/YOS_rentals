"use client";

import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Car, FileText, Shield, CreditCard } from 'lucide-react';

interface Guarantor {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    relationship: string;
    ghana_card_number: string;
    address: string;
    occupation?: string;
}

interface Customer {
   id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    ghana_card_number: string;
    driver_license_number?: string;
    driver_license_expiry?: Date;
}

interface CarDetails {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  category: string;
  color: string;
  daily_rate: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    customer: Customer;
    guarantor?: Guarantor;
    car: CarDetails;
    start_date: string;
    end_date: string;
    pickup_location: string;
    dropoff_location: string;
    total_amount: number;
    amount_paid: number;
    status: string;
    payment_status: string;
    payment_method: string;
    is_self_drive: boolean;
    special_requests?: string;
    created_at: string;
  };
}

export default function BookingModal({ isOpen, onClose, booking }: BookingModalProps) {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 rounded-2xl shadow-xl sm:my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Booking Details - {booking.id}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Created on {new Date(booking.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Details */}
              <div className="space-y-4">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h4>
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">{booking.customer.first_name} {booking.customer.last_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{booking.customer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{booking.customer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">{booking.customer.address}</span>
                  </div>
                  {booking.customer.driver_license_number && (
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Driver's License</div>
                        <div className="text-xs">
                          {booking.customer.driver_license_number} (Expires: {booking.customer.driver_license_expiry ? new Date(booking.customer.driver_license_expiry).toLocaleDateString() : 'N/A'})
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>

              {/* Guarantor Details */}
              <div className="space-y-4">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                  <Shield className="w-5 h-5 mr-2" />
                  Guarantor Information
                </h4>
                {booking.guarantor ? (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">{booking.guarantor.first_name} {booking.guarantor.last_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{booking.guarantor.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{booking.guarantor.email}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm">{booking.guarantor.address}</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Relationship</div>
                        <div className="text-xs capitalize">{booking.guarantor.relationship}</div>
                      </div>
                    </div>
                    {booking.guarantor.occupation && (
                      <div className="text-sm">
                        <span className="font-medium">Occupation: </span>
                        {booking.guarantor.occupation}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">No guarantor assigned</p>
                  </div>
                )}
              </div>

              {/* Vehicle Details */}
              <div className="space-y-4">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                  <Car className="w-5 h-5 mr-2" />
                  Vehicle Information
                </h4>
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{booking.car.make} {booking.car.model}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.car.year} • {booking.car.category}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {booking.car.license_plate}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Color:</span> {booking.car.color}
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Fuel:</span> {booking.car.fuel_type}
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Transmission:</span> {booking.car.transmission}
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Mileage:</span> {booking.car.mileage.toLocaleString()} km
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking & Payment Details */}
              <div className="space-y-4">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 dark:text-white">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Booking & Payment
                </h4>
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Rental Period</div>
                      <div className="text-xs">
                        {new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
                      <div className="font-semibold">₵{booking.total_amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</div>
                      <div className="font-semibold">₵{booking.amount_paid?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Payment Status</div>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                        {booking.payment_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Payment Method</div>
                    <div className="font-medium capitalize">
                      {booking.payment_method.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pickup Location</div>
                    <div>{booking.pickup_location || 'Not specified'}</div>
                  </div>
                  {booking.special_requests && (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Special Requests</div>
                      <div className="text-sm italic">{booking.special_requests}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
            >
              Close
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              Edit Booking
            </button>
            {booking.status === 'active' && (
              <button className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
                Mark as Returned
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}