import { jwtDecode, JwtPayload } from "jwt-decode";
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import dayjs from "dayjs";
import { logout, refreshToken as refreshTokenAction } from "../lib/store/slices/authSlice"; 
import { setGlobalLoading } from "../lib/store/slices/globalSlice";

// --- 1. Define a variable to hold the store ---
let store: any;

// --- 2. Export a function to inject the store ---
export const injectStore = (_store: any) => {
  store = _store;
};

interface CustomJwtPayload extends JwtPayload {
  exp: number;
}

const $axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000",
  withCredentials: true,
});

// const TakeRefreshToken = async () => {
//   // Safety check
//   if (!store) return null;

//   const state = store.getState();
//   let refresh_token = state.auth.refreshToken;
//   if (!refresh_token) return null;

//   try {
//     if (refresh_token.startsWith('"') && refresh_token.endsWith('"')) {
//       refresh_token = refresh_token.slice(1, -1);
//     }
    
//     const response = await axios.post(`${$axios.defaults.baseURL}/account/token/refresh/`, {
//       refresh: refresh_token,
//     });

//     const { access, refresh } = response.data;
//     if (access) {
//       store.dispatch(
//         refreshTokenAction({
//           accessToken: access,
//           refreshToken: refresh || refresh_token,
//         })
//       );
//       return { access_token: access, refresh_token: refresh || refresh_token };
//     }
//     return null;
//   } catch (error) {
//     console.error("Error refreshing token:", error);
//     return null;
//   }
// };

// const scheduleTokenRefresh = () => {
//   if (typeof window === "undefined") return;

//   setInterval(async () => {
//     // Safety check
//     if (!store) return;

//     const state = store.getState();
//     const { accessToken, refreshToken } = state.auth;

//     if (accessToken && refreshToken) {
//       try {
//         const user = jwtDecode<CustomJwtPayload>(accessToken);
//         const isExpired = dayjs.unix(user.exp).diff(dayjs(), "second") < 60;

//         if (isExpired) {
//           await TakeRefreshToken();
//         }
//       } catch (error) {
//         console.error("Token refresh scheduling error:", error);
//       }
//     }
//   }, 30000);
// };

// scheduleTokenRefresh();

// // Request Interceptor
// $axios.interceptors.request.use(
//   async (req: InternalAxiosRequestConfig) => {
//     // Safety check
//     if (store) {
//         store.dispatch(setGlobalLoading(true));
//         const state = store.getState();
//         let accessToken = state.auth.accessToken;

//         if (accessToken) {
//             if (accessToken.startsWith('"') && accessToken.endsWith('"')) {
//                 accessToken = accessToken.slice(1, -1);
//             }

//             try {
//                 const user = jwtDecode<CustomJwtPayload>(accessToken);
//                 const isExpired = dayjs.unix(user.exp).isBefore(dayjs());

//                 if (!isExpired) {
//                     req.headers.Authorization = `Bearer ${accessToken}`;
//                 } else {
//                     const tokens = await TakeRefreshToken();
//                     if (tokens?.access_token) {
//                         req.headers.Authorization = `Bearer ${tokens.access_token}`;
//                     } else {
//                         store.dispatch(logout());
//                         if (typeof window !== "undefined") window.location.href = "/auth/login";
//                     }
//                 }
//             } catch (error) {
//                 store.dispatch(logout());
//             }
//         }
//     }
//     return req;
//   },
//   (error) => {
//     if (store) store.dispatch(setGlobalLoading(false));
//     return Promise.reject(error);
//   }
// );

// // Response Interceptor
// $axios.interceptors.response.use(
//   (response: AxiosResponse) => {
//     if (store) store.dispatch(setGlobalLoading(false));
//     return response;
//   },
//   (error: AxiosError<any>) => {
//     if (store) store.dispatch(setGlobalLoading(false));

//     // Optional: You can handle global errors here
//     return Promise.reject(error);
//   }
// );

export default $axios;