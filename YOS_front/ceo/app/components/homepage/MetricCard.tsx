// components/MetricCards.tsx
"use client";

import {
  LuAArrowUp,
  LuUser,
  LuDollarSign,
  LuCar,
  LuCalendar,
} from "react-icons/lu";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const metrics = [
  {
    title: "Active Customers",
    value: "12,240",
    change: "+12.5%",
    icon: LuUser,
    color: "from-blue-500 to-cyan-500",
    delay: 0.1,
  },
  {
    title: "Revenue",
    value: "$87,200",
    change: "+8.3%",
    icon: LuDollarSign,
    color: "from-green-500 to-emerald-500",
    delay: 0.2,
  },
  {
    title: "Rental Cars",
    value: "1,150",
    change: "+5.2%",
    icon: LuCar,
    color: "from-purple-500 to-pink-500",
    delay: 0.3,
  },
  {
    title: "Rental Bookings",
    value: "1,245",
    change: "+22%",
    icon: LuCalendar,
    color: "from-orange-500 to-red-500",
    delay: 0.4,
  },
];

export default function MetricCards() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(
          card,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: metrics[index].delay,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
            },
          }
        );
      }
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.title}
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            className="metric-card group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl bg-linear-to-r ${metric.color} shadow-md`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="flex items-center text-sm font-semibold text-green-600">
                <LuAArrowUp className="w-4 h-4 mr-1" />
                {metric.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {metric.value}
            </h3>
            <p className="text-gray-600 text-sm">{metric.title}</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Last month</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
