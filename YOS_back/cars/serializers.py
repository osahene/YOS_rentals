from rest_framework import serializers
from django.db import transaction

from .models import Car
# Update the import path below if 'insurance' is a sibling app to 'cars'
from django.core.files.storage import default_storage
import uuid
from insurance.serializers import InsurancePolicySerializer
from insurance.models import InsurancePolicy
import json

class CarSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    fuel_type_display = serializers.CharField(source='get_fuel_type_display', read_only=True)
    transmission_display = serializers.CharField(source='get_transmission_display', read_only=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    
    class Meta:
        model = Car
        fields = [
            'id', 'make', 'model', 'year', 'color', 'color_hex',
            'license_plate', 'vin', 'fuel_type', 'fuel_type_display',
            'transmission', 'transmission_display', 'seats', 'mileage',
            'features', 'description', 'status', 'status_display',
            'images', 'created_at', 'total_revenue', 'total_expenses', 'net_profit',
        ]
        read_only_fields = ['created_at', 'updated_at', 'total_revenue', 'total_expenses', 'net_profit']

class CarDetailSerializer(CarSerializer):
    current_insurance = serializers.SerializerMethodField()
    insurance_policies = InsurancePolicySerializer(many=True, read_only=True)
    maintenance_records = serializers.SerializerMethodField()
    bookings = serializers.SerializerMethodField()
    
    class Meta(CarSerializer.Meta):
        fields = CarSerializer.Meta.fields + [
            'purchase_price', 'purchase_date', 'current_value',
            'current_insurance', 'insurance_policies', 'maintenance_records',
            'bookings', 'is_active'
        ]
    
    def get_current_insurance(self, obj):
        current = obj.insurance_policies.filter(is_current=True).first()
        if current:
            return InsurancePolicySerializer(current).data
        return None
    
    def get_maintenance_records(self, obj):
        from events.serializers import MaintenanceRecordSerializer
        records = obj.maintenance_records.all()[:10]  # Limit to 10 records
        return MaintenanceRecordSerializer(records, many=True).data
    
    def get_bookings(self, obj):
        from bookings.serializers import BookingSerializer
        bookings = obj.bookings.all()[:10]  # Limit to 10 records
        return BookingSerializer(bookings, many=True).data

class CreateCarSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        required=False,
        write_only=True
    )
    features = serializers.JSONField(required=False)
    insurance_company = serializers.CharField(write_only=True)
    policy_number = serializers.CharField(write_only=True)
    policy_type = serializers.CharField(write_only=True)
    insurance_amount = serializers.DecimalField(max_digits=12, decimal_places=2, write_only=True)
    insurance_start_date = serializers.DateField(write_only=True)
    insurance_end_date = serializers.DateField(write_only=True)
    
    class Meta:
        model = Car
        fields = [
            'make', 'model', 'year', 'color', 'color_hex', 'license_plate',
            'vin', 'purchase_price', 'purchase_date', 'fuel_type',
            'transmission', 'seats', 'mileage', 'features', 'description',
            'images', 'insurance_company', 'policy_number', 'policy_type',
            'insurance_amount', 'insurance_start_date', 'insurance_end_date'
        ]
    
    def validate_features(self, value):
        """Convert features to proper JSON format"""
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return value
    
    def create(self, validated_data):
        insurance_payload = {
            'insurance_company': validated_data.pop('insurance_company'),
            'policy_number': validated_data.pop('policy_number'),
            'policy_type': validated_data.pop('policy_type'),
            'insurance_amount': validated_data.pop('insurance_amount'),
            'start_date': validated_data.pop('insurance_start_date'),
            'end_date': validated_data.pop('insurance_end_date'),
        }
        images_data = validated_data.pop('images', [])

        with transaction.atomic():
            car = Car.objects.create(**validated_data)
            
            InsurancePolicy.objects.create(
                car=car,
                is_current=True,
                status='active',
                **insurance_payload
            )

            image_urls = []
            for image in images_data:
                ext = image.name.split('.')[-1]
                filename = f"{uuid.uuid4()}.{ext}"
                path = default_storage.save(f'cars/{filename}', image)
                url = default_storage.url(path)
                image_urls.append(url)
            
            # Save the list of URLs to the car's JSONField
            car.images = image_urls
            car.save()

        return car
    
    def validate_license_plate(self, value):
        if Car.objects.filter(license_plate=value).exists():
            raise serializers.ValidationError("A car with this license plate already exists.")
        return value
    
    def validate_vin(self, value):
        if value and Car.objects.filter(vin=value).exists():
            raise serializers.ValidationError("A car with this VIN already exists.")
        return value