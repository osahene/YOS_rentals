from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'cars', views.CarViewSet)
router.register(r'drivers', views.DriverViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'bookings', views.BookingViewSet)
router.register(r'invoices', views.InvoiceViewSet)

urlpatterns = [
    # Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API endpoints
    path('', include(router.urls)),

    # Payment gateway
    path('payments/gateway/', views.PaymentGatewayView.as_view(),
         name='payment_gateway'),

    # Dashboard
    path('dashboard/stats/', views.DashboardStatsView.as_view(),
         name='dashboard_stats'),
    path('dashboard/reports/', views.ReportView.as_view(),
         name='dashboard_reports'),

    # Booking actions
    path('bookings/<uuid:booking_id>/send-confirmation/',
         views.send_booking_confirmation,
         name='send_booking_confirmation'),
]
