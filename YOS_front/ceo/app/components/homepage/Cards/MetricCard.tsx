"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { LuAArrowUp } from "react-icons/lu";
import { IconType } from "react-icons";

export interface MetricCardProps {
  title: string;
  value: number | string;
  change: string;
  icon: IconType;
  color: string;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay = 0,
}: MetricCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay,
        ease: "power3.out",
      }
    );
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-linear-to-r ${color} shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        <span className="flex items-center text-sm font-semibold text-green-600">
          <LuAArrowUp className="w-4 h-4 mr-1" />
          {change}
        </span>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
        {value}
      </h3>

      <p className="text-gray-600 dark:text-white text-sm">{title}</p>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">Last month</p>
      </div>
    </div>
  );
}
