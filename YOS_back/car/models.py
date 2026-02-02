from django.db import models

# Create your models here.
from django.db import models
from account.models import User
from django.utils import timezone
import uuid
from account.models import Customer


class Car(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    year = models.IntegerField()
    color = models.CharField(max_length=50)
    license_plate = models.CharField(max_length=20, unique=True)
    vin = models.CharField(max_length=50, unique=True, blank=True, null=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
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
    date_of_birth = models.DateField(blank=False)
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
        max_digits=10, decimal_places=2)
    daily_rate = models.DecimalField(
        max_digits=10, decimal_places=2)
    experience_years = models.IntegerField(default=0)
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
    ])
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ], default='pending')
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
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
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_days = models.IntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tax_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

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
                self.total_amount = int(self.subtotal )+ int(self.tax_amount if self.tax_amount else 0)

        super().save(*args, **kwargs)

    @property
    def is_active(self):
        now = timezone.now()
        return self.start_date <= now <= self.end_date and self.status == 'confirmed'

    @property
    def can_cancel(self):
        return self.status in ['pending', 'confirmed'] and timezone.now() < self.start_date


class BookingHistory(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('confirmed', 'Confirmed'),
        ('picked_up', 'Picked Up'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
        ('refund_processed', 'Refund Processed'),
        ('status_changed', 'Status Changed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=50, choices=ACTION_CHOICES)
    notes = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'booking_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking.id} - {self.status}"


class Refund(models.Model):
    REFUND_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    ]

    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reason = models.TextField()
    status = models.CharField(
        max_length=20, choices=REFUND_STATUS, default='pending')
    approved_by = models.CharField(max_length=200, blank=True)
    processed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('booking', 'Booking Payment'),
        ('penalty', 'Late Return Penalty'),
        ('refund', 'Refund'),
        ('maintenance', 'Maintenance Fee'),
    ]

    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    transaction_type = models.CharField(
        max_length=20, choices=TRANSACTION_TYPES)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    receipt_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_date = models.DateTimeField(auto_now_add=True)
    processed_by = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-transaction_date']


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
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


# Add these models at the end of models.py

class ExpenseCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expense_categories'
        verbose_name_plural = 'Expense Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Expense(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        ExpenseCategory, on_delete=models.PROTECT, related_name='expenses')
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    date = models.DateField()
    payment_method = models.CharField(max_length=50, choices=[
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('cheque', 'Cheque'),
    ], default='cash')
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    vendor = models.CharField(max_length=200, blank=True, null=True)
    car = models.ForeignKey(Car, on_delete=models.SET_NULL,
                            null=True, blank=True, related_name='expenses')
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, choices=[
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ], default='none')
    notes = models.TextField(blank=True, null=True)
    attachments = models.JSONField(default=list, blank=True)
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='recorded_expenses')
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    approved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ], default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['category']),
            models.Index(fields=['car']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.category.name}: ${self.amount} - {self.date}"


class CapitalExpenditure(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey(Car, on_delete=models.CASCADE,
                            related_name='capital_expenditures')
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    purchase_date = models.DateField()
    depreciation_method = models.CharField(max_length=50, choices=[
        ('straight_line', 'Straight Line'),
        ('declining_balance', 'Declining Balance'),
        ('none', 'No Depreciation'),
    ], default='straight_line')
    useful_life_years = models.IntegerField(default=5)
    residual_value = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    current_book_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    depreciation_per_year = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    supplier = models.CharField(max_length=200, blank=True, null=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    warranty_period_months = models.IntegerField(default=12)
    insurance_premium = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    registration_cost = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    other_initial_costs = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    total_initial_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    documents = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'capital_expenditures'
        ordering = ['-purchase_date']
        verbose_name_plural = 'Capital Expenditures'

    def __str__(self):
        return f"{self.car} - ${self.purchase_price}"

    def save(self, *args, **kwargs):
        # Calculate total initial cost
        self.total_initial_cost = (
            int(self.purchase_price or 0) +
            int(self.insurance_premium or 0) +
            int(self.registration_cost or 0) +
            int(self.other_initial_costs or 0)
        )

        # Calculate depreciation per year if using straight-line method
        if self.depreciation_method == 'straight_line' and self.useful_life_years > 0:
            self.depreciation_per_year = (
                int(self.total_initial_cost or 0) -  int(self.residual_value or 0)
            ) / self.useful_life_years

        super().save(*args, **kwargs)

    def calculate_depreciation_to_date(self, as_of_date=None):
        if not as_of_date:
            as_of_date = timezone.now().date()

        if self.depreciation_method == 'none':
            return 0

        months_owned = (
            (as_of_date.year - self.purchase_date.year) * 12 +
            (as_of_date.month - self.purchase_date.month)
        )

        if months_owned <= 0:
            return 0

        if self.depreciation_method == 'straight_line':
            depreciation = (int(self.depreciation_per_year or 0) / 12) * months_owned
            return min(depreciation, int(self.total_initial_cost or 0) - int(self.residual_value or 0))

        # For declining balance method (simplified)
        elif self.depreciation_method == 'declining_balance':
            rate = 2 / self.useful_life_years  # Double declining balance
            book_value = float(self.total_initial_cost or 0)
            for _ in range(min(months_owned // 12, self.useful_life_years)):
                depreciation = book_value * rate
                book_value -= depreciation
            return int(self.total_initial_cost or 0) - int(book_value or 0)

        return 0


class FinancialReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_type = models.CharField(max_length=50, choices=[
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annual', 'Annual'),
        ('custom', 'Custom Period'),
    ])
    period_start = models.DateField()
    period_end = models.DateField()
    title = models.CharField(max_length=200)
    generated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='generated_reports')
    generated_at = models.DateTimeField(auto_now_add=True)

    # Summary data (cached for quick access)
    total_income = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    total_operating_expenses = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    total_capital_expenditure = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    net_profit = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    profit_margin = models.FloatField(default=0)  # Percentage

    # Detailed data (stored as JSON)
    income_breakdown = models.JSONField(default=dict, blank=True)
    expense_breakdown = models.JSONField(default=dict, blank=True)
    vehicle_performance = models.JSONField(default=dict, blank=True)
    financial_metrics = models.JSONField(default=dict, blank=True)

    pdf_file = models.FileField(
        upload_to='financial_reports/', blank=True, null=True)
    is_published = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'financial_reports'
        ordering = ['-period_end']

    def __str__(self):
        return f"{self.title} ({self.period_start} to {self.period_end})"
