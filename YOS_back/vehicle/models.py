# vehicle/models.py
from django.db import models
import uuid
from django.contrib.auth import get_user_model
from encrypted_fields.fields import (
    EncryptedCharField, EncryptedEmailField,
)
import random
import string
import datetime
from django.utils import timezone

User = get_user_model()

# Constants
VEHICLE_STATUS_CHOICES = [
    ('available', 'Available'),
    ('in_use', 'In Use'),
    ('maintenance', 'Maintenance'),
    ('unavailable', 'Unavailable'),
]

VEHICLE_TRANSMISSION_TYPES = [
    ('automatic', 'Automatic'),
    ('manual', 'Manual'),
    ('semi-automatic', 'Semi-Automatic'),
]

VEHICLE_FUEL_TYPES = [
    ('petrol', 'Petrol'),
    ('diesel', 'Diesel'),
    ('electric', 'Electric'),
    ('hybrid', 'Hybrid'),
]

VEHICLE_INSURANCE_TYPES = [
    ('comprehensive', 'Comprehensive'),
    ('motor_third_party_only', 'Motor Third Party Only'),
    ('third_party_fire_theft', 'Third Party, Fire and Theft'),
]

VEHICLE_CATEGORIES = [
    ('sedan', 'Sedan'),
    ('suv', 'SUV'),
    ('hatchback', 'Hatchback'),
    ('convertible', 'Convertible'),
    ('coupe', 'Coupe'),
    ('wagon', 'Wagon'),
    ('van', 'Van'),
    ('truck', 'Truck'),
    ('bus', 'Bus'),
    ('other', 'Other'),
]

BOOKING_TYPES = [
    ('online', 'Online'),
    ('walk_in', 'Walk-in'),
]

BOOKING_STATUS = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

INSPECTION_STATUS = [
    ('pending', 'Pending Inspection'),
    ('passed', 'Passed'),
    ('failed', 'Failed - Needs Repair'),
    ('damaged', 'Damaged - Additional Charges'),
]

PAYMENT_METHODS = [
    ('cash', 'Cash'),
    ('card', 'Credit/Debit Card'),
    ('mobile_money', 'Mobile Money'),
    ('bank_transfer', 'Bank Transfer'),
]

PAYMENT_STATUS = [
    ('pending', 'Pending'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
    ('refunded', 'Refunded'),
]


class Vehicle(models.Model):
    """Main vehicle information model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vin = models.CharField(max_length=17, unique=True, db_index=True)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    plate_number = models.CharField(max_length=17, unique=True)
    chassis_number = models.CharField(max_length=100, unique=True)
    transmission_type = models.CharField(
        max_length=50, choices=VEHICLE_TRANSMISSION_TYPES)
    fuel_type = models.CharField(max_length=50, choices=VEHICLE_FUEL_TYPES)
    fuel_capacity = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True)
    engine_capacity = models.CharField(max_length=50, null=True, blank=True)
    seats = models.IntegerField()
    category = models.CharField(max_length=100, choices=VEHICLE_CATEGORIES)
    color = models.CharField(max_length=50)
    mileage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=VEHICLE_STATUS_CHOICES, default='available')
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2)
    weekly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='vehicles_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'category']),
            models.Index(fields=['make', 'model']),
        ]

    def __str__(self):
        return f"{self.year} {self.make} {self.model} ({self.plate_number})"

    def update_status(self, new_status):
        """Helper method to update vehicle status"""
        self.status = new_status
        self.save()
        return self


class VehicleInsurance(models.Model):
    """Vehicle insurance information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name='insurances')
    insurance_type = models.CharField(
        max_length=100, choices=VEHICLE_INSURANCE_TYPES)
    insurance_company = models.CharField(max_length=200)
    policy_number = EncryptedCharField(max_length=100)
    premium_amount = models.DecimalField(max_digits=10, decimal_places=2)
    coverage_amount = models.DecimalField(max_digits=15, decimal_places=2)
    issued_date = models.DateField()
    expiry_date = models.DateField()
    is_active = models.BooleanField(default=True)
    documents_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-expiry_date']
        verbose_name_plural = 'Vehicle Insurances'

    def __str__(self):
        return f"{self.insurance_type} - {self.vehicle.plate_number} (Expires: {self.expiry_date})"

    def save(self, *args, **kwargs):
        # Update is_active based on expiry date
        if self.expiry_date < timezone.now().date():
            self.is_active = False
        super().save(*args, **kwargs)


