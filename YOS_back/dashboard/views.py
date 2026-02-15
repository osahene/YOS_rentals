# dashboard/views.py
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from bookings.models import Booking
from cars.models import Car
from customers.models import Customer
from django.contrib.auth import get_user_model

User = get_user_model()

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])
def dashboard_metrics(request):
    """Get dashboard metrics"""
    
    # Time periods
    today = timezone.now().date()
    last_30_days = today - timedelta(days=30)
    last_7_days = today - timedelta(days=7)
    
    # Calculate metrics
    metrics = {}
    
    # Active Customers (customers with bookings in last 30 days)
    active_customers = Customer.objects.filter(
        bookings__created_at__gte=last_30_days
    ).distinct().count()
    
    # Total revenue (last 30 days)
    revenue = Booking.objects.filter(
        created_at__gte=last_30_days,
        payment_status='paid'
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Available cars
    available_cars = Car.objects.filter(
        status='available',
        is_active=True
    ).count()
    
    # Recent bookings (last 7 days)
    recent_bookings = Booking.objects.filter(
        created_at__gte=last_7_days
    ).count()
    
    # Booking status distribution
    booking_status = {
        'active': Booking.objects.filter(status='active').count(),
        'pending': Booking.objects.filter(status='pending').count(),
        'completed': Booking.objects.filter(status='completed').count(),
        'cancelled': Booking.objects.filter(status='cancelled').count(),
    }
    
    # Car status distribution
    car_status = {}
    for status_code, status_name in Car.CAR_STATUS:
        car_status[status_name] = Car.objects.filter(status=status_code).count()
    
    return Response({
        'metrics': {
            'active_customers': active_customers,
            'revenue': float(revenue),
            'available_cars': available_cars,
            'recent_bookings': recent_bookings,
        },
        'booking_status': booking_status,
        'car_status': car_status,
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def revenue_trends(request):
    """Get revenue trends for the last 12 months"""
    
    trends = []
    today = timezone.now()
    
    for i in range(11, -1, -1):  # Last 12 months
        month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_start = month_start - timedelta(days=30 * i)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        month_revenue = Booking.objects.filter(
            created_at__range=[month_start, month_end],
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        month_bookings = Booking.objects.filter(
            created_at__range=[month_start, month_end]
        ).count()
        
        trends.append({
            'month': month_start.strftime('%b'),
            'month_full': month_start.strftime('%B %Y'),
            'revenue': float(month_revenue),
            'bookings': month_bookings,
        })
    
    return Response({'trends': trends})

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
@permission_classes([AllowAny])
def recent_bookings_data(request):
    """Get recent bookings for dashboard"""
    
    bookings = Booking.objects.select_related(
        'car', 'customer'
    ).order_by('-created_at')[:10]
    
    booking_data = []
    for booking in bookings:
        booking_data.append({
            'id': str(booking.id)[:10],  # Shorten for display
            'customer': f"{booking.customer.first_name} {booking.customer.last_name}",
            'vehicle': f"{booking.car.year} {booking.car.make} {booking.car.model}",
            'pickup': booking.start_date.strftime('%d %b %Y'),
            'return': booking.end_date.strftime('%d %b %Y'),
            'location': booking.pickup_location or 'N/A',
            'status': booking.status,
            'payment_status': booking.payment_status,
            'total_amount': float(booking.total_amount) if booking.total_amount else 0,
        })
    
    return Response({'bookings': booking_data})

@api_view(['GET'])
@permission_classes([AllowAny])
def car_type_distribution(request):
    """Get car type distribution"""
    
    # Group by fuel type
    distribution = Car.objects.values('fuel_type').annotate(
        count=Count('id'),
        value=Count('id')  # For pie chart
    ).order_by('-count')
    
    # Add colors
    colors = ['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B']
    result = []
    for i, item in enumerate(distribution):
        fuel_type_display = dict(Car.FUEL_TYPES).get(item['fuel_type'], item['fuel_type'])
        result.append({
            'name': fuel_type_display,
            'value': item['value'],
            'count': item['count'],
            'color': colors[i % len(colors)]
        })
    
    return Response({'distribution': result})

@api_view(['GET'])
@permission_classes([AllowAny])
def daily_bookings(request):
    """Get daily bookings for last 7 days"""
    
    daily_data = []
    today = timezone.now().date()
    
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
        day_end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
        
        bookings_count = Booking.objects.filter(
            created_at__range=[day_start, day_end]
        ).count()
        
        daily_data.append({
            'day': day.strftime('%a'),
            'full_day': day.strftime('%Y-%m-%d'),
            'bookings': bookings_count,
        })
    
    return Response({'daily_data': daily_data})

@api_view(['GET'])
@permission_classes([AllowAny])
def top_performing_cars(request):
    """Get top performing cars by revenue"""
    
    top_cars = Car.objects.annotate(
        total_revenue=Sum('bookings__total_amount'),
        booking_count=Count('bookings')
    ).filter(
        bookings__payment_status='paid'
    ).order_by('-total_revenue')[:5]
    
    car_data = []
    for car in top_cars:
        car_data.append({
            'id': str(car.id),
            'name': f"{car.year} {car.make} {car.model}",
            'license_plate': car.license_plate,
            'revenue': float(car.total_revenue) if car.total_revenue else 0,
            'bookings': getattr(car, 'booking_count', 0) | 0,
            'status': car.status,
            'color': car.color_hex or '#3B82F6',
        })
    
    return Response({'top_cars': car_data})