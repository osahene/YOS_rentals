# vehicle/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, VehicleInsuranceViewSet,
    MaintenanceRecordViewSet, InspectionChecklistViewSet,
    BookingViewSet, PaymentViewSet,
    FinancialTransactionViewSet, ReceiptViewSet,
    VehicleAvailabilityViewSet
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'insurances', VehicleInsuranceViewSet, basename='insurance')
router.register(r'maintenance', MaintenanceRecordViewSet,
                basename='maintenance')
router.register(r'inspections', InspectionChecklistViewSet,
                basename='inspection')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'transactions', FinancialTransactionViewSet,
                basename='transaction')
router.register(r'receipts', ReceiptViewSet, basename='receipt')
router.register(r'availabilities', VehicleAvailabilityViewSet,
                basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]
