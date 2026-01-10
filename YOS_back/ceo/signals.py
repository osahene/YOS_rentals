from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Customer, Booking, BookingHistory
from django.utils import timezone

User = get_user_model()


@receiver(post_save, sender=User)
def create_customer_profile(sender, instance, created, **kwargs):
    """Create a customer profile when a new user with customer role is created"""
    if created and instance.role == 'customer':
        Customer.objects.create(
            user=instance,
            first_name=instance.first_name or '',
            last_name=instance.last_name or '',
            email=instance.email or '',
            phone=instance.phone or ''
        )


@receiver(pre_save, sender=Booking)
def create_booking_history(sender, instance, **kwargs):
    """Create booking history when booking status changes"""
    if instance.pk:
        old_instance = Booking.objects.get(pk=instance.pk)
        if old_instance.status != instance.status:
            BookingHistory.objects.create(
                booking=instance,
                status=instance.status,
                notes=f"Status changed from {old_instance.status} to {instance.status}"
            )

            # Update car status based on booking status
            if instance.status == 'confirmed':
                instance.car.status = 'rented'
                instance.car.save()
            elif instance.status in ['completed', 'cancelled']:
                instance.car.status = 'available'
                instance.car.save()
