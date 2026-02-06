from django.db import models
import uuid
from account.models import User

class InsurancePolicy(models.Model):
    POLICY_TYPES = [
        ('comprehensive', 'Comprehensive'),
        ('third_party', 'Third Party'),
        ('liability', 'Liability'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey('cars.Car', on_delete=models.CASCADE, related_name='insurance_policies')
    policy_number = models.CharField(max_length=100, unique=True)
    provider = models.CharField(max_length=200)
    policy_type = models.CharField(max_length=50, choices=POLICY_TYPES)
    
    # Coverage details
    coverage_amount = models.DecimalField(max_digits=12, decimal_places=2)
    premium = models.DecimalField(max_digits=10, decimal_places=2)
    deductible = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    renewal_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_current = models.BooleanField(default=True)  # Only one current policy per car
    
    # Agent details
    agent_name = models.CharField(max_length=200, blank=True)
    agent_contact = models.CharField(max_length=100, blank=True)
    
    # Documents
    documents = models.JSONField(default=list)  # Store document URLs
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['car', 'is_current']),
            models.Index(fields=['end_date']),
            models.Index(fields=['policy_number']),
        ]
        verbose_name_plural = "Insurance Policies"
    
    def __str__(self):
        return f"{self.provider} - {self.policy_number} ({self.car})"
    
    def save(self, *args, **kwargs):
        # Ensure only one current policy per car
        if self.is_current:
            InsurancePolicy.objects.filter(
                car=self.car, is_current=True
            ).exclude(id=self.id).update(is_current=False)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now().date() > self.end_date
    
    def renew_policy(self, new_end_date, new_premium=None):
        """Create a renewal record"""
        renewal = InsuranceRenewal.objects.create(
            policy=self,
            previous_end_date=self.end_date,
            new_end_date=new_end_date,
            new_premium=new_premium or self.premium,
            renewed_by=self.created_by
        )
        self.end_date = new_end_date
        if new_premium:
            self.premium = new_premium
        self.save()
        return renewal

class InsuranceRenewal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    policy = models.ForeignKey(InsurancePolicy, on_delete=models.CASCADE, related_name='renewals')
    previous_end_date = models.DateField()
    new_end_date = models.DateField()
    new_premium = models.DecimalField(max_digits=10, decimal_places=2)
    renewed_at = models.DateTimeField(auto_now_add=True)
    renewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-renewed_at']