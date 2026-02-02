"use client";

import { PersistGate } from "redux-persist/lib/integration/react";
import { store, persistor } from "./store";
import { Provider } from "react-redux";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
