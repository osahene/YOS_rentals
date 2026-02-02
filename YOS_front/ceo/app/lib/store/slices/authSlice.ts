import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import { resetAllSlices } from "./rootActions";
import apiService from "../../../utils/APIPaths";

interface Tokens {
  access: string;
  refresh: string;
}

interface User {
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  first_name: string | null;
  last_name: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: any;
  email: string;
  phone_number: string;
  redirectUrl?: string;
  password?: string; // Added because of setConfirmPassword reducer
}



export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (googleToken: string, thunkAPI) => {
    try {
      const cleanToken = googleToken.replace(/^"|"$/g, "");
      const response = await apiService.googleLog(
        JSON.stringify({ id_token: cleanToken })
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 307) {
        const data = error.response.data.data;
        return thunkAPI.fulfillWithValue({
          status: "redirect",
          redirectUrl: error.response.data.redirect_next_url,
          tempAuthData: {
            tokens: data.token,
            user: {
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
            },
          },
        });
      }
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData: any, thunkAPI) => {
    try {
      const response = await apiService.login(userData);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data || error.data || error.message;
      return thunkAPI.rejectWithValue(errorData);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      const response = await apiService.logout();
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData: any, thunkAPI) => {
    try {
      const response = await apiService.register(userData);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (userData: any, thunkAPI) => {
    try {
      const response = await apiService.verifyEmail(userData);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const verifyPhoneNumber = createAsyncThunk(
  "auth/verifyPhoneNumber",
  async (userData: any, thunkAPI) => {
    try {
      const response = await apiService.VerifyPhoneNumber(userData);
      return response; // Note: Original code returned 'response' here, not 'response.data'
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

export const verifyPhoneNumberOTP = createAsyncThunk(
  "auth/verifyPhoneNumberOTP",
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await apiService.VerifyPhoneNumberOTP(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const requestOTP = createAsyncThunk(
  "auth/requestOTP",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiService.generateRegister(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const forgottenPasswordRequest = createAsyncThunk(
  "auth/forgottenPassword",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiService.forgottenEmail(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const confirmPasswordRequest = createAsyncThunk(
  "auth/confirmPassword",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiService.confirmPassword(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  first_name: null,
  last_name: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  email: "",
  phone_number: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTempAuthData: (state, action: PayloadAction<{ tokens: any; user: User }>) => {
      const { tokens, user } = action.payload;
      state.accessToken = tokens.access;
      state.refreshToken = tokens.refresh;
      state.first_name = user.first_name;
      state.last_name = user.last_name;
      state.email = user.email;
    },
    setEmail(state, action: PayloadAction<string>) {
      state.email = action.payload;
    },
    setforgottenPasswordRequest(state, action: PayloadAction<string>) {
      state.email = action.payload;
    },
    setConfirmPassword(state, action: PayloadAction<string>) {
      state.password = action.payload;
    },
    setPhoneNumbers(state, action: PayloadAction<string>) {
      state.phone_number = action.payload;
    },
    userState: (state, action: PayloadAction<{ first_name: string; last_name: string }>) => {
      const { first_name, last_name } = action.payload;
      state.first_name = first_name;
      state.last_name = last_name;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.first_name = null;
      state.last_name = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    refreshToken: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
  extraReducers: (builder) => {
    builder
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.status === "redirect") {
          state.redirectUrl = action.payload.redirectUrl;
          const { tokens, user } = action.payload.tempAuthData;
          state.accessToken = tokens.access;
          state.refreshToken = tokens.refresh;
          state.first_name = user.first_name;
          state.last_name = user.last_name;
          state.email = user.email;
        } else {
          const { tokens, first_name, last_name } = action.payload.data;
          state.accessToken = tokens.access;
          state.refreshToken = tokens.refresh;
          state.first_name = first_name;
          state.last_name = last_name;
          state.isAuthenticated = true;
        }
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const { access, refresh } = action.payload.data.tokens.tokens;
        state.accessToken = access;
        state.refreshToken = refresh;
        state.first_name = action.payload.data.first_name;
        state.last_name = action.payload.data.last_name;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout User
      .addCase(logoutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.first_name = null;
        state.last_name = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      // Verify Email
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        const { access, refresh } = action.payload.tokens;
        state.accessToken = access;
        state.refreshToken = refresh;
      })
      // Verify phone_number OTP
      .addCase(verifyPhoneNumberOTP.fulfilled, (state, action) => {
        state.loading = false;
        const { first_name, last_name, tokens } = action.payload;
        state.accessToken = tokens.access;
        state.refreshToken = tokens.refresh;
        state.first_name = first_name;
        state.last_name = last_name;
        state.isAuthenticated = true;
      })
      // Confirm Password
      .addCase(confirmPasswordRequest.fulfilled, (state, action) => {
        state.loading = false;
        const { access, refresh } = action.payload;
        state.accessToken = access;
        state.refreshToken = refresh;
      })
      // Handle generic rejections for remaining cases
      // .addMatcher(
      //   (action) => action.type.endsWith("/rejected"),
      //   (state, action) => {
      //     state.loading = false;
      //     state.error = action.payload;
      //   }
      // )
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      );
  },
});

export const {
  logout,
  refreshToken,
  setEmail,
  setConfirmPassword,
  setforgottenPasswordRequest,
  setPhoneNumbers,
  userState,
} = authSlice.actions;

export default authSlice.reducer;

