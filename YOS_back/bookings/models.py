from django.db import models
import uuid
from account.models import User
from decimal import Decimal
import math
import datetime

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('mobile_money', 'Mobile Money'),
        ('pay_in_slip', 'Pay-in-Slip'),
        ('card', 'Credit/Debit Card'),
    ]
    
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    car = models.ForeignKey('cars.Car', on_delete=models.PROTECT, related_name='bookings')
    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='bookings')
    guarantor = models.ForeignKey('customers.Guarantor', on_delete=models.SET_NULL, null=True, blank=True)
    driver = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, 
                          limit_choices_to={'role': 'driver'},  # Optional: filter to drivers only
                          related_name='assigned_bookings')
    
    # Booking details
    start_date = models.DateField()
    end_date = models.DateField()
    pickup_location = models.CharField(max_length=500, blank=True)
    dropoff_location = models.CharField(max_length=500, blank=True)
    special_requests = models.TextField(blank=True)
    
    # Self-drive details
    is_self_drive = models.BooleanField(default=False)
    driver_license_id = models.CharField(max_length=30, blank=True)
    driver_license_class = models.CharField(max_length=10, blank=True)
    
    # Financial
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Payment
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Mobile money details
    mobile_money_provider = models.CharField(max_length=50, blank=True)
    mobile_money_number = models.CharField(max_length=15, blank=True)
    mobile_money_transaction_id = models.CharField(max_length=100, blank=True)
    
    # Pay-in-slip details
    pay_in_slip_bank = models.CharField(max_length=100, blank=True)
    pay_in_slip_branch = models.CharField(max_length=100, blank=True)
    pay_in_slip_payee = models.CharField(max_length=200, blank=True)
    pay_in_slip_reference = models.CharField(max_length=100, blank=True)
    pay_in_slip_number = models.CharField(max_length=100, blank=True)
    pay_in_slip_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Return details
    actual_return_time = models.DateTimeField(null=True, blank=True)
    return_mileage = models.IntegerField(null=True, blank=True)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    penalty_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Cancellation
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_bookings')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_bookings')
    
    class Meta:
        indexes = [
            models.Index(fields=['car', 'start_date', 'end_date']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['status', 'payment_status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Booking {self.id} - {self.car}"
    
    def save(self, *args, **kwargs):
        # Calculate total amount if not set
        if not self.total_amount and self.start_date and self.end_date and self.daily_rate:
            days = (self.end_date - self.start_date).days
            self.total_amount = self.daily_rate * max(1, days)
        super().save(*args, **kwargs)
    
    @property
    def duration_days(self):
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return 0
    
    @property
    def is_late_return(self):
        if self.actual_return_time and self.end_date:
            from django.utils import timezone
            expected_return = timezone.make_aware(
                datetime.datetime.combine(self.end_date, datetime.time(9, 0))
            )
            return self.actual_return_time > expected_return
        return False
    
    def calculate_penalty(self):
        """Calculate late return penalty"""
        if self.is_late_return and self.actual_return_time:
            from django.utils import timezone
            expected_return = timezone.make_aware(
                datetime.datetime.combine(self.end_date, datetime.time(9, 0))
            )
            hours_late = (self.actual_return_time - expected_return).total_seconds() / 3600
            days_late = math.ceil(hours_late / 24)
            base_penalty = days_late * self.daily_rate
            late_fee = base_penalty * Decimal('0.1')
            return base_penalty + late_fee
        return Decimal('0')