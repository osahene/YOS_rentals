from django.db.models import F, Sum, Count, ExpressionWrapper, DurationField, Q
from datetime import timedelta

def aggregate_total_days_from_bookings(bookings_qs):
    # annotate each booking with a duration (end_date - start_date)
    bookings_qs = bookings_qs.annotate(
        duration=ExpressionWrapper(
            F('end_date') - F('start_date'),
            output_field=DurationField()
        )
    )
    tot = bookings_qs.aggregate(total_duration=Sum('duration'))['total_duration'] or timedelta(0)
    # convert timedelta to days (float)
    total_days = tot.total_seconds() / 86400.0
    return total_days