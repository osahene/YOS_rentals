from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, SalaryPaymentViewSet

staff_router = DefaultRouter()
staff_router.register(r'', StaffViewSet, basename='staff')

salary_router = DefaultRouter()
salary_router.register(r'', SalaryPaymentViewSet, basename='salary-payment')

urlpatterns = [
    path('salary-payments/', include(salary_router.urls)),
    path('', include(staff_router.urls)),
]