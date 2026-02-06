from django.db import models
import uuid
from account.models import User 

class Staff(models.Model):
    ROLE_CHOICES = [
        ('driver', 'Driver'),
        ('mechanic', 'Mechanic'),
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('other', 'Other'),
    ]
    
    EMPLOYMENT_TYPES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('casual', 'Casual'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('terminated', 'Terminated'),
    ]
    
    SHIFT_CHOICES = [
        ('day', 'Day Shift'),
        ('night', 'Night Shift'),
        ('flexible', 'Flexible'),
        ('24_hour', '24 Hour'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile', null=True, blank=True)
    
    # Personal details
    employee_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=17)
    
    # Employment details
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    department = models.CharField(max_length=100, blank=True)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES)
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, default='day')
    
    # Financial
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    account_name = models.CharField(max_length=200, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    hire_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    
    # Driver specific
    driver_license_id = models.CharField(max_length=30, blank=True)
    driver_license_class = models.CharField(max_length=10, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['role', 'status']),
            models.Index(fields=['employee_id']),
        ]
        verbose_name_plural = "Staff"
    
    def __str__(self):
        return f"{self.name} - {self.role}"

class SalaryPayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='salary_payments')
    
    # Payment details
    month = models.DateField()  # Store as first day of month
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    overtime = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment status
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        unique_together = ['staff', 'month']
        ordering = ['-month']
    
    def __str__(self):
        return f"Salary - {self.staff.name} - {self.month.strftime('%B %Y')}"