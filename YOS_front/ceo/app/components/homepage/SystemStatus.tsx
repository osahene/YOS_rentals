// components/SystemStatus.tsx
"use client";

import { Shield, Cpu, Database, Cloud, AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const systems = [
  { name: "Security", icon: Shield, status: "optimal", value: 98 },
  { name: "API Server", icon: Cpu, status: "optimal", value: 95 },
  { name: "Database", icon: Database, status: "warning", value: 82 },
  { name: "Cloud Storage", icon: Cloud, status: "optimal", value: 96 },
];

export default function SystemStatus() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    barsRef.current.forEach((bar, index) => {
      if (bar) {
        gsap.fromTo(
          bar,
          { width: 0 },
          {
            width: `${systems[index].value}%`,
            duration: 1.5,
            delay: index * 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bar.parentElement?.parentElement,
              start: "top 80%",
            },
          }
        );
      }
    });
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
          <p className="text-sm text-gray-600">Infrastructure monitoring</p>
        </div>
        <AlertCircle className="w-6 h-6 text-gray-400" />
      </div>

      <div className="space-y-6">
        {systems.map((system, index) => {
          const Icon = system.icon;
          //   const statusColor =
          //     system.status === "optimal" ? "bg-green-500" : "bg-yellow-500";

          return (
            <div key={system.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      system.status === "optimal"
                        ? "bg-green-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        system.status === "optimal"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{system.name}</p>
                    <p className="text-sm text-gray-500">{system.status}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-800">{system.value}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  ref={(el) => {
                    barsRef.current[index] = el;
                  }}
                  className={`h-2 rounded-full ${
                    system.status === "optimal"
                      ? "bg-linear-to-r from-green-400 to-emerald-400"
                      : "bg-linear-to-r from-yellow-400 to-orange-400"
                  }`}
                  style={{ width: "0%" }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Overall Health</p>
            <p className="text-2xl font-bold text-gray-800">92.8%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600 font-semibold">+2.1%</p>
            <p className="text-xs text-gray-500">vs last month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
