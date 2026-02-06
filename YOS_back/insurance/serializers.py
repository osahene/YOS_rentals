from rest_framework import serializers
from .models import InsurancePolicy

class InsurancePolicySerializer(serializers.ModelSerializer):
    insurance_company = serializers.CharField(source='insurance_company')
    policy_number = serializers.CharField(source='policy_number')
    start_date = serializers.DateField(source='start_date')
    end_date = serializers.DateField(source='end_date')
    premium = serializers.DecimalField(source='premium', max_digits=10, decimal_places=2)
    is_current = serializers.BooleanField(source='is_current')
    
    class Meta:
        model = InsurancePolicy
        fields = [
            'id', 'insurance_company', 'policy_number', 'policy_type',
            'startDate', 'endDate', 'premium', 'isCurrent',
            'insurance_amount', 'status'
        ]