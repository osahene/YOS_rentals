from django.core.management.base import BaseCommand
from django.utils import timezone
from models import Booking

class Command(BaseCommand):
    help = 'Update reserved bookings to rented when start date has arrived'

    def handle(self, *args, **options):
        today = timezone.now().date()
        # Find all reserved bookings that start today or earlier
        bookings_to_update = Booking.objects.filter(
            status='reserved',
            start_date__lte=today
        ).select_related('car')

        updated_count = 0
        for booking in bookings_to_update:
            booking.status = 'rented'
            booking.save(update_fields=['status'])
            
            car = booking.car
            car.status = 'rented'
            car.save(update_fields=['status'])
            
            updated_count += 1
            self.stdout.write(f"Updated booking {booking.id} and car {car.id} to rented")

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} bookings to rented'))