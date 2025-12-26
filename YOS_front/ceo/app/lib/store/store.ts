// lib/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import carsReducer from './slices/carsSlice';
import customersReducer from './slices/customersSlice';
import bookingsReducer from './slices/bookingsSlice';
import staffReducer from './slices/staffSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    cars: carsReducer,
    customers: customersReducer,
    bookings: bookingsReducer,
    staff: staffReducer,
    ui: uiReducer,
    },
    
      middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.vehicle', 'payload.customer', 'payload.staff', 'payload.booking'],
        // Ignore these paths in the state
        ignoredPaths: ['cars.selectedCar', 'customers.selectedCustomer', 'bookings.selectedBooking', 'staff.selectedStaff'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;