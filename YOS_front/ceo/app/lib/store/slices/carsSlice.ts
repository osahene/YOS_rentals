// lib/slices/carsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Car, CarFormData, ApiResponse } from "../types/car";
import { RootState } from "../store";

interface CarsState {
  cars: Car[];
  selectedCar: Car | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
}

const initialState: CarsState = {
  cars: [],
  selectedCar: null,
  loading: false,
  error: null,
  creating: false,
};

// Async Thunks for API calls
export const fetchCars = createAsyncThunk(
  "cars/fetchCars",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/cars/");
      if (!response.ok) {
        throw new Error("Failed to fetch cars");
      }
      const data: ApiResponse<Car[]> = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCarById = createAsyncThunk(
  "cars/fetchCarById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cars/${id}/`);
      if (!response.ok) {
        throw new Error("Failed to fetch car");
      }
      const data: ApiResponse<Car> = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCar = createAsyncThunk(
  "cars/createCar",
  async (carData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/cars/", {
        method: "POST",
        body: carData,
        // Note: Don't set Content-Type header when sending FormData
        // The browser will set it automatically with the correct boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create car");
      }
      
      const data: ApiResponse<Car> = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCar = createAsyncThunk(
  "cars/updateCar",
  async ({ id, carData }: { id: string; carData: Partial<Car> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cars/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update car");
      }
      
      const data: ApiResponse<Car> = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCar = createAsyncThunk(
  "cars/deleteCar",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cars/${id}/`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete car");
      }
      
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCarStatus = createAsyncThunk(
  "cars/updateCarStatus",
  async ({ carId, status }: { carId: string; status: Car["status"] }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/cars/${carId}/status/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update car status");
      }
      
      const data: ApiResponse<Car> = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
export const carsSlice = createSlice({
  name: "cars",
  initialState,
  reducers: {
    setSelectedCar: (state, action: PayloadAction<Car | null>) => {
      state.selectedCar = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cars
    builder.addCase(fetchCars.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCars.fulfilled, (state, action) => {
      state.loading = false;
      state.cars = action.payload;
    });
    builder.addCase(fetchCars.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Car by ID
    builder.addCase(fetchCarById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCarById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedCar = action.payload;
    });
    builder.addCase(fetchCarById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Car
    builder.addCase(createCar.pending, (state) => {
      state.creating = true;
      state.error = null;
    });
    builder.addCase(createCar.fulfilled, (state, action) => {
      state.creating = false;
      state.cars.push(action.payload);
    });
    builder.addCase(createCar.rejected, (state, action) => {
      state.creating = false;
      state.error = action.payload as string;
    });

    // Update Car
    builder.addCase(updateCar.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCar.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.cars.findIndex((car) => car.id === action.payload.id);
      if (index !== -1) {
        state.cars[index] = action.payload;
      }
      if (state.selectedCar?.id === action.payload.id) {
        state.selectedCar = action.payload;
      }
    });
    builder.addCase(updateCar.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete Car
    builder.addCase(deleteCar.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCar.fulfilled, (state, action) => {
      state.loading = false;
      state.cars = state.cars.filter((car) => car.id !== action.payload);
      if (state.selectedCar?.id === action.payload) {
        state.selectedCar = null;
      }
    });
    builder.addCase(deleteCar.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Car Status
    builder.addCase(updateCarStatus.fulfilled, (state, action) => {
      const index = state.cars.findIndex((car) => car.id === action.payload.id);
      if (index !== -1) {
        state.cars[index] = action.payload;
      }
      if (state.selectedCar?.id === action.payload.id) {
        state.selectedCar = action.payload;
      }
    });
  },
});

// Export actions
export const { setSelectedCar, clearError } = carsSlice.actions;

// Selectors
export const selectCars = (state: RootState) => state.cars.cars;
export const selectSelectedCar = (state: RootState) => state.cars.selectedCar;
export const selectCarsLoading = (state: RootState) => state.cars.loading;
export const selectCarsError = (state: RootState) => state.cars.error;
export const selectCarsCreating = (state: RootState) => state.cars.creating;
export const selectAvailableCars = (state: RootState) =>
  state.cars.cars.filter((car) => car.status === "available");
export const selectCarsByStatus = (status: Car["status"]) => (state: RootState) =>
  state.cars.cars.filter((car) => car.status === status);

export default carsSlice.reducer;