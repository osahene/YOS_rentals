from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.CustomerViewSet, basename='customer')
router.register(r'', views.GuarantorViewSet, basename='guarantor')

urlpatterns = [
    path('', include(router.urls)),
]