"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useThreeJSScene } from "./components/homepage/ThreeJSScene";
import DashboardHeader from "./components/homepage/DashboadHeader";
import MetricCards from "./components/homepage/MetricCard";
import ChartsSection from "./components/homepage/ChartsSection";
import RecentBookings from "./components/homepage/Bookings";
import CarAnalytics from "./components/homepage/Analytics";
import SystemStatus from "./components/homepage/SystemStatus";
import { Suspense } from "react";

gsap.registerPlugin(ScrollTrigger);

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
      y: (i, target) => -ScrollTrigger.maxScroll(window) * 0.05,
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
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      {/* Background Three.js Scene */}
      <div className="fixed inset-0 z-0 opacity-10">
        <Suspense fallback={null}>
          <ThreeScene />
        </Suspense>
      </div>

      <div className="relative z-10">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          {/* Key Metrics */}
          <MetricCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              <ChartsSection />
              <RecentBookings />
            </div>

            {/* Right Column - Analytics & Status */}
            <div className="space-y-6">
              <CarAnalytics />
              <SystemStatus />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
