# vehicle/tasks.py
from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import logging

from .models import Receipt, Booking, Vehicle, MaintenanceRecord

logger = logging.getLogger(__name__)


@shared_task
def send_receipt_email(receipt_id):
    """Send receipt email with PDF attachment"""
    try:
        receipt = Receipt.objects.select_related(
            'booking', 'booking__vehicle', 'booking__customer'
        ).get(id=receipt_id)

        customer_email = receipt.booking.customer_email or receipt.booking.customer.email

        subject = f"Receipt for Booking #{receipt.booking.booking_reference}"

        # Create HTML email content
        context = {
            'receipt': receipt,
            'booking': receipt.booking,
            'vehicle': receipt.booking.vehicle,
            'customer': receipt.booking.customer,
            'company_name': 'Your Vehicle Rental Service'
        }

        html_content = render_to_string('emails/receipt.html', context)
        text_content = render_to_string('emails/receipt.txt', context)

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[customer_email],
            reply_to=[settings.DEFAULT_FROM_EMAIL]
        )

        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

        logger.info(
            f"Receipt email sent for booking {receipt.booking.booking_reference}")

    except Exception as e:
        logger.error(f"Failed to send receipt email: {str(e)}")
        raise


@shared_task
def check_upcoming_maintenance():
    """Check for vehicles needing maintenance soon"""
    thirty_days_from_now = timezone.now().date() + timedelta(days=30)

    vehicles_needing_maintenance = MaintenanceRecord.objects.filter(
        next_maintenance_date__lte=thirty_days_from_now,
        is_completed=True
    ).select_related('vehicle', 'created_by')

    if vehicles_needing_maintenance.exists():
        # Send notification to transport manager
        # Implementation depends on your notification system
        pass


@shared_task
def check_expiring_insurance():
    """Check for expiring insurance policies"""
    thirty_days_from_now = timezone.now().date() + timedelta(days=30)

    expiring_insurances = Vehicle.insurances.filter(
        expiry_date__lte=thirty_days_from_now,
        is_active=True
    ).select_related('vehicle')

    for insurance in expiring_insurances:
        # Send notification
        logger.warning(
            f"Insurance for {insurance.vehicle.plate_number} expires on {insurance.expiry_date}")


@shared_task
def update_vehicle_statuses():
    """Update vehicle statuses based on current time and bookings"""
    now = timezone.now()

    # Update completed bookings
    completed_bookings = Booking.objects.filter(
        return_date__lt=now,
        status='in_progress'
    )

    for booking in completed_bookings:
        booking.status = 'completed'
        booking.actual_return_date = now
        booking.save()

        # Update vehicle status
        booking.vehicle.update_status('available')

    # Update started bookings
    started_bookings = Booking.objects.filter(
        pickup_date__lte=now,
        return_date__gt=now,
        status='confirmed'
    )

    for booking in started_bookings:
        booking.status = 'in_progress'
        booking.actual_pickup_date = now
        booking.save()

        booking.vehicle.update_status('in_use')


@shared_task
def generate_daily_financial_report():
    """Generate daily financial report for accountant"""
    today = timezone.now().date()

    # Get today's transactions
    daily_transactions = FinancialTransaction.objects.filter(
        transaction_date=today,
        is_approved=True
    ).aggregate(
        total_revenue=Sum('amount', filter=Q(transaction_type='revenue')),
        total_expenses=Sum('amount', filter=Q(transaction_type='expense')),
        transaction_count=Count('id')
    )

    # Get today's bookings
    daily_bookings = Booking.objects.filter(
        created_at__date=today
    ).aggregate(
        total_bookings=Count('id'),
        completed_payments=Count('id', filter=Q(payment_status='completed')),
        total_revenue=Sum('total_amount', filter=Q(payment_status='completed'))
    )

    report_data = {
        'date': today,
        'transactions': daily_transactions,
        'bookings': daily_bookings
    }

    # Send to accountant email
    # Implementation depends on your email system

    return report_data
