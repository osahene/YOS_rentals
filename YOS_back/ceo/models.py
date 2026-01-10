from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=50, choices=[
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    ], default='customer')
    profile_image = models.ImageField(
        upload_to='profiles/', null=True, blank=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.role})"


class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='customer_profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    ghana_card_id = models.CharField(max_length=50, unique=True)
    occupation = models.CharField(max_length=100)
    gps_address = models.CharField(max_length=255)
    locality = models.CharField(max_length=100)
    town = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Ghana')
    join_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ], default='active')
    total_bookings = models.IntegerField(default=0)
    total_spent = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    average_rating = models.FloatField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    preferred_vehicle_type = models.CharField(
        max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    communication_preferences = models.JSONField(default=dict)
    loyalty_tier = models.CharField(max_length=20, choices=[
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ], default='bronze')

    # Guarantor Information
    guarantor_first_name = models.CharField(max_length=100)
    guarantor_last_name = models.CharField(max_length=100)
    guarantor_phone = models.CharField(max_length=20)
    guarantor_email = models.EmailField(blank=True, null=True)
    guarantor_ghana_card_id = models.CharField(max_length=50)
    guarantor_occupation = models.CharField(max_length=100)
    guarantor_gps_address = models.CharField(max_length=255)
    guarantor_relationship = models.CharField(max_length=100)
    guarantor_locality = models.CharField(max_length=100)
    guarantor_town = models.CharField(max_length=100)
    guarantor_city = models.CharField(max_length=100)
    guarantor_region = models.CharField(max_length=100)
    guarantor_country = models.CharField(max_length=100, default='Ghana')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def update_stats(self, booking_amount):
        self.total_bookings += 1
        self.total_spent += booking_amount
        self.save()


class Car(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    color = models.CharField(max_length=50)
    license_plate = models.CharField(max_length=20, unique=True)
    vin = models.CharField(max_length=50, unique=True, blank=True, null=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2)
    weekly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True)
    monthly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('available', 'Available'),
        ('rented', 'Rented'),
        ('maintenance', 'Under Maintenance'),
        ('reserved', 'Reserved'),
    ], default='available')
    fuel_type = models.CharField(max_length=20, choices=[
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
    ])
    transmission = models.CharField(max_length=20, choices=[
        ('automatic', 'Automatic'),
        ('manual', 'Manual'),
    ])
    seats = models.IntegerField()
    mileage = models.IntegerField(default=0)
    features = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, null=True)
    insurance_expiry = models.DateField()
    last_service_date = models.DateField()
    next_service_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cars'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.make} {self.model} ({self.license_plate})"

    @property
    def full_name(self):
        return f"{self.make} {self.model} {self.year}"


class Driver(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    license_number = models.CharField(max_length=50, unique=True)
    license_class = models.CharField(max_length=10)
    license_issue_date = models.DateField()
    license_expiry_date = models.DateField()
    role = models.CharField(max_length=50, choices=[
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('freelance', 'Freelance'),
    ])
    status = models.CharField(max_length=20, choices=[
        ('available', 'Available'),
        ('assigned', 'Assigned'),
        ('on_leave', 'On Leave'),
        ('inactive', 'Inactive'),
    ], default='available')
    hourly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    daily_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    experience_years = models.IntegerField(default=0)
    rating = models.FloatField(default=0, validators=[
                               MinValueValidator(0), MaxValueValidator(5)])
    languages = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'drivers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.license_number})"

    def is_license_valid(self):
        return self.license_expiry_date >= timezone.now().date()


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    method = models.CharField(max_length=20, choices=[
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('pay_in_slip', 'Pay-in-Slip'),
        ('card', 'Credit/Debit Card'),
    ])
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ], default='pending')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')

    # Mobile Money Details
    mobile_money_provider = models.CharField(
        max_length=50, blank=True, null=True)
    mobile_money_phone = models.CharField(max_length=20, blank=True, null=True)
    mobile_money_transaction_id = models.CharField(
        max_length=100, blank=True, null=True)

    # Pay-in-Slip Details
    pay_in_slip_bank_name = models.CharField(
        max_length=100, blank=True, null=True)
    pay_in_slip_branch = models.CharField(
        max_length=100, blank=True, null=True)
    pay_in_slip_payee_name = models.CharField(
        max_length=200, blank=True, null=True)
    pay_in_slip_amount = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True)
    pay_in_slip_payment_date = models.DateField(blank=True, null=True)
    pay_in_slip_reference_number = models.CharField(
        max_length=100, blank=True, null=True)
    pay_in_slip_number = models.CharField(
        max_length=100, blank=True, null=True)
    pay_in_slip_image = models.ImageField(
        upload_to='pay_in_slips/', blank=True, null=True)

    # Card/Paystack Details
    transaction_reference = models.CharField(
        max_length=100, blank=True, null=True)
    authorization_url = models.URLField(blank=True, null=True)
    payment_gateway = models.CharField(max_length=50, blank=True, null=True)
    gateway_response = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.id} - {self.method} - {self.status}"


class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='bookings')
    car = models.ForeignKey(
        Car, on_delete=models.CASCADE, related_name='bookings')
    driver = models.ForeignKey(
        Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    payment = models.OneToOneField(
        Payment, on_delete=models.PROTECT, related_name='booking')

    # Booking Details
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    special_requests = models.TextField(blank=True, null=True)

    # Self-drive details
    is_self_drive = models.BooleanField(default=False)
    driver_license_id = models.CharField(max_length=50, blank=True, null=True)
    driver_license_class = models.CharField(
        max_length=10, blank=True, null=True)
    driver_license_issue_date = models.DateField(blank=True, null=True)
    driver_license_expiry_date = models.DateField(blank=True, null=True)

    # Pricing
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    # Status and tracking
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ], default='pending')

    # Additional information
    notes = models.TextField(blank=True, null=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    checked_out_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checkouts')
    checked_in_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checkins')

    # Dates
    checked_out_at = models.DateTimeField(blank=True, null=True)
    checked_in_at = models.DateTimeField(blank=True, null=True)
    cancellation_date = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['status']),
            models.Index(fields=['customer']),
            models.Index(fields=['car']),
        ]

    def __str__(self):
        return f"Booking {self.id} - {self.customer.full_name}"

    def save(self, *args, **kwargs):
        # Calculate duration in days
        if self.start_date and self.end_date:
            duration = (self.end_date - self.start_date).days
            self.duration_days = max(1, duration)

            # Calculate subtotal and total
            if self.daily_rate:
                self.subtotal = self.daily_rate * self.duration_days
                self.total_amount = self.subtotal + self.tax_amount

        super().save(*args, **kwargs)

    @property
    def is_active(self):
        now = timezone.now()
        return self.start_date <= now <= self.end_date and self.status == 'confirmed'

    @property
    def can_cancel(self):
        return self.status in ['pending', 'confirmed'] and timezone.now() < self.start_date


class BookingHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=50)
    notes = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking.id} - {self.status}"


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ], default='pending')
    payment_terms = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-issue_date']

    def __str__(self):
        return f"Invoice {self.invoice_number}"


class SMSLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.CharField(max_length=20)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=[
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ])
    provider = models.CharField(max_length=50)
    provider_response = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sms_logs'
        ordering = ['-sent_at']

    def __str__(self):
        return f"SMS to {self.recipient} - {self.status}"


class EmailLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ])
    provider = models.CharField(max_length=50, blank=True, null=True)
    provider_response = models.JSONField(default=dict, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_logs'
        ordering = ['-sent_at']

    def __str__(self):
        return f"Email to {self.recipient} - {self.subject}"
