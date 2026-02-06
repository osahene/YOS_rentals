import $axios from "./axiosInstance";

const apiService = {
  googleLog: (data: any) => $axios.post("/social/google/", data),
  register: (data: any) => $axios.post("/account/user-register/", data),
  verifyEmail: (data: any) => $axios.post("/account/verify-email/", data),
  VerifyPhoneNumber: (data: any) =>
    $axios.post("/account/verify-phone-number/", data),
  VerifyPhoneNumberOTP: (data: any) =>
    $axios.post("/account/verify-phone-number-otp/", data),
  login: (data: any) => $axios.post("/account/user-login/", data),
  logout: () => $axios.post("/account/user-logout/"),
  // Reset Password
  forgottenEmail: (data: any) => $axios.post("/account/request-reset-email/", data),
  confirmPassword: (data: any) => $axios.post("/account/password-reset/", data),
  // Generate OTP
  generateRegister: (data: any) =>
    $axios.post("/account/user-register-generate-otp/", data),
  // Register Cars
  createCar: (data: any) => $axios.post("/cars/", data),
  fetchCars: () => $axios.get("/cars/"),
  fetchCarById: (id: string) => $axios.get(`/cars/${id}/`),
  updateCar: (id: string, data: any) => $axios.put(`/cars/${id}/`, data),
  deleteCar: (id: string) => $axios.delete(`/cars/${id}/`),
  updateCarStatus: (id: string, status: string) => $axios.put(`/cars/${id}/update-status/`, { status }),
  
};

export default apiService;
