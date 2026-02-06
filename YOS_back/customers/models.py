from django.db import models
import uuid
from django.core.validators import RegexValidator

class Customer(models.Model):
    LOYALTY_TIERS = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('blocked', 'Blocked'),
    ]
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+233XXXXXXXXX'. Up to 15 digits allowed."
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Personal details
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=17, validators=[phone_regex], unique=True)
    
    # Identification
    ghana_card_id = models.CharField(max_length=30, unique=True, blank=True, null=True)
    driver_license_id = models.CharField(max_length=30, blank=True, null=True)
    driver_license_class = models.CharField(max_length=10, blank=True, null=True)
    driver_license_issue_date = models.DateField(null=True, blank=True)
    driver_license_expiry_date = models.DateField(null=True, blank=True)
    
    # Demographics
    occupation = models.CharField(max_length=200, blank=True)
    gps_address = models.CharField(max_length=500, blank=True)
    
    # Address
    address_city = models.CharField(max_length=100, blank=True)
    address_region = models.CharField(max_length=100, blank=True)
    address_country = models.CharField(max_length=100, default='Ghana')
    
    # Stats
    total_bookings = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    
    # Preferences
    preferred_vehicle_type = models.CharField(max_length=100, blank=True)
    communication_preferences = models.JSONField(default=dict)  # {email: true, sms: true, phone: false}
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    loyalty_tier = models.CharField(max_length=20, choices=LOYALTY_TIERS, default='bronze')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_booking_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['ghana_card_id']),
            models.Index(fields=['status', 'loyalty_tier']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.phone}"

class Guarantor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='guarantor')
    
    # Personal details
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=17, validators=[Customer.phone_regex])
    
    # Identification
    ghana_card_id = models.CharField(max_length=30, blank=True)
    
    # Relationship
    relationship = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=200, blank=True)
    gps_address = models.CharField(max_length=500, blank=True)
    
    # Address
    address_city = models.CharField(max_length=100, blank=True)
    address_region = models.CharField(max_length=100, blank=True)
    address_country = models.CharField(max_length=100, default='Ghana')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Guarantor for {self.customer}"