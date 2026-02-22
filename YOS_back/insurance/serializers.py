from rest_framework import serializers
from .models import InsurancePolicy, InsuranceRenewal

class InsurancePolicySerializer(serializers.ModelSerializer):
    provider = serializers.CharField(source='insurance_company')
    policyNumber = serializers.CharField(source='policy_number')
    coverageType = serializers.CharField(source='policy_type')
    premium = serializers.DecimalField(source='insurance_amount', max_digits=12, decimal_places=2)
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')
    vehicleId = serializers.UUIDField(source='car.id', read_only=True)

    # New fields

    class Meta:
        model = InsurancePolicy
        fields = [
            'id', 'provider', 'policyNumber', 'coverageType',
            'startDate', 'endDate', 'premium', 
            'status', 'vehicleId', 'is_current'
        ]

    def create(self, validated_data):
       # Handle vehicle association
        vehicle_id = self.initial_data.get('vehicleId') if isinstance(self.initial_data, dict) else None  # from raw request data
        if vehicle_id:
            from cars.models import Car  # adjust import
            try:
                car = Car.objects.get(id=vehicle_id)
                validated_data['car'] = car
            except Car.DoesNotExist:
                raise serializers.ValidationError({'vehicleId': 'Car not found'})
        
        return super().create(validated_data)