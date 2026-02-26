import $axios from "./axiosInstance";

const apiService = {
  getSecurityQuestions: () => $axios.get("/account/security-questions/"),
  register: (data: any) => $axios.post("/account/register/", data),
 verifyEmail: (data: { token: string }) => $axios.get(`/account/verify-email/?token=${data.token}`),
  VerifyPhoneNumber: (data: any) =>
    $axios.post("/account/verify-phone-number/", data),
  sendPhoneOtp: (data: any) =>
    $axios.post("/account/verify-phone-number/", data),
  verifyPhoneOtp: (data: any) =>
    $axios.post("/account/verify-phone-number/", data),
  VerifyPhoneNumberOTP: (data: any) =>
    $axios.post("/account/verify-phone-number-otp/", data),
  login: (data: any) => $axios.post("/account/user-login/", data),
  logout: () => $axios.post("/account/user-logout/"),
  // Reset Password
  requestPasswordReset: (data: { email: string }) =>
    $axios.post("/account/password-reset/request/", data),
  verifySecurityAnswers: (data: { email: string; answers: { question_id: number; answer: string }[] }) =>
    $axios.post("/account/password-reset/verify-answers/", data),
  resetPassword: (data: { reset_token: string; new_password: string }) =>
    $axios.post("/account/password-reset/confirm/", data),

  // dashboard
  fetchDashboardData: () => Promise.all([
    $axios.get("/dashboard/metrics/"),
    $axios.get("/dashboard/recent-bookings/"),
    $axios.get("/dashboard/daily-bookings/"),
    $axios.get("/dashboard/revenue-trends/"),
    $axios.get("/dashboard/car-distribution/"),
    $axios.get("/dashboard/top-cars/"),
  ]).then(([
    metricsRes,
    recentBookingsRes,
    dailyBookingsRes,
    revenueTrendsRes,
    carDistributionRes,
    topCarsRes
  ]) => ({
    metrics: metricsRes.data.metrics,
    bookingStatus: metricsRes.data.booking_status,
    carStatus: metricsRes.data.car_status,
    recentBookings: recentBookingsRes.data.bookings,
    dailyBookings: dailyBookingsRes.data.daily_data,
    trends: revenueTrendsRes.data.trends,
    carDistribution: carDistributionRes.data.distribution,
    topCars: topCarsRes.data.top_cars,
  })),




  // Register Cars
  createCar: (data: any) => $axios.post("/cars/", data),
  fetchCars: () => $axios.get("/cars/"),
  fetchCarById: (id: string) => $axios.get(`/cars/${id}/`),
  updateCar: (id: string, data: any) => $axios.put(`/cars/${id}/`, data),
  deleteCar: (id: string) => $axios.delete(`/cars/${id}/`),
  updateCarStatus: (id: string, status: string) => $axios.put(`/cars/${id}/update-status/`, { status }),

  // Customers API
  fetchCustomers: (params?: any) => $axios.get("/customers/", { params }),
  fetchCustomerById: (id: string) => $axios.get(`/customers/${id}/bookings/`),
  updateCustomer: (id: string, data: any) => $axios.put(`/customers/${id}/`, data),
  deleteCustomer: (id: string) => $axios.delete(`/customers/${id}/`),
  addGuarantor: (customerId: string, data: any) => $axios.post(`/customers/${customerId}/add_guarantor/`, data),
  fetchCustomerAnalytics: () => $axios.get("/customers/analytics/"),
  sendBulkMessage: (data: any) => $axios.post("/customers/send_bulk_message/", data),

  // Bookings API
  fetchDashboardMetrics: (params?: any) => $axios.get("/bookings/metrics/", { params }),
  fetchBookingTrends: (params?: any) => $axios.get("/bookings/trends/", { params }),
  fetchBookings: (params?: any) => $axios.get("/bookings/recent/", { params }),
  fetchBookingById: (id: string) => $axios.get(`/bookings/${id}/`),
  createBooking: (data: any) => $axios.post("/bookings/", data),
  updateBooking: (id: string, data: any) => $axios.put(`/bookings/${id}/`, data),
  deleteBooking: (id: string) => $axios.delete(`/bookings/${id}/`),
  cancelBooking: (id: string, data: any) => $axios.post(`/bookings/${id}/cancel/`, data),
  markBookingReturned: (id: string, data: any) => $axios.post(`/bookings/${id}/mark_returned/`, data),
  checkAvailability: (params: any) => $axios.get("/bookings/check_availability/", { params }),

  // Reports API
  fetchComprehensiveFinancialReport: (params: any) => $axios.get('/reports/financial/', { params }),
  exportFinancialReport: (data: any) => $axios.post('/reports/financial/export/', data),
  fetchFinancialProjections: (params: any) => $axios.get('/reports/financial/projections/', { params }),

  // Staff API
  // Staff API
  fetchStaff: (params?: any) => $axios.get("/staff/", { params }),
  fetchStaffById: (id: string) => $axios.get(`/staff/${id}/`),
  createStaff: (data: any) => $axios.post("/staff/", data),
  updateStaff: (id: string, data: any) => $axios.put(`/staff/${id}/`, data),
  deleteStaff: (id: string) => $axios.delete(`/staff/${id}/`),
  suspendStaff: (id: string) => $axios.post(`/staff/${id}/suspend/`),
  terminateStaff: (id: string, data: any) => $axios.post(`/staff/${id}/terminate/`, data),
  reactivateStaff: (id: string) => $axios.post(`/staff/${id}/reactivate/`),
  fetchStaffBookings: (id: string, params?: any) => $axios.get(`/staff/${id}/bookings/`, { params }),
  fetchStaffSalaryHistory: (id: string, params?: any) => $axios.get(`/staff/${id}/salary_history/`, { params }),
  fetchStaffDashboardMetrics: () => $axios.get("/staff/dashboard_metrics/"),
  fetchDriverPerformance: () => $axios.get("/staff/driver_performance/"),

  // Salary Payments
  fetchSalaryPayments: (params?: any) => $axios.get("/salary-payments/", { params }),
  createSalaryPayment: (data: any) => $axios.post("/salary-payments/", data),
  updateSalaryPayment: (id: string, data: any) => $axios.put(`/salary-payments/${id}/`, data),
  deleteSalaryPayment: (id: string) => $axios.delete(`/salary-payments/${id}/`),
  bulkPaySalaries: (data: any) => $axios.post("/salary-payments/bulk_pay/", data),
  fetchUpcomingPayments: () => $axios.get("/salary-payments/upcoming_payments/"),
};

export default apiService;
