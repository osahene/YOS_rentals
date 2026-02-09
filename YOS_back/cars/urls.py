from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
router = DefaultRouter()
router.register(r'', views.CarViewSet, basename='cars')

urlpatterns = [
    path("public/", views.public_cars_list, name='public-cars-list'),
    path("public/<uuid:car_id>/", views.public_car_detail, name='public-car-detail'),
    path("", include(router.urls)),
]