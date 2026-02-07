from rest_framework import serializers
from .models import InsurancePolicy

class InsurancePolicySerializer(serializers.ModelSerializer):
    insurance_company = serializers.CharField(source='insurance_company')
    policy_number = serializers.CharField(source='policy_number')
    start_date = serializers.DateField(source='start_date')
    end_date = serializers.DateField(source='end_date')
    insurance_amount = serializers.DecimalField(source='insurance_amount', max_digits=12, decimal_places=2)
    is_current = serializers.BooleanField(source='is_current')
    
    class Meta:
        model = InsurancePolicy
        fields = [
            'id', 'insurance_company', 'policy_number', 'policy_type',
            'start_date', 'end_date', 'insurance_amount', 'is_current',
            'status'
        ]