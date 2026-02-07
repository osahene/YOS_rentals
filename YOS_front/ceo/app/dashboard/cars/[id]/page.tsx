"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import apiService from "@/app/utils/APIPaths";
import CarDetailContent from "./CarDetailContent";

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        setLoading(true);
        const response = await apiService.fetchCarById(params.id as string);
        console.log("Car detail response:", response.data);
        setCar(response.data);
      } catch (err: any) {
        console.error("Error fetching car:", err);
        setError(err.message || "Failed to fetch car details");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCar();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            {error || "Car not found"}
          </h3>
          <button
            onClick={() => router.push("/dashboard/cars")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go back to cars list
          </button>
        </div>
      </div>
    );
  }

  return <CarDetailContent car={car} />;
}