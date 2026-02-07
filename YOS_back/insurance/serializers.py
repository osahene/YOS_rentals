from rest_framework import serializers
from .models import InsurancePolicy

class InsurancePolicySerializer(serializers.ModelSerializer):
    insurance_company = serializers.CharField()
    policy_number = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    insurance_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    is_current = serializers.BooleanField()
    
    class Meta:
        model = InsurancePolicy
        fields = [
            'id', 'insurance_company', 'policy_number', 'policy_type',
            'start_date', 'end_date', 'insurance_amount', 'is_current',
            'status'
        ]