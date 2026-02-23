from rest_framework import serializers
from django.utils import timezone
from datetime import datetime

from .models import Booking
from customers.serializers import CustomerSerializer, GuarantorSerializer
from cars.serializers import CarSerializer

class BookingSerializer(serializers.ModelSerializer):
    car_details = CarSerializer(source='car', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    driver_license_issue_date = serializers.SerializerMethodField(source='customer.driver_license_issue_date', read_only=True)
    driver_license_expiry_date = serializers.SerializerMethodField(source='customer.driver_license_expiry_date', read_only=True)
    guarantor_name = serializers.SerializerMethodField()
    duration_days = serializers.IntegerField(read_only=True)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    pickup_location = serializers.CharField(read_only=True)
    dropoff_location = serializers.CharField(read_only=True)
    daily_rate = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    payment_method = serializers.CharField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'car', 'car_details', 'customer', 'customer_name', 
            'driver_license_issue_date', 'driver_license_expiry_date',
            'start_date', 'end_date', 'duration_days', 'total_amount', 
            'amount_paid', 'status', 'status_display', 'payment_method',
            'payment_method_display', 'payment_status', 'payment_status_display',
            'created_at', 'is_self_drive', 'guarantor', 'guarantor_name',
            'pickup_location', 'dropoff_location', 'daily_rate', 'payment_method',
        ]
        read_only_fields = ['created_at', 'updated_at']
        
    def get_customer_name(self, obj):
        if obj.customer:
            return f"{obj.customer.first_name} {obj.customer.last_name}"
        return "Unknown Customer"
    def get_driver_license_issue_date(self, obj):
        if obj.customer and obj.customer.driver_license_issue_date:
            return obj.customer.driver_license_issue_date
        return "Unknown Issue Date"
    def get_driver_license_expiry_date(self, obj):
        if obj.customer and obj.customer.driver_license_expiry_date:
            return obj.customer.driver_license_expiry_date
        return "Unknown Expiry Date"
    
    def get_guarantor_name(self, obj):
        if obj.guarantor:
            return f"{obj.guarantor.first_name} {obj.guarantor.last_name}"
        return "No guarantor"

class BookingDetailSerializer(BookingSerializer):
    customer = CustomerSerializer(read_only=True)
    guarantor = GuarantorSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    
    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + [
            'customer', 'guarantor', 'pickup_location', 'dropoff_location',
            'special_requests', 'driver', 'is_self_drive', 'driver_license_id',
            'driver_license_class', 'refund_amount', 'late_fee', 'penalty_amount',
            'actual_return_time', 'cancellation_reason', 'mobile_money_provider',
            'mobile_money_number', 'pay_in_slip_bank', 'pay_in_slip_number'
        ]

class CreateBookingSerializer(serializers.ModelSerializer):
    from customers.models import Customer
    # For new customer creation
    customer_data = serializers.JSONField(write_only=True, required=False)
    guarantor_data = serializers.JSONField(write_only=True, required=False)
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True
    )

    
    class Meta:
        model = Booking
        fields = [
            'id', 'car', 'customer', 'guarantor' 'start_date', 'daily_rate', 'discount', 'end_date', 'pickup_location',
            'dropoff_location', 'special_requests', 'driver', 'is_self_drive',
            'driver_license_id', 'driver_license_class', 'driver_license_issue_date', 'driver_license_expiry_date',
            'payment_method', 
            'customer_data', 'guarantor_data',
            'mobile_money_provider', 'mobile_money_number',
            'pay_in_slip_bank', 'pay_in_slip_branch', 'pay_in_slip_payee',
            'pay_in_slip_reference', 'pay_in_slip_number', 'pay_in_slip_date'
        ]
    
    def validate(self, attrs):
        
        # Check date validity
        if attrs['start_date'] >= attrs['end_date']:
            raise serializers.ValidationError("End date must be after start date.")
        
        # Check if booking is in the past
        if attrs['start_date'] < timezone.now().date():
            raise serializers.ValidationError("Cannot book for past dates.")
        
        # Check self-drive requirements
        if attrs.get('is_self_drive'):
            if not attrs.get('driver_license_id'):
                raise serializers.ValidationError("Driver license ID is required for self-drive.")
            if not attrs.get('driver_license_class'):
                raise serializers.ValidationError("Driver license class is required for self-drive.")
        else:
            if not attrs.get('driver'):
                raise serializers.ValidationError("Driver is required for chauffeur service.")
        
        # Validate mobile money details
        if attrs.get('payment_method') == 'mobile_money':
            if not attrs.get('mobile_money_number'):
                raise serializers.ValidationError("Mobile money number is required.")
        
        # Validate pay-in-slip details
        if attrs.get('payment_method') == 'pay_in_slip':
            required_fields = ['pay_in_slip_bank', 'pay_in_slip_branch', 
                             'pay_in_slip_payee', 'pay_in_slip_reference', 
                             'pay_in_slip_number', 'pay_in_slip_date']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError(f"{field.replace('_', ' ').title()} is required for pay-in-slip.")
        
        return attrs
    
    def create(self, validated_data):
        # Extract customer and guarantor data
        customer_data = validated_data.pop('customer_data', None)
        guarantor_data = validated_data.pop('guarantor_data', None)
        
        # Create or get customer
        if customer_data:
            from customers.models import Customer, Guarantor
            
            # Create customer
            customer = Customer.objects.create(**customer_data)
            
            # Create guarantor if provided
            if guarantor_data:
                guarantor_data['customer'] = customer
                guarantor = Guarantor.objects.create(**guarantor_data)
                validated_data['guarantor'] = guarantor
            
            validated_data['customer'] = customer
        
        # Calculate daily rate from car
        
        # Create booking
        booking = super().create(validated_data)
        
        return booking