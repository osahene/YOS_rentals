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
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Guarantor
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'ghana_card_id', 'relationship', 'occupation', 'gps_address',
            'address_city', 'address_region', 'address_country',
            'created_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class CustomerListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    total_bookings = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    last_booking = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    loyalty_tier_display = serializers.CharField(source='get_loyalty_tier_display', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'total_bookings', 'total_spent', 'last_booking', 'status',
            'status_display', 'loyalty_tier', 'loyalty_tier_display',
            'occupation', 'address_city', 'created_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def get_total_bookings(self, obj):
        return obj.total_bookings
    
    def get_total_spent(self, obj):
        return float(obj.total_spent)
    
    def get_last_booking(self, obj):
        if obj.last_booking:
            return obj.last_booking
        return None

class CustomerDetailSerializer(CustomerListSerializer):
    guarantors = GuarantorSerializer(many=True, read_only=True)
    bookings = serializers.SerializerMethodField()
    communication_preferences = serializers.JSONField(read_only=True)
    
    class Meta(CustomerListSerializer.Meta):
        fields = CustomerListSerializer.Meta.fields + [
            'ghana_card_id', 'driver_license_id', 'driver_license_class',
            'driver_license_issue_date', 'driver_license_expiry_date',
            'occupation', 'gps_address', 'address_city', 'address_region',
            'address_country', 'preferred_vehicle_type',
            'communication_preferences', 'guarantors', 'bookings',
            'last_booking_date'
        ]
    
    def get_bookings(self, obj):
        # Get last 10 bookings for the customer
        from bookings.models import Booking
        from bookings.serializers import BookingSerializer
        bookings = Booking.objects.filter(customer=obj).order_by('-created_at')[:10]
        return BookingSerializer(bookings, many=True).data

class CreateCustomerSerializer(serializers.ModelSerializer):
    guarantors = GuarantorSerializer(many=True, required=False)
    
    class Meta:
        model = Customer
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'ghana_card_id', 'driver_license_id', 'driver_license_class',
            'driver_license_issue_date', 'driver_license_expiry_date',
            'occupation', 'gps_address', 'address_city', 'address_region',
            'address_country', 'preferred_vehicle_type',
            'communication_preferences', 'guarantors'
        ]
    
    def create(self, validated_data):
        guarantors_data = validated_data.pop('guarantors', [])
        customer = Customer.objects.create(**validated_data)
        
        for guarantor_data in guarantors_data:
            Guarantor.objects.create(customer=customer, **guarantor_data)
        
        return customer

class UpdateCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'ghana_card_id', 'driver_license_id', 'driver_license_class',
            'driver_license_issue_date', 'driver_license_expiry_date',
            'occupation', 'gps_address', 'address_city', 'address_region',
            'address_country', 'preferred_vehicle_type',
            'communication_preferences', 'status', 'loyalty_tier'
        ]
        
class BookingWithGuarantorSerializer(serializers.ModelSerializer):
    customer_first_name = serializers.SerializerMethodField()
    customer_last_name = serializers.SerializerMethodField()
    guarantor_name = serializers.SerializerMethodField()
    guarantor_phone = serializers.SerializerMethodField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    class Meta:
        from bookings.models import Booking
        model = Booking
        fields = ['id', 'start_date', 'end_date', 'guarantor_name', 'guarantor_phone']

    def get_guarantor_name(self, obj):
        if obj.guarantor:
            return f"{obj.guarantor.first_name} {obj.guarantor.last_name}"
        return "N/A"

    def get_guarantor_phone(self, obj):
        return obj.guarantor.phone if obj.guarantor else "N/A"