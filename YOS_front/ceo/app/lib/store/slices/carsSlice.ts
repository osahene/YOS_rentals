// lib/slices/carsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Car, CarFormData, ApiResponse } from "../types/car";
import { RootState } from "../store";
import apiService from "@/app/utils/APIPaths";

const getErrorMessage = (error: any) => {
  return error.response?.data?.message || error.message || "An error occurred";
};

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
      const response = await apiService.fetchCars();
      console.log("API Response for fetchCars:", response); // Debugging log
      return response.data; // Adjust based on your actual API shape
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCarById = createAsyncThunk(
  "cars/fetchCarById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.fetchCarById(id);
      console.log("API Response for fetchCarById:", response); // Debugging log
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// THE FIX: Accept 'CarFormData' (plain object), NOT 'FormData'
export const createCar = createAsyncThunk<Car, CarFormData, { rejectValue: string }>(
  "cars/createCar",
  async (plainCarData: CarFormData, { rejectWithValue }) => {
    try {
      // 1. Convert Plain Object -> FormData INSIDE the thunk
      const formDataToSend = new FormData();

      Object.entries(plainCarData).forEach(([key, value]) => {
        if (key === "images" && Array.isArray(value)) {
          value.forEach((file) => {
            formDataToSend.append(`images`, file);
          });
        } else if (Array.isArray(value)) {
          // If your backend expects arrays as JSON strings
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      const response = await apiService.createCar(formDataToSend);
      if (response.status === 201 || response.status === 200) {
        return response.data;
      }
      return rejectWithValue("Failed to create car");
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateCar = createAsyncThunk(
  "cars/updateCar",
  async ({ id, carData }: { id: string; carData: Partial<Car> }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateCar(id, carData);
      console.log("API Response for updateCar:", response); // Debugging log
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteCar = createAsyncThunk(
  "cars/deleteCar",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.deleteCar(id);
      return id; // Return ID to remove it from state
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateCarStatus = createAsyncThunk(
  "cars/updateCarStatus",
  async ({ carId, status }: { carId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateCarStatus(carId, status);
      console.log("API Response for updateCarStatus:", response); // Debugging log
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
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
      state.cars = action.payload.results || [];
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
      state.cars.unshift(action.payload);
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