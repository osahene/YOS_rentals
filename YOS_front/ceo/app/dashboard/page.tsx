"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useThreeJSScene } from "../components/homepage/ThreeJSScene";
import MetricsGrid from "../components/homepage/MetricsGrid";
import ChartsSection from "../components/homepage/ChartsSection";
import RecentBookings from "../components/homepage/Bookings";
import CarAnalytics from "../components/homepage/Analytics";
import { Suspense } from "react";

import { LuUser, LuDollarSign, LuCar, LuCalendar } from "react-icons/lu";

gsap.registerPlugin(ScrollTrigger);

const metrics = [
  {
    title: "Active Customers",
    value: "12,240",
    change: "+12.5%",
    icon: LuUser,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Revenue",
    value: "$87,200",
    change: "+8.3%",
    icon: LuDollarSign,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Rental Cars",
    value: "1,150",
    change: "+5.2%",
    icon: LuCar,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Bookings",
    value: "1,245",
    change: "+22%",
    icon: LuCalendar,
    color: "from-orange-500 to-red-500",
  },
];

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ThreeScene } = useThreeJSScene();

  useEffect(() => {
    // Initialize GSAP animations
    gsap.from(".metric-card", {
      duration: 0.8,
      y: 50,
      opacity: 0,
      stagger: 0.1,
      ease: "power3.out",
    });

    // Parallax effect for background elements
    gsap.to(".parallax-bg", {
      y: () => -ScrollTrigger.maxScroll(window) * 0.05,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-linear-to-br">
      {/* Background Three.js Scene */}
      <div className="fixed inset-0 z-0 opacity-10">
        <Suspense fallback={null}>
          <ThreeScene />
        </Suspense>
      </div>

      <div className="relative z-10">
        <main className="p-6 space-y-6">
          {/* Key Metrics */}
          <MetricsGrid metrics={metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              <ChartsSection />
              <RecentBookings />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
