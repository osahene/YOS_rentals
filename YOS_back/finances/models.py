
from django.db import models
import random
import string
import datetime
import uuid
from django.contrib.auth import get_user_model
from vehicle.models import Vehicle, Booking
from encrypted_fields.fields import (
    EncryptedCharField, EncryptedEmailField,
)

User = get_user_model()

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
