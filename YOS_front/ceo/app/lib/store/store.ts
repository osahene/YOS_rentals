// lib/store/store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from "redux-persist";
import authReducer from './slices/authSlice'
import carsReducer from './slices/carsSlice';
import customersReducer from './slices/customersSlice';
import bookingsReducer from './slices/bookingsSlice';
import staffReducer from './slices/staffSlice';
import uiReducer from './slices/uiSlice';
import storage from 'redux-persist/lib/storage';

const rootPersistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"], // Only persist the auth slice
};

const rootReducer = combineReducers({
  auth: authReducer,
  cars: carsReducer,
  customers: customersReducer,
  bookings: bookingsReducer,
  staff: staffReducer,
  ui: uiReducer,
});
const persistedReducer = persistReducer(rootPersistConfig, rootReducer);


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
      ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/REGISTER", "persist/FLUSH", "persist/PAUSE", "persist/PURGE"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.vehicle', 'payload.customer', 'payload.staff', 'payload.booking', 'meta.arg', 'payload'],
        // Ignore these paths in the state
        ignoredPaths: ['cars.selectedCar', 'customers.selectedCustomer', 'bookings.selectedBooking', 'staff.selectedStaff'],
      },
    }),
});
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;