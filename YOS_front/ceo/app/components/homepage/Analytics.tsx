// components/homepage/Analytics.tsx
"use client";

import { Car, Wifi, Navigation, Music, Zap, Fuel, Users, Clock, MapPin } from "lucide-react";

interface TopCar {
  id: string;
  name: string;
  license_plate: string;
  revenue: number;
  bookings: number;
  status: string;
  color: string;
}

interface CarAnalyticsProps {
  topCar: TopCar;
}

export default function CarAnalytics({ topCar }: CarAnalyticsProps) {
  // Calculate derived metrics
  const utilizationRate = Math.min(95, Math.round((topCar.bookings / 30) * 100)); // Assuming 30 days
  const avgRevenuePerBooking = topCar.bookings > 0 ? Math.round(topCar.revenue / topCar.bookings) : 0;
  const rating = 4.2 + (Math.random() * 0.8); // Simulate rating based on performance
  
  // Status color mapping
  const statusColors: Record<string, string> = {
    'Available': 'bg-green-500',
    'Rented': 'bg-blue-500',
    'Under Maintenance': 'bg-yellow-500',
    'Insurance Expired': 'bg-red-500',
    'Accident Damaged': 'bg-red-700',
  };

  // Features based on car type
  const features = [
    { icon: Wifi, label: "WiFi", active: true },
    { icon: Navigation, label: "Navigation", active: true },
    { icon: Music, label: "Premium Audio", active: true },
    { icon: Zap, label: "Electric/Hybrid", active: topCar.name.includes('Tesla') || topCar.name.includes('Hybrid') },
    { icon: Fuel, label: "Fuel Efficient", active: !topCar.name.includes('Explorer') },
    { icon: Users, label: "5 Seats", active: true },
  ].filter(f => f.active).slice(0, 4);

  return (
    <div className="bg-linear-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 shadow-xl text-white h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Top Performing Vehicle</h3>
          <p className="text-sm text-blue-200">{topCar.name}</p>
          <div className="flex items-center mt-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[topCar.status] || 'bg-gray-500'}`}>
              {topCar.status}
            </span>
            <span className="ml-2 text-xs text-blue-300">License: {topCar.license_plate}</span>
          </div>
        </div>
        <Car className="w-8 h-8 text-blue-300" />
      </div>

      <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-blue-200">Total Revenue</p>
            <p className="text-2xl font-bold">${topCar.revenue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Total Bookings</p>
            <p className="text-2xl font-bold">{topCar.bookings}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-200">Utilization Rate</span>
              <span className="font-medium">{utilizationRate}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-linear-to-r from-cyan-400 to-blue-400 h-2 rounded-full"
                style={{ width: `${utilizationRate}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-blue-200">Avg. Revenue/Booking</span>
              <span className="font-medium">${avgRevenuePerBooking}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-linear-to-r from-green-400 to-emerald-400 h-2 rounded-full"
                style={{ width: `${Math.min(100, (avgRevenuePerBooking / 500) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-blue-100">Vehicle Features</h4>
          <span className="text-xs text-blue-300">{features.length} active</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center"
            >
              <feature.icon className="w-4 h-4 text-cyan-300 mr-2" />
              <span className="text-sm">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-200">Customer Rating</p>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 font-semibold">{rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Avg. Duration</p>
            <p className="font-semibold">3.2 days</p>
          </div>
        </div>
        
        <button className="w-full mt-4 px-4 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Car className="w-4 h-4 mr-2" />
          View Vehicle Details
        </button>
      </div>
    </div>
  );
}