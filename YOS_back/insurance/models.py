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
    insurance_company = models.CharField(max_length=200)
    policy_type = models.CharField(max_length=50, choices=POLICY_TYPES)
    insurance_amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_current = models.BooleanField(default=True)  # Only one current policy per car
    
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
        return f"{self.insurance_company} - {self.policy_number} ({self.car})"
    
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
    
    def renew_policy(self, new_end_date, new_insurance_amount=None):
        """Create a renewal record"""
        renewal = InsuranceRenewal.objects.create(
            policy=self,
            previous_end_date=self.end_date,
            new_end_date=new_end_date,
            new_insurance_amount=new_insurance_amount or self.insurance_amount,
            renewed_by=self.created_by
        )
        self.end_date = new_end_date
        if new_insurance_amount:
            self.insurance_amount = new_insurance_amount
        self.save()
        return renewal

class InsuranceRenewal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    policy = models.ForeignKey(InsurancePolicy, on_delete=models.CASCADE, related_name='renewals')
    previous_end_date = models.DateField()
    new_end_date = models.DateField()
    new_insurance_amount = models.DecimalField(max_digits=12, decimal_places=2)
    renewed_at = models.DateTimeField(auto_now_add=True)
    renewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-renewed_at']