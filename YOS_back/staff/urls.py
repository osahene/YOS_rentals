from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, SalaryPaymentViewSet

router = DefaultRouter()
router.register(r'', StaffViewSet, basename='staff')
router.register(r'', SalaryPaymentViewSet, basename='salary-payment')

urlpatterns = [
    path('', include(router.urls)),
]