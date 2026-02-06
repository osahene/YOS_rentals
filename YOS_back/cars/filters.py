from django_filters import rest_framework as filters
from .models import Car

class CarFilter(filters.FilterSet):
    """
    Filter class for Car model.
    Allows filtering by make, model, year, fuel_type, transmission, status, etc.
    """
    make = filters.CharFilter(field_name='make', lookup_expr='icontains')
    model = filters.CharFilter(field_name='model', lookup_expr='icontains')
    year = filters.NumberFilter(field_name='year')
    year_min = filters.NumberFilter(field_name='year', lookup_expr='gte')
    year_max = filters.NumberFilter(field_name='year', lookup_expr='lte')
    fuel_type = filters.ChoiceFilter(field_name='fuel_type', choices=Car.FUEL_TYPES)
    transmission = filters.ChoiceFilter(field_name='transmission', choices=Car.TRANSMISSION)
    status = filters.ChoiceFilter(field_name='status', choices=Car.CAR_STATUS)
    daily_rate_min = filters.NumberFilter(field_name='daily_rate', lookup_expr='gte')
    daily_rate_max = filters.NumberFilter(field_name='daily_rate', lookup_expr='lte')
    is_active = filters.BooleanFilter(field_name='is_active')
    
    class Meta:
        model = Car
        fields = ['make', 'model', 'year', 'fuel_type', 'transmission', 'status', 'is_active']