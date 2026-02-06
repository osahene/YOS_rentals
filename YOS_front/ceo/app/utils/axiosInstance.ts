import { jwtDecode, JwtPayload } from "jwt-decode";
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import dayjs from "dayjs";
import { store } from "../lib/store/store"; 
import { logout, refreshToken } from "../lib/store/slices/authSlice"; 
import { setGlobalLoading } from "../lib/store/slices/globalSlice";

interface CustomJwtPayload extends JwtPayload {
  exp: number;
}

const $axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:8000",
  withCredentials: true,
  // headers: {
    // "X-API-KEY": process.env.FRONTEND_API_KEY || "",
  // },
});

// const TakeRefreshToken = async () => {
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
//         refreshToken({
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

// Request Interceptor
// $axios.interceptors.request.use(
//   async (req: InternalAxiosRequestConfig) => {
//     store.dispatch(setGlobalLoading(true));
//     const state = store.getState();
//     let accessToken = state.auth.accessToken;

//     if (accessToken) {
//       if (accessToken.startsWith('"') && accessToken.endsWith('"')) {
//         accessToken = accessToken.slice(1, -1);
//       }

//       try {
//         const user = jwtDecode<CustomJwtPayload>(accessToken);
//         const isExpired = dayjs.unix(user.exp).isBefore(dayjs());

//         if (!isExpired) {
//           req.headers.Authorization = `Bearer ${accessToken}`;
//         } else {
//           const tokens = await TakeRefreshToken();
//           if (tokens?.access_token) {
//             req.headers.Authorization = `Bearer ${tokens.access_token}`;
//           } else {
//             store.dispatch(logout());
//             if (typeof window !== "undefined") window.location.href = "/auth/login";
//           }
//         }
//       } catch (error) {
//         store.dispatch(logout());
//       }
//     }
//     return req;
//   },
//   (error) => {
//     store.dispatch(setGlobalLoading(false));
//     return Promise.reject(error);
//   }
// );

// Response Interceptor
// $axios.interceptors.response.use(
//   (response: AxiosResponse) => {
//     store.dispatch(setGlobalLoading(false));
//     return response;
//   },
//   (error: AxiosError<any>) => {
//     store.dispatch(setGlobalLoading(false));

//     const errorMessage = 
//       error.response?.data?.detail || 
//       error.response?.data?.message || 
//       error.message || 
//       "Request failed";

//     store.dispatch({
//       type: "notifications/addNotification",
//       payload: {
//         title: "Error",
//         message: errorMessage,
//         type: "danger",
//       },
//     });
//     return Promise.reject(error);
//   }
// );

export default $axios;