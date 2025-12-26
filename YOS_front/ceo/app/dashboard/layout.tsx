"use client";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../lib/store/store";
// import { toggleDarkMode, setCurrentPage } from "../lib/store/slices/uiSlice";
import SideNav from "../components/SideNav/sidenav";
import Header from "../components/homepage/Header";
// import { ThreeScene } from "../components/homepage/ThreeJSScene";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const dispatch = useDispatch<AppDispatch>();
  const { darkMode, sidebarOpen } = useSelector((state: RootState) => state.ui);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* <ThreeScene /> */}

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <SideNav />

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? "md:ml-28" : "ml-0"
          }`}
        >
          <Header />
          <section className="p-4 md:p-6">{children}</section>
        </div>
      </div>
    </div>
  );
}
