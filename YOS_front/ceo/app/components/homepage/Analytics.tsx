"use client";

import { Car, Wifi, Navigation, Music, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function CarAnalytics() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current.children, {
        duration: 0.8,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 shadow-xl text-white"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Featured Vehicle</h3>
          <p className="text-sm text-blue-200">BMW 5 Series - Premium</p>
        </div>
        <Car className="w-8 h-8 text-blue-300" />
      </div>

      <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-blue-200">Current Status</p>
            <p className="text-2xl font-bold">Active</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Mileage</p>
            <p className="text-2xl font-bold">320 KM</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div className="bg-linear-to-r from-cyan-400 to-blue-400 h-2 rounded-full w-3/4"></div>
        </div>
        <p className="text-xs text-blue-300 mt-2">Fuel level: 75%</p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-blue-100">Features</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Wifi, label: "WiFi", active: true },
            { icon: Navigation, label: "Navigation", active: true },
            { icon: Music, label: "Premium Audio", active: true },
            { icon: Zap, label: "Voice Control", active: true },
          ].map((feature) => (
            <div
              key={feature.label}
              className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex items-center"
            >
              <feature.icon className="w-5 h-5 text-cyan-300 mr-2" />
              <span className="text-sm">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-200">Rating</p>
            <div className="flex items-center">
              {[...Array(4)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 font-semibold">4.2</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
