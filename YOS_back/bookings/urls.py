from django.urls import path, include
from . import views

urlpatterns = [
    path("", views.BookingViewSet.as_view({'get': 'list', 'post': 'create'}), name="booking-list-create"),
    path("<int:pk>/", views.BookingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name="booking-detail"),
]