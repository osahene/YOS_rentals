from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from cars.models import Car
from bookings.models import Booking
from events.models import MaintenanceRecord
from insurance.models import InsurancePolicy
from staff.models import SalaryPayment
from customers.models import Customer
from .models import ReportCacheMeta

# List of all models that affect the financial report
AFFECTED_MODELS = [Car, Booking, MaintenanceRecord, InsurancePolicy, SalaryPayment, Customer]

@receiver(post_save, sender=AFFECTED_MODELS)
@receiver(post_delete, sender=AFFECTED_MODELS)
def invalidate_report_cache(sender, **kwargs):
    """Increment the cache version whenever relevant data changes."""
    ReportCacheMeta.increment_version()