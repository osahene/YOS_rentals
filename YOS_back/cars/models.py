from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from account.models import User
import uuid
from .utils import calculate_car_expenses, calculate_car_revenue, calculate_depreciation

class Car(models.Model):
    CAR_STATUS = [
        ('available', 'Available'),
        ('rented', 'Rented'),
        ('reserved', 'Reserved'),
        ('extended_booking', 'Extended Booking'),
        ('retired', 'Retired'),
        ('maintenance', 'Maintenance'),
    ]
    
    FUEL_TYPES = [
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
    ]
    
    TRANSMISSION = [
        ('automatic', 'Automatic'),
        ('manual', 'Manual'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    car_type = models.CharField(max_length=50, blank=True)
    year = models.IntegerField(
        validators=[MinValueValidator(1900), MaxValueValidator(2100)]
    )
    color = models.CharField(max_length=50)
    color_hex = models.CharField(max_length=7, default='#3B82F6')
    license_plate = models.CharField(max_length=20, unique=True)
    vin = models.CharField(max_length=17, unique=True, blank=True, null=True)
    
    # Technical specifications
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES)
    transmission = models.CharField(max_length=20, choices=TRANSMISSION)
    seats = models.IntegerField(default=5)
    mileage = models.IntegerField(default=0)
    features = models.JSONField(default=list)  # Store as JSON array
    description = models.TextField(blank=True)
    
    # Financial
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_date = models.DateField()
    current_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=CAR_STATUS, default='available')
    is_active = models.BooleanField(default=True)
    
    # Images
    images = models.JSONField(default=list)  # Store image URLs
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    registered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['make', 'model']),
            models.Index(fields=['status']),
            models.Index(fields=['license_plate']),
        ]
    
    def __str__(self):
        return f"{self.year} {self.make} {self.model} - {self.license_plate}"
    
    @property
    def total_revenue(self):
        """Calculate total revenue from completed bookings"""
        return calculate_car_revenue(self.id)
    
    @property
    def total_expenses(self):
        """Calculate total expenses (maintenance + insurance)"""
        return calculate_car_expenses(self.id)
    
    @property
    def net_profit(self):
        return self.total_revenue - self.total_expenses
    
    @property
    def registrationDate(self):
        """Alias for purchase_date for frontend compatibility"""
        return self.purchase_date
    
    def update_current_value(self):
        """Calculate current value based on depreciation"""
        self.current_value = calculate_depreciation(self)
        self.save()