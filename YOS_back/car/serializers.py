from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    User, Customer, Car, Driver, Payment, Booking,
    BookingHistory, Invoice, SMSLog, EmailLog, Expense, ExpenseCategory, CapitalExpenditure, FinancialReport
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

    def validate(self, attrs):
        method = attrs.get('method')

        # Validate mobile money details
        if method == 'mobile_money':
            if not attrs.get('mobile_money_phone'):
                raise serializers.ValidationError(
                    {"mobile_money_phone": "Phone number is required for mobile money payment"})

        # Validate pay-in-slip details
        elif method == 'pay_in_slip':
            required_fields = ['pay_in_slip_bank_name', 'pay_in_slip_branch',
                               'pay_in_slip_payee_name', 'pay_in_slip_reference_number',
                               'pay_in_slip_number']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError(
                        {field: "This field is required for pay-in-slip payment"})

        return attrs


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

    def validate(self, attrs):
        # Check if car is available
        car = attrs.get('car')
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

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
        if attrs.get('is_self_drive'):
            required_fields = ['driver_license_id', 'driver_license_class',
                               'driver_license_issue_date', 'driver_license_expiry_date']
            for field in required_fields:
                if not attrs.get(field):
                    raise serializers.ValidationError(
                        {field: "This field is required for self-drive booking"}
                    )

            # Check license expiry
            expiry_date = attrs.get('driver_license_expiry_date')
            if expiry_date and expiry_date < timezone.now().date():
                raise serializers.ValidationError(
                    {"driver_license_expiry_date": "Driver's license has expired"}
                )
        else:
            # Validate driver selection
            if not attrs.get('driver'):
                raise serializers.ValidationError(
                    {"driver": "Driver is required for chauffeur-driven bookings"}
                )

        return attrs

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


# Add these serializers at the end of serializers.py

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name', read_only=True)
    car_details = serializers.SerializerMethodField()
    recorded_by_name = serializers.CharField(
        source='recorded_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_car_details(self, obj):
        if obj.car:
            return {
                'id': obj.car.id,
                'make': obj.car.make,
                'model': obj.car.model,
                'license_plate': obj.car.license_plate
            }
        return None

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class CapitalExpenditureSerializer(serializers.ModelSerializer):
    car_details = CarSerializer(source='car', read_only=True)
    current_depreciation = serializers.SerializerMethodField()
    current_book_value = serializers.SerializerMethodField()

    class Meta:
        model = CapitalExpenditure
        fields = '__all__'
        read_only_fields = ['id', 'created_at',
                            'updated_at', 'total_initial_cost']

    def get_current_depreciation(self, obj):
        return obj.calculate_depreciation_to_date()

    def get_current_book_value(self, obj):
        depreciation = obj.calculate_depreciation_to_date()
        return obj.total_initial_cost - depreciation


class FinancialReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(
        source='generated_by.get_full_name', read_only=True)
    period_duration = serializers.SerializerMethodField()

    class Meta:
        model = FinancialReport
        fields = '__all__'
        read_only_fields = ['id', 'generated_at', 'total_income', 'total_operating_expenses',
                            'total_capital_expenditure', 'net_profit', 'profit_margin',
                            'income_breakdown', 'expense_breakdown', 'vehicle_performance',
                            'financial_metrics']

    def get_period_duration(self, obj):
        delta = obj.period_end - obj.period_start
        return delta.days + 1


class FinancialSummarySerializer(serializers.Serializer):
    period_start = serializers.DateField()
    period_end = serializers.DateField()

    # Income
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    booking_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    other_income = serializers.DecimalField(max_digits=12, decimal_places=2)

    # Expenses
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    maintenance_expenses = serializers.DecimalField(
        max_digits=12, decimal_places=2)
    insurance_expenses = serializers.DecimalField(
        max_digits=12, decimal_places=2)
    fuel_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    staff_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    administrative_expenses = serializers.DecimalField(
        max_digits=12, decimal_places=2)
    other_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)

    # Capital Expenditure
    capital_expenditure = serializers.DecimalField(
        max_digits=12, decimal_places=2)
    new_car_purchases = serializers.DecimalField(
        max_digits=12, decimal_places=2)
    major_repairs = serializers.DecimalField(max_digits=12, decimal_places=2)
    equipment_purchases = serializers.DecimalField(
        max_digits=12, decimal_places=2)

    # Profitability
    gross_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit_margin = serializers.FloatField()

    # Vehicle Performance
    total_vehicles = serializers.IntegerField()
    active_vehicles = serializers.IntegerField()
    average_utilization_rate = serializers.FloatField()
    revenue_per_vehicle = serializers.DecimalField(
        max_digits=12, decimal_places=2)
    profit_per_vehicle = serializers.DecimalField(
        max_digits=12, decimal_places=2)

    # Charts Data
    monthly_breakdown = serializers.ListField(child=serializers.DictField())
    category_breakdown = serializers.ListField(child=serializers.DictField())
    vehicle_performance = serializers.ListField(child=serializers.DictField())


class ReportRequestSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(
        choices=['monthly', 'annual', 'custom'])
    year = serializers.IntegerField(required=False)
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    include_charts = serializers.BooleanField(default=True)

    def validate(self, attrs):
        report_type = attrs.get('report_type')

        if report_type == 'monthly':
            if not attrs.get('year') or not attrs.get('month'):
                raise serializers.ValidationError({
                    "year": "Year is required for monthly report",
                    "month": "Month is required for monthly report"
                })

        elif report_type == 'annual':
            if not attrs.get('year'):
                raise serializers.ValidationError({
                    "year": "Year is required for annual report"
                })

        elif report_type == 'custom':
            if not attrs.get('start_date') or not attrs.get('end_date'):
                raise serializers.ValidationError({
                    "start_date": "Start date is required for custom report",
                    "end_date": "End date is required for custom report"
                })
            if attrs['start_date'] > attrs['end_date']:
                raise serializers.ValidationError({
                    "start_date": "Start date must be before end date"
                })

        return attrs
