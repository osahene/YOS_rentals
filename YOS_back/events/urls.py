from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import EventViewSet, MaintenanceRecordViewSet

router = DefaultRouter()
router.register(r'', EventViewSet, basename='events')
router.register(r'maintenance', MaintenanceRecordViewSet, basename='maintenance')

urlpatterns = [
    path('', include(router.urls)),
]