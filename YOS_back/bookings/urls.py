from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet

router = DefaultRouter()
router.register(r'', BookingViewSet, basename='booking')

urlpatterns = [
    # Custom endpoints
    path('metrics/', BookingViewSet.as_view({'get': 'dashboard_metrics'}), name='dashboard-metrics'),
    path('trends/', BookingViewSet.as_view({'get': 'booking_trends'}), name='booking-trends'),
    path('recent/', BookingViewSet.as_view({'get': 'recent_bookings'}), name='recent-bookings'),
    path('', include(router.urls)),
]