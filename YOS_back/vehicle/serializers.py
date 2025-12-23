# vehicle/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import (
    Vehicle, VehicleInsurance, MaintenanceRecord,
    InspectionChecklist, Booking, Payment,
    FinancialTransaction, Receipt, VehicleAvailability
)
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class VehicleSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    category_display = serializers.CharField(
        source='get_category_display', read_only=True)

    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class VehicleInsuranceSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)
    vehicle_plate = serializers.CharField(
        source='vehicle.plate_number', read_only=True)

    class Meta:
        model = VehicleInsurance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at',
                            'created_by', 'is_active')

    def validate(self, data):
        if data['issued_date'] > data['expiry_date']:
            raise serializers.ValidationError(
                "Expiry date must be after issued date"
            )
        return data


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(
        source='vehicle.plate_number', read_only=True)

    class Meta:
        model = MaintenanceRecord
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
            validated_data['is_completed'] = False

        # Create vehicle availability entry for maintenance
        vehicle = validated_data['vehicle']
        scheduled_date = validated_data['scheduled_date']

        # Estimate maintenance duration (default 1 day)
        estimated_end_date = scheduled_date + timedelta(days=1)

        # Create vehicle availability record
        VehicleAvailability.objects.create(
            vehicle=vehicle,
            start_date=scheduled_date,
            end_date=estimated_end_date,
            status='maintenance',
            reason=f"Scheduled maintenance: {validated_data.get('maintenance_type')}"
        )

        # Update vehicle status
        vehicle.update_status('maintenance')

        return super().create(validated_data)


class InspectionChecklistSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(
        source='vehicle.plate_number', read_only=True)
    inspector_name = serializers.CharField(
        source='inspector.get_full_name', read_only=True)

    class Meta:
        model = InspectionChecklist
        fields = '__all__'
        read_only_fields = ('overall_rating', 'created_at', 'updated_at')

    def validate(self, data):
        # Ensure fuel level is between 0 and 100
        fuel_level = data.get('fuel_level')
        if fuel_level and (fuel_level < 0 or fuel_level > 100):
            raise serializers.ValidationError(
                "Fuel level must be between 0 and 100"
            )
        return data


class BookingSerializer(serializers.ModelSerializer):
    vehicle_details = VehicleSerializer(source='vehicle', read_only=True)
    customer_name = serializers.SerializerMethodField()
    booking_status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(
        source='get_payment_status_display', read_only=True)

    class Meta:
        model = Booking
        exclude = ('customer_name', 'customer_email', 'customer_phone',
                   'customer_id_number', 'customer_id_type')
        read_only_fields = ('booking_reference', 'created_at', 'updated_at',
                            'created_by', 'total_amount', 'subtotal', 'balance_due',
                            'amount_paid')

    def get_customer_name(self, obj):
        if obj.customer:
            return f"{obj.customer.first_name} {obj.customer.last_name}"
        return obj.customer_name

    def validate(self, data):
        pickup_date = data.get('pickup_date')
        return_date = data.get('return_date')

        if pickup_date and return_date:
            if pickup_date >= return_date:
                raise serializers.ValidationError(
                    "Return date must be after pickup date"
                )

            # Check if dates are in the past
            if pickup_date < timezone.now():
                raise serializers.ValidationError(
                    "Pickup date cannot be in the past"
                )

            # Calculate rental days
            rental_days = (return_date - pickup_date).days
            data['rental_days'] = rental_days

            # Check vehicle availability
            vehicle = data.get('vehicle')
            if vehicle:
                # Check for overlapping bookings
                overlapping_bookings = Booking.objects.filter(
                    vehicle=vehicle,
                    status__in=['confirmed', 'in_progress'],
                    pickup_date__lt=return_date,
                    return_date__gt=pickup_date
                )

                if overlapping_bookings.exists():
                    raise serializers.ValidationError(
                        f"Vehicle is not available for the selected dates. "
                        f"Available from {overlapping_bookings.first().return_date}"
                    )

        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')
        vehicle = validated_data['vehicle']

        # Calculate pricing
        rental_days = validated_data.get('rental_days', 1)
        daily_rate = vehicle.daily_rate

        subtotal = daily_rate * rental_days
        security_deposit = vehicle.security_deposit
        total_amount = subtotal + security_deposit

        validated_data.update({
            'subtotal': subtotal,
            'security_deposit': security_deposit,
            'total_amount': total_amount,
            'daily_rate': daily_rate,
            'balance_due': total_amount,
        })

        # Set customer if authenticated
        if request and request.user.is_authenticated:
            validated_data['customer'] = request.user

        # Create booking
        booking = super().create(validated_data)

        # Create vehicle availability record
        VehicleAvailability.objects.create(
            vehicle=vehicle,
            start_date=booking.pickup_date.date(),
            end_date=booking.return_date.date(),
            status='in_use',
            booking=booking,
            reason=f"Booking #{booking.booking_reference}"
        )

        # Update vehicle status
        vehicle.update_status('in_use')

        return booking


class PaymentSerializer(serializers.ModelSerializer):
    booking_reference = serializers.CharField(
        source='booking.booking_reference', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('payment_reference', 'payment_date', 'created_at',
                            'updated_at')

    @transaction.atomic
    def create(self, validated_data):
        booking = validated_data['booking']
        amount = validated_data['amount']

        # Update booking payment status
        booking.amount_paid += amount
        booking.balance_due = booking.total_amount - booking.amount_paid

        if booking.balance_due <= 0:
            booking.payment_status = 'completed'
            booking.status = 'confirmed'
        else:
            booking.payment_status = 'pending'

        booking.save()

        # Create receipt if payment is complete
        if booking.payment_status == 'completed':
            receipt = Receipt.objects.create(
                booking=booking,
                payment=self.instance,
                subtotal=booking.subtotal,
                tax_rate=0,  # Can be configured
                tax_amount=booking.tax_amount,
                total_amount=booking.total_amount,
                amount_paid=booking.amount_paid,
                balance_due=booking.balance_due,
                due_date=booking.pickup_date.date()
            )

            # Send receipt email (async - will be implemented in tasks)
            # send_receipt_email.delay(receipt.id)

        return super().create(validated_data)


class ReceiptSerializer(serializers.ModelSerializer):
    booking_details = BookingSerializer(source='booking', read_only=True)
    payment_details = PaymentSerializer(source='payment', read_only=True)

    class Meta:
        model = Receipt
        fields = '__all__'
        read_only_fields = ('receipt_number', 'issue_date', 'created_at',
                            'updated_at', 'is_emailed', 'emailed_at')


class FinancialTransactionSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(
        source='vehicle.plate_number', read_only=True, allow_null=True)
    booking_reference = serializers.CharField(
        source='booking.booking_reference', read_only=True, allow_null=True)

    class Meta:
        model = FinancialTransaction
        fields = '__all__'
        read_only_fields = ('net_amount', 'created_at', 'updated_at',
                            'created_by', 'approved_date', 'is_approved')


class VehicleAvailabilitySerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(
        source='vehicle.plate_number', read_only=True)
    booking_reference = serializers.CharField(
        source='booking.booking_reference', read_only=True, allow_null=True)

    class Meta:
        model = VehicleAvailability
        fields = '__all__'
