from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views



urlpatterns = [
    # Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),



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