class MaintenanceRecord(models.Model):
    """Vehicle maintenance records"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name='maintenance_records')
    maintenance_type = models.CharField(max_length=100)
    scheduled_date = models.DateField()
    actual_date = models.DateField(null=True, blank=True)
    service_center = models.CharField(max_length=200)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    odometer_reading = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    parts_replaced = models.TextField(blank=True, null=True)
    mechanic_name = models.CharField(max_length=200, blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    next_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_mileage = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)
    receipt_url = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_date']

    def __str__(self):
        return f"{self.maintenance_type} - {self.vehicle.plate_number} on {self.scheduled_date}"


class InspectionChecklist(models.Model):
    """Vehicle inspection checklist before and after rental"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name='inspections')
    inspection_type = models.CharField(max_length=50, choices=[
        ('pre_rental', 'Pre-Rental'),
        ('post_rental', 'Post-Rental'),
        ('scheduled', 'Scheduled'),
        ('damage', 'Damage Assessment'),
    ])
    inspection_date = models.DateTimeField()
    inspector = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='inspections_conducted')

    # Inspection items (all fields use 1-5 rating or boolean)
    exterior_condition = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)], default=5)
    interior_condition = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)], default=5)
    tire_condition = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)], default=5)
    engine_condition = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)], default=5)
    brakes_condition = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)], default=5)
    lights_working = models.BooleanField(default=True)
    ac_working = models.BooleanField(default=True)
    windshield_condition = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)], default=5)
    upholstery_condition = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)], default=5)

    # Damage assessment
    has_damage = models.BooleanField(default=False)
    damage_description = models.TextField(blank=True, null=True)
    damage_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)

    # Fuel and mileage
    fuel_level = models.IntegerField(help_text="Percentage (0-100)")
    odometer_reading = models.DecimalField(max_digits=10, decimal_places=2)

    # Overall assessment
    overall_rating = models.IntegerField(
        choices=[(i, str(i)) for i in range(1, 6)])
    status = models.CharField(
        max_length=20, choices=INSPECTION_STATUS, default='pending')
    notes = models.TextField(blank=True, null=True)

    # Photos/documentation
    photos_url = models.JSONField(
        blank=True, null=True, help_text="JSON array of photo URLs")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-inspection_date']

    def __str__(self):
        return f"Inspection - {self.vehicle.plate_number} - {self.inspection_type} - {self.inspection_date}"

    def save(self, *args, **kwargs):
        # Calculate overall rating as average of all condition ratings
        ratings = [
            self.exterior_condition,
            self.interior_condition,
            self.tire_condition,
            self.engine_condition,
            self.brakes_condition,
            self.windshield_condition,
            self.upholstery_condition,
        ]
        self.overall_rating = sum(ratings) // len(ratings)
        super().save(*args, **kwargs)


class Booking(models.Model):
    """Vehicle booking/reservation model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_reference = models.CharField(
        max_length=20, unique=True, editable=False)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name='bookings')
    customer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='bookings')
    booking_type = models.CharField(
        max_length=20, choices=BOOKING_TYPES, default='online')

    # Booking dates
    pickup_date = models.DateTimeField()
    return_date = models.DateTimeField()
    actual_pickup_date = models.DateTimeField(null=True, blank=True)
    actual_return_date = models.DateTimeField(null=True, blank=True)

    # Rental details
    rental_days = models.IntegerField()
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2)

    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    damage_charges = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    balance_due = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)

    # Status and tracking
    status = models.CharField(
        max_length=20, choices=BOOKING_STATUS, default='pending')
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='pending')

    # Inspection references
    pre_inspection = models.ForeignKey(InspectionChecklist, on_delete=models.SET_NULL,
                                       null=True, blank=True, related_name='pre_rental_bookings')
    post_inspection = models.ForeignKey(InspectionChecklist, on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='post_rental_bookings')

    # Customer info (encrypted for walk-ins who aren't registered users)
    customer_name = EncryptedCharField(max_length=200, blank=True, null=True)
    customer_email = EncryptedEmailField(blank=True, null=True)
    customer_phone = EncryptedCharField(max_length=50, blank=True, null=True)
    customer_id_type = models.CharField(max_length=50, blank=True, null=True)
    customer_id_number = EncryptedCharField(
        max_length=100, blank=True, null=True)

    # Delivery/Pickup
    pickup_location = models.CharField(max_length=500)
    return_location = models.CharField(max_length=500, blank=True, null=True)

    # Additional services
    additional_driver = models.BooleanField(default=False)
    gps_required = models.BooleanField(default=False)
    child_seat = models.BooleanField(default=False)

    # Terms and conditions
    terms_accepted = models.BooleanField(default=False)

    # Meta
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='bookings_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['booking_reference']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['pickup_date', 'return_date']),
        ]

    def __str__(self):
        return f"Booking {self.booking_reference} - {self.customer.email}"

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = 'BK' + \
                ''.join(random.choices(string.digits, k=8))

        # Calculate balance due
        self.balance_due = self.total_amount - self.amount_paid

        super().save(*args, **kwargs)

    def calculate_extension_charges(self, new_return_date):
        """Calculate charges for extending the rental period"""

        if new_return_date > self.return_date:
            extension_days = (new_return_date - self.return_date).days
            return extension_days * self.daily_rate
        return 0


class Payment(models.Model):
    """Payment records for bookings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='payments')
    payment_reference = models.CharField(
        max_length=50, unique=True, editable=False)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_date = models.DateTimeField(auto_now_add=True)
    transaction_id = EncryptedCharField(max_length=200, blank=True, null=True)
    payer_name = EncryptedCharField(max_length=200, blank=True, null=True)
    payer_email = EncryptedEmailField(blank=True, null=True)
    payer_phone = EncryptedCharField(max_length=50, blank=True, null=True)

    # Payment processor details
    # e.g., 'paystack', 'stripe'
    processor = models.CharField(max_length=50, blank=True, null=True)
    processor_response = models.JSONField(blank=True, null=True)

    status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='pending')
    is_refundable = models.BooleanField(default=False)
    refunded_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment {self.payment_reference} - ${self.amount}"

    def save(self, *args, **kwargs):
        if not self.payment_reference:
            self.payment_reference = 'PAY' + \
                ''.join(random.choices(string.digits, k=10))
        super().save(*args, **kwargs)


