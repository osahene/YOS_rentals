from django_filters import rest_framework as filters
from .models import Booking

class BookingFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="start_date", lookup_expr='gte')
    end_date = filters.DateFilter(field_name="end_date", lookup_expr='lte')
    status = filters.CharFilter(field_name="status", lookup_expr='iexact')
    customer_id = filters.NumberFilter(field_name="customer__id")
    car_id = filters.NumberFilter(field_name="car__id")
    
    class Meta:
        model = Booking
        fields = ['start_date', 'end_date', 'status', 'customer_id', 'car_id']