import { createSlice } from "@reduxjs/toolkit";
import { resetAllSlices } from "./rootActions";
const globalSlice = createSlice({
  name: "global",
  initialState: { loading: false },
  reducers: {
    setGlobalLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAllSlices, () => ({ loading: false }));
  },
});

export const { setGlobalLoading } = globalSlice.actions;
export default globalSlice.reducer;
