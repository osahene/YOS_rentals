from rest_framework import serializers
from .models import Car
# Update the import path below if 'insurance' is a sibling app to 'cars'
from insurance.serializers import InsurancePolicySerializer

class CarSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    fuel_type_display = serializers.CharField(source='get_fuel_type_display', read_only=True)
    transmission_display = serializers.CharField(source='get_transmission_display', read_only=True)
    
    class Meta:
        model = Car
        fields = [
            'id', 'make', 'model', 'year', 'color', 'color_hex',
            'license_plate', 'vin', 'fuel_type', 'fuel_type_display',
            'transmission', 'transmission_display', 'seats', 'mileage',
            'features', 'description', 'daily_rate', 'status', 'status_display',
            'images', 'created_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class CarDetailSerializer(CarSerializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    current_insurance = serializers.SerializerMethodField()
    
    class Meta(CarSerializer.Meta):
        fields = CarSerializer.Meta.fields + [
            'purchase_price', 'purchase_date', 'current_value',
            'total_revenue', 'total_expenses', 'net_profit',
            'current_insurance', 'is_active'
        ]
    
    def get_current_insurance(self, obj):
        current = obj.insurance_policies.filter(is_current=True).first()
        if current:
            return InsurancePolicySerializer(current).data
        return None

class CreateCarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = [
            'make', 'model', 'year', 'color', 'color_hex', 'license_plate',
            'vin', 'purchase_price', 'purchase_date', 'fuel_type',
            'transmission', 'seats', 'mileage', 'features', 'description',
            'images', 'daily_rate'
        ]
    
    def validate_license_plate(self, value):
        if Car.objects.filter(license_plate=value).exists():
            raise serializers.ValidationError("A car with this license plate already exists.")
        return value
    
    def validate_vin(self, value):
        if value and Car.objects.filter(vin=value).exists():
            raise serializers.ValidationError("A car with this VIN already exists.")
        return value