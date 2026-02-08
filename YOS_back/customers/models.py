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
    
      
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def total_bookings(self):
        """Get total number of bookings for this customer"""
        from bookings.models import Booking
        return getattr(Booking.objects.filter(customer=self).count(), 'count', 0)
    
    @property
    def total_spent(self):
        """Get total amount spent by this customer"""
        from bookings.models import Booking
        from decimal import Decimal
        return Booking.objects.filter(
            customer=self,
            status__in=['completed', 'active'],
            payment_status__in=['paid', 'partially_paid']
        ).aggregate(
            total=models.Sum('total_amount')
        )['total'] or Decimal('0')
    
    @property
    def last_booking(self):
        """Get the last booking date"""
        from bookings.models import Booking
        last_booking = Booking.objects.filter(customer=self).order_by('-created_at').first()
        return last_booking.created_at if last_booking else None
    
    @property
    def active_bookings(self):
        """Get active bookings count"""
        from bookings.models import Booking
        return Booking.objects.filter(customer=self, status='active').count()
    
    @property
    def completed_bookings(self):
        """Get completed bookings count"""
        from bookings.models import Booking
        return Booking.objects.filter(customer=self, status='completed').count()
    
    def update_last_booking_date(self):
        """Update last booking date based on most recent booking"""
        from bookings.models import Booking
        last_booking = Booking.objects.filter(customer=self).order_by('-created_at').first()
        if last_booking:
            self.last_booking_date = last_booking.created_at
            self.save(update_fields=['last_booking_date'])
        return self.last_booking_date

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
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"