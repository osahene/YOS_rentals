from django.db.models import Sum, Avg, Count
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import math
from events.models import MaintenanceRecord
from insurance.models import InsurancePolicy
import datetime

def calculate_car_revenue(car_id):
    """Calculate total revenue for a car"""
    from bookings.models import Booking
    
    revenue = Booking.objects.filter(
        car_id=car_id,
        status='completed',
        payment_status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
    
    return revenue

def calculate_car_expenses(car_id):
    """Calculate total expenses for a car"""
    
    maintenance_cost = MaintenanceRecord.objects.filter(
        car_id=car_id,
        status='completed'
    ).aggregate(total=Sum('cost'))['total'] or Decimal('0')
    
    insurance_cost = InsurancePolicy.objects.filter(
        car_id=car_id,
        is_current=True
    ).aggregate(total=Sum('insurance_amount'))['total'] or Decimal('0')
    
    return maintenance_cost + insurance_cost

def calculate_depreciation(car):
    """Calculate current value based on depreciation"""
    # Simple straight-line depreciation over 5 years
    years_old = (timezone.now().date() - car.purchase_date).days / 365.25
    
    if years_old >= 5:
        return Decimal('0')  # Fully depreciated
    
    depreciation_rate = Decimal('0.2')  # 20% per year
    current_value = car.purchase_price * (1 - (depreciation_rate * Decimal(years_old)))
    
    return max(current_value, Decimal('0'))

def check_car_availability(car, start_date, end_date):
    """Check if car is available for given dates"""
    from bookings.models import Booking
    
    # Check if car is in usable state
    if car.status not in ['available', 'rented']:
        return False, f"Car is currently {car.get_status_display()}"
    
    # Check for overlapping bookings
    overlapping = Booking.objects.filter(
        car=car,
        status__in=['confirmed', 'active'],
        start_date__lte=end_date,
        end_date__gte=start_date
    ).exists()
    
    if overlapping:
        return False, "Car is already booked for selected dates"
    
    # Check insurance validity
    current_insurance = car.insurance_policies.filter(is_current=True).first()
    if current_insurance and current_insurance.end_date < start_date:
        return False, "Car insurance expires before booking start date"
    
    return True, "Car is available"

def calculate_late_return_penalty(booking, actual_return_time):
    """
    Calculate penalty for late return based on company policy:
    - Any return after 9:00 AM incurs full day penalty
    - Even 1 minute late = 1 day penalty
    - Additional 10% late fee
    """
    expected_return = timezone.make_aware(
        datetime.datetime.combine(booking.end_date, datetime.time(9, 0))
    )
    
    if actual_return_time <= expected_return:
        return Decimal('0'), Decimal('0'), 0
    
    # Calculate hours late
    hours_late = (actual_return_time - expected_return).total_seconds() / 3600
    
    # Company policy: any late return = full day(s) penalty
    days_late = math.ceil(hours_late / 24)
    
    base_penalty = days_late * booking.daily_rate
    late_fee = base_penalty * Decimal('0.1')  # 10% late fee
    
    total_penalty = base_penalty + late_fee
    
    return total_penalty, late_fee, days_late