class FinancialTransaction(models.Model):
    """Comprehensive financial transactions for accounting"""
    TRANSACTION_TYPES = [
        ('revenue', 'Revenue'),
        ('expense', 'Expense'),
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('equity', 'Equity'),
    ]

    CATEGORIES = [
        ('rental_income', 'Rental Income'),
        ('late_fee', 'Late Fee'),
        ('damage_fee', 'Damage Fee'),
        ('fuel_surcharge', 'Fuel Surcharge'),
        ('maintenance', 'Maintenance'),
        ('insurance', 'Insurance'),
        ('fuel', 'Fuel'),
        ('cleaning', 'Cleaning'),
        ('repair', 'Repair'),
        ('salary', 'Salary'),
        ('office_supplies', 'Office Supplies'),
        ('utilities', 'Utilities'),
        ('rent', 'Rent'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_date = models.DateField()
    transaction_type = models.CharField(
        max_length=20, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=50, choices=CATEGORIES)
    description = models.CharField(max_length=500)

    # Vehicle association (if applicable)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    booking = models.ForeignKey(
        Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')

    # Amounts
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Payment details
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHODS, blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=20, blank=True, null=True,
                                           choices=[('daily', 'Daily'), ('weekly', 'Weekly'),
                                                    ('monthly', 'Monthly'), ('yearly', 'Yearly')])

    # Accounting references
    invoice_number = models.CharField(max_length=50, blank=True, null=True)
    receipt_number = models.CharField(max_length=50, blank=True, null=True)
    vendor_name = models.CharField(max_length=200, blank=True, null=True)
    vendor_contact = models.CharField(max_length=200, blank=True, null=True)

    # Supporting documents
    document_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Approval and audit
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_date = models.DateTimeField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='transactions_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['transaction_date', 'transaction_type']),
            models.Index(fields=['vehicle', 'category']),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.description} - ${self.amount}"

    def save(self, *args, **kwargs):
        # Calculate net amount
        if self.transaction_type in ['revenue', 'asset', 'equity']:
            self.net_amount = self.amount - self.tax_amount
        else:  # expense, liability
            self.net_amount = self.amount + self.tax_amount
        super().save(*args, **kwargs)


class Receipt(models.Model):
    """Receipt generation and tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_number = models.CharField(max_length=50, unique=True)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='receipts')
    payment = models.ForeignKey(
        Payment, on_delete=models.CASCADE, related_name='receipts')

    # Receipt details
    issue_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    balance_due = models.DecimalField(max_digits=10, decimal_places=2)

    # Status
    is_emailed = models.BooleanField(default=False)
    emailed_at = models.DateTimeField(null=True, blank=True)
    is_printed = models.BooleanField(default=False)
    printed_at = models.DateTimeField(null=True, blank=True)

    # Document storage
    pdf_url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issue_date']

    def __str__(self):
        return f"Receipt {self.receipt_number} for {self.booking.booking_reference}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            year = datetime.datetime.now().year
            self.receipt_number = f'RCPT{year}{"".join(random.choices(string.digits, k=6))}'
        super().save(*args, **kwargs)


class VehicleAvailability(models.Model):
    """Track vehicle availability for specific periods"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name='availabilities')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=VEHICLE_STATUS_CHOICES)
    reason = models.CharField(max_length=200, blank=True, null=True)

    # Reference to related records
    booking = models.ForeignKey(
        Booking, on_delete=models.SET_NULL, null=True, blank=True)
    maintenance = models.ForeignKey(
        MaintenanceRecord, on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']
        verbose_name_plural = 'Vehicle Availabilities'
        indexes = [
            models.Index(fields=['vehicle', 'start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.vehicle.plate_number} - {self.status} from {self.start_date} to {self.end_date}"

    def save(self, *args, **kwargs):
        # Update vehicle status if this availability is current
        today = timezone.now().date()

        if self.start_date <= today <= self.end_date:
            self.vehicle.status = self.status
            self.vehicle.save()

        super().save(*args, **kwargs)
