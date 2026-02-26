"use client";

import { useState, useEffect, use } from "react";
import { useParams, useRouter } from "next/navigation";
import CarDetailContent from "./CarDetailContent";
import { fetchCarById } from "@/app/lib/store/slices/carsSlice";
import { RootState, AppDispatch } from "@/app/lib/store/store";
import { useDispatch, useSelector } from "react-redux";

export default function CarDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const router = useRouter();
  const [car, setCar] = useState<any>(null);
  const selectedCar = useSelector((state: RootState) => state.cars.selectedCar);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCar && selectedCar.id === params.id) {
      setCar(selectedCar);
      setLoading(false);
    } else {
      dispatch(fetchCarById(params.id as string));
    }
  }, [selectedCar, params.id, dispatch]);

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