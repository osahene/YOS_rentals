from django.db import models
import uuid
from account.models import User
from django.utils import timezone


class Event(models.Model):
    EVENT_TYPES = [
        ('maintenance', 'Maintenance'),
        ('insurance', 'Insurance Update'),
        ('accident', 'Accident'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, related_name='events')
    
    # Event details
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Additional data (e.g. maintenance type, insurance details, accident severity)
    extra_data = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['car', 'event_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.car} ({self.created_at.date()})"

class MaintenanceRecord(models.Model):
    MAINTENANCE_TYPES = [
        ('routine', 'Routine Service'),
        ('repair', 'Repair'),
        ('accident', 'Accident Repair'),
        ('tire', 'Tire Replacement'),
        ('battery', 'Battery Replacement'),
        ('oil', 'Oil Change'),
        ('brake', 'Brake Service'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('delayed', 'Delayed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, related_name='maintenance_records')
    
    # Maintenance details
    type = models.CharField(max_length=50, choices=MAINTENANCE_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Dates
    start_date = models.DateField()
    estimated_end_date = models.DateField()
    actual_end_date = models.DateField(null=True, blank=True)
    
    # Cost and garage
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    garage = models.CharField(max_length=200, blank=True)
    garage_contact = models.CharField(max_length=100, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Additional info
    notes = models.TextField(blank=True)
    documents = models.JSONField(default=list)  # Store document URLs
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['car', 'status']),
            models.Index(fields=['estimated_end_date']),
        ]
    
    def __str__(self):
        return f"{self.type} - {self.car} ({self.start_date})"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.status in ['scheduled', 'in_progress'] and timezone.now().date() > self.estimated_end_date
    
    def complete_maintenance(self, actual_end_date=None):
        """Mark maintenance as completed"""
        self.status = 'completed'
        self.actual_end_date = actual_end_date or timezone.now().date()
        self.save()
        
        # Update car status if it was under maintenance
        if self.car.status == 'maintenance':
            self.car.status = 'available'
            self.car.save()

class MaintenanceExtension(models.Model):
    """Track extensions for maintenance deadlines"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    maintenance_record = models.ForeignKey(MaintenanceRecord, on_delete=models.CASCADE, related_name='extensions')
    previous_end_date = models.DateField()
    new_end_date = models.DateField()
    reason = models.TextField()
    extended_at = models.DateTimeField(auto_now_add=True)
    extended_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-extended_at']