from rest_framework import serializers
from .models import Customer, Guarantor


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone_number',
            'date_of_birth', 'address', 'created_at', 'full_name'
        ]
        read_only_fields = ['created_at', 'updated_at']
        
class GuarantorSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Guarantor
        fields = [
            'id', 'customer', 'first_name', 'last_name', 'email', 'phone_number',
            'relationship', 'created_at', 'full_name'
        ]
        read_only_fields = ['created_at', 'updated_at']