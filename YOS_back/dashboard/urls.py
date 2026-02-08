from django.urls import path
from .views import *

urlpatterns = [
    path('metrics/', dashboard_metrics, name='dashboard-metrics'),
    path('revenue-trends/', revenue_trends, name='revenue-trends'),
    path('recent-bookings/', recent_bookings_data, name='recent-bookings'),
    path('car-distribution/', car_type_distribution, name='car-distribution'),
    path('daily-bookings/', daily_bookings, name='daily-bookings'),
    path('top-cars/', top_performing_cars, name='top-cars'),
]