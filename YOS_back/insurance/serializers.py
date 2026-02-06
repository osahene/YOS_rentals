from rest_framework import serializers
from .models import InsurancePolicy

class InsurancePolicySerializer(serializers.ModelSerializer):
    car_id = serializers.IntegerField(source='car.id', read_only=True)
    car_make = serializers.CharField(source='car.make', read_only=True)
    car_model = serializers.CharField(source='car.model', read_only=True)
    car_year = serializers.IntegerField(source='car.year', read_only=True)
    
    class Meta:
        model = InsurancePolicy
        fields = [
            'id', 'car_id', 'car_make', 'car_model', 'car_year',
            'provider', 'policy_number', 'coverage_details',
            'start_date', 'end_date', 'premium_amount',
            'is_current'
        ]
        read_only_fields = ['id', 'car_id', 'car_make', 'car_model', 'car_year']