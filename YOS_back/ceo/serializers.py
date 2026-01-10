from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    User, Customer, Car, Driver, Payment, Booking,
    BookingHistory, Invoice, SMSLog, EmailLog
)
from django.utils import timezone
import uuid

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name',
                  'last_name', 'phone', 'role', 'is_active']
        read_only_fields = ['id']


class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'total_bookings', 'total_spent', 'average_rating']

    def validate_ghana_card_id(self, value):
        # Basic Ghana Card validation
        if len(value) < 10:
            raise serializers.ValidationError(
                "Ghana Card ID must be at least 10 characters")
        return value

    def validate_phone(self, value):
        # Ghana phone number validation
        if not value.startswith(('+233', '0')):
            raise serializers.ValidationError(
                "Phone number must start with +233 or 0")
        return value


class CarSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_available(self, obj):
        return obj.status == 'available'


class DriverSerializer(serializers.ModelSerializer):
    is_license_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Driver
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_license_expiry_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Driver's license has expired")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        method = data.get('method')

        # Validate mobile money details
        if method == 'mobile_money':
            if not data.get('mobile_money_phone'):
                raise serializers.ValidationError(
                    {"mobile_money_phone": "Phone number is required for mobile money payment"})

        # Validate pay-in-slip details
        elif method == 'pay_in_slip':
            required_fields = ['pay_in_slip_bank_name', 'pay_in_slip_branch',
                               'pay_in_slip_payee_name', 'pay_in_slip_reference_number',
                               'pay_in_slip_number']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(
                        {field: "This field is required for pay-in-slip payment"})

        return data


class BookingSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source='customer', read_only=True)
    car_details = CarSerializer(source='car', read_only=True)
    driver_details = DriverSerializer(source='driver', read_only=True)
    payment_details = PaymentSerializer(source='payment', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'subtotal', 'total_amount', 'duration_days']

    def validate(self, data):
        # Check if car is available
        car = data.get('car')
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if car and start_date and end_date:
            # Check for overlapping bookings
            overlapping_bookings = Booking.objects.filter(
                car=car,
                status__in=['confirmed', 'active'],
                start_date__lt=end_date,
                end_date__gt=start_date
            )

            if overlapping_bookings.exists():
                raise serializers.ValidationError(
                    {"car": "This car is not available for the selected dates"}
                )

        # Validate self-drive requirements
        if data.get('is_self_drive'):
            required_fields = ['driver_license_id', 'driver_license_class',
                               'driver_license_issue_date', 'driver_license_expiry_date']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(
                        {field: "This field is required for self-drive booking"}
                    )

            # Check license expiry
            expiry_date = data.get('driver_license_expiry_date')
            if expiry_date and expiry_date < timezone.now().date():
                raise serializers.ValidationError(
                    {"driver_license_expiry_date": "Driver's license has expired"}
                )
        else:
            # Validate driver selection
            if not data.get('driver'):
                raise serializers.ValidationError(
                    {"driver": "Driver is required for chauffeur-driven bookings"}
                )

        return data

    def create(self, validated_data):
        # Calculate pricing
        daily_rate = validated_data['car'].daily_rate
        duration_days = max(
            1, (validated_data['end_date'] - validated_data['start_date']).days)
        subtotal = daily_rate * duration_days
        tax_amount = subtotal * 0.1  # 10% tax
        total_amount = subtotal + tax_amount

        # Update booking with calculated values
        validated_data['daily_rate'] = daily_rate
        validated_data['duration_days'] = duration_days
        validated_data['subtotal'] = subtotal
        validated_data['tax_amount'] = tax_amount
        validated_data['total_amount'] = total_amount

        booking = super().create(validated_data)

        # Create booking history entry
        BookingHistory.objects.create(
            booking=booking,
            status=booking.status,
            notes="Booking created"
        )

        # Update customer stats
        booking.customer.update_stats(total_amount)

        return booking


class BookingCreateSerializer(serializers.ModelSerializer):
    payment = PaymentSerializer()

    class Meta:
        model = Booking
        fields = [
            'customer', 'car', 'driver', 'start_date', 'end_date',
            'pickup_location', 'dropoff_location', 'special_requests',
            'is_self_drive', 'driver_license_id', 'driver_license_class',
            'driver_license_issue_date', 'driver_license_expiry_date',
            'payment', 'notes'
        ]

    def create(self, validated_data):
        payment_data = validated_data.pop('payment')

        # Create payment first
        payment = Payment.objects.create(**payment_data)

        # Calculate pricing
        car = validated_data['car']
        daily_rate = car.daily_rate
        duration_days = max(
            1, (validated_data['end_date'] - validated_data['start_date']).days)
        subtotal = daily_rate * duration_days
        tax_amount = subtotal * 0.1  # 10% tax
        total_amount = subtotal + tax_amount

        # Create booking with payment
        booking = Booking.objects.create(
            payment=payment,
            daily_rate=daily_rate,
            duration_days=duration_days,
            subtotal=subtotal,
            tax_amount=tax_amount,
            total_amount=total_amount,
            **validated_data
        )

        # Create booking history
        BookingHistory.objects.create(
            booking=booking,
            status=booking.status,
            notes="Booking created"
        )

        # Update customer stats
        booking.customer.update_stats(total_amount)

        # Update car status
        car.status = 'rented'
        car.save()

        return booking


class InvoiceSerializer(serializers.ModelSerializer):
    booking_details = BookingSerializer(source='booking', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'invoice_number']


class BookingHistorySerializer(serializers.ModelSerializer):
    changed_by_details = UserSerializer(source='changed_by', read_only=True)

    class Meta:
        model = BookingHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class SMSLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSLog
        fields = '__all__'
        read_only_fields = ['id', 'sent_at']


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = '__all__'
        read_only_fields = ['id', 'sent_at']


class DashboardStatsSerializer(serializers.Serializer):
    total_bookings = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_bookings = serializers.IntegerField()
    available_cars = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_bookings = serializers.IntegerField()
