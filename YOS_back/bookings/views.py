import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Booking
from cars.models import Car
from .serializers import BookingSerializer, BookingDetailSerializer, CreateBookingSerializer
from .filters import BookingFilter
from typing import Type
from rest_framework import serializers

class BookingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing bookings.
    Transport Manager: Full CRUD access
    Main Admin: Read-only
    """
    queryset = Booking.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_class = BookingFilter
    
    def get_serializer_class(self): #type: ignore
        if self.action == 'create':
            return CreateBookingSerializer
        elif self.action == 'retrieve':
            return BookingDetailSerializer
        return BookingSerializer
    
    def get_permissions(self):
        # if self.request.method in permissions.SAFE_METHODS:
        #     return [permissions.IsAuthenticated()]
        # return [permissions.IsAdminUser()] 
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date and end_date:
            # Get overlapping bookings
            queryset = queryset.filter(
                Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
            )
        
        return queryset.select_related('car', 'customer', 'driver')
    
    def perform_create(self, serializer):
        # Check car availability
        car = serializer.validated_data['car']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        
        if not self.is_car_available(car, start_date, end_date):
            raise serializers.ValidationError(
                f"Car {car.license_plate} is not available for the selected dates"
            )
        
        booking = serializer.save(created_by=self.request.user)
        
        # Update car status if booking starts today
        if start_date == timezone.now().date():
            car.status = 'rented'
            car.save()
        
        # Send confirmation (would integrate with email/SMS service)
        self.send_confirmation(booking)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking with optional refund"""
        booking = self.get_object()
        refund_amount = request.data.get('refund_amount', 0)
        reason = request.data.get('reason', '')
        
        if booking.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'Cannot cancel a completed or already cancelled booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process refund if applicable
        if refund_amount > 0:
            booking.refund_amount = refund_amount
            booking.payment_status = 'refunded'
        
        booking.status = 'cancelled'
        booking.cancellation_reason = reason
        booking.cancelled_at = timezone.now()
        booking.cancelled_by = request.user
        booking.save()
        
        # Update car status
        booking.car.status = 'available'
        booking.car.save()
        
        # Send cancellation notification
        self.send_cancellation_notification(booking)
        
        return Response({'status': 'cancelled'})
    
    @action(detail=True, methods=['post'])
    def mark_returned(self, request, pk=None):
        """Mark booking as returned with penalty calculation"""
        booking = self.get_object()
        actual_return_time = request.data.get('actual_return_time')
        return_mileage = request.data.get('return_mileage')
        
        if booking.status != 'active':
            return Response(
                {'error': 'Only active bookings can be marked as returned'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse actual return time
        if actual_return_time:
            actual_return_time = datetime.fromisoformat(actual_return_time)
        else:
            actual_return_time = timezone.now()
        
        booking.actual_return_time = actual_return_time
        booking.return_mileage = return_mileage
        
        # Calculate penalty for late return
        penalty = booking.calculate_penalty()
        booking.penalty_amount = penalty
        
        # Update status
        booking.status = 'completed'
        booking.save()
        
        # Update car status and mileage
        car = booking.car
        car.status = 'available'
        if return_mileage:
            car.mileage = return_mileage
        car.save()
        
        # Generate receipt
        receipt_data = self.generate_receipt(booking)
        
        return Response({
            'status': 'returned',
            'penalty': float(penalty),
            'receipt': receipt_data
        })
    
    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        """Check car availability for given dates"""
        car_id = request.query_params.get('car_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not all([car_id, start_date, end_date]):
            return Response(
                {'error': 'Missing parameters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            car = Car.objects.get(id=car_id)
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            is_available = self.is_car_available(car, start_date, end_date)
            
            if not is_available:
                # Get conflicting bookings
                conflicts = Booking.objects.filter(
                    car=car,
                    status__in=['confirmed', 'active'],
                    start_date__lte=end_date,
                    end_date__gte=start_date
                ).exclude(id=request.query_params.get('exclude_id', None))
                
                conflicting_data = []
                for conflict in conflicts:
                    conflicting_data.append({
                        'id': conflict.id,
                        'customer_name': f"{conflict.customer.first_name} {conflict.customer.last_name}",
                        'start_date': conflict.start_date,
                        'end_date': conflict.end_date,
                        'status': conflict.status
                    })
                
                return Response({
                    'available': False,
                    'message': 'Car is not available for selected dates',
                    'conflicting_bookings': conflicting_data
                })
            
            return Response({'available': True})
            
        except Car.DoesNotExist:
            return Response(
                {'error': 'Car not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def is_car_available(self, car, start_date, end_date):
        """Check if car is available for given dates"""
        # Check car status
        if car.status not in ['available', 'rented']:
            return False
        
        # Check for overlapping bookings
        overlapping = Booking.objects.filter(
            car=car,
            status__in=['confirmed', 'active'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        
        return not overlapping
    
    def send_confirmation(self, booking):
        """Send booking confirmation (placeholder for email/SMS integration)"""
        # In production, integrate with email service (SendGrid, etc.)
        # and SMS service (Twilio, etc.)
        pass
    
    def generate_receipt(self, booking):
        """Generate receipt data for a booking"""
        return {
            'booking_id': str(booking.id),
            'customer_name': f"{booking.customer.first_name} {booking.customer.last_name}",
            'car_details': f"{booking.car.year} {booking.car.make} {booking.car.model}",
            'booking_dates': f"{booking.start_date} to {booking.end_date}",
            'duration': booking.duration_days,
            'total_amount': float(booking.total_amount),
            'penalty': float(booking.penalty_amount),
            'final_amount': float(booking.total_amount + booking.penalty_amount),
            'payment_method': booking.get_payment_method_display(),
            'payment_status': booking.get_payment_status_display(),
        }
        
        
        # ceo dashboard retrieval
    @action(detail=False, methods=['get'])
    def dashboard_metrics(self, request):
        """Get dashboard metrics (total bookings, active, revenue, etc.)"""
        # Get date range filter
        days_ago = request.query_params.get('days', 30)
        try:
            days = int(days_ago)
        except:
            days = 30
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Calculate metrics
        total_bookings = Booking.objects.filter(
            created_at__gte=start_date
        ).count()
        
        active_bookings = Booking.objects.filter(
            status='active',
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).count()
        
        revenue = Booking.objects.filter(
            created_at__gte=start_date,
            payment_status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        cancelled = Booking.objects.filter(
            created_at__gte=start_date,
            status='cancelled'
        ).count()
        
        return Response({
            'total_bookings': total_bookings,
            'active_bookings': active_bookings,
            'revenue': float(revenue),
            'cancelled': cancelled
        })
    
    @action(detail=False, methods=['get'])
    def booking_trends(self, request):
        """Get booking trends data for charts"""
        # Get date range (default: last 8 months)
        months = request.query_params.get('months', 8)
        try:
            months = int(months)
        except:
            months = 8
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=months*30)
        
        # Monthly data
        monthly_data = Booking.objects.filter(
            created_at__range=[start_date, end_date]
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            bookings=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('month')
        
        # Format monthly data
        chart_data = []
        for item in monthly_data:
            chart_data.append({
                'month': item['month'].strftime('%b'),
                'bookings': item['bookings'],
                'revenue': float(item['revenue'] or 0)
            })
        
        # Vehicle type distribution
        vehicle_distribution = Booking.objects.filter(
            created_at__range=[start_date, end_date]
        ).values('car__category').annotate(
            count=Count('id')
        ).order_by('-count')
        
        vehicle_data = []
        colors = ['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B']
        for i, item in enumerate(vehicle_distribution):
            vehicle_data.append({
                'name': item['car__category'] or 'Unknown',
                'value': item['count'],
                'color': colors[i % len(colors)]
            })
        
        return Response({
            'chart_data': chart_data,
            'vehicle_distribution': vehicle_data
        })
    
    @action(detail=False, methods=['get'])
    def recent_bookings(self, request):
        """Get recent bookings for the table"""
        limit = request.query_params.get('limit', 10)
        status_filter = request.query_params.get('status', 'all')
        
        queryset = Booking.objects.all().select_related(
            'car', 'customer', 'guarantor'
        ).order_by('-created_at')
        
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = BookingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = BookingSerializer(queryset[:int(limit)], many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_email_receipt(self, request, pk=None):
        """Send a detailed HTML receipt via email."""
        booking = self.get_object()
        customer = booking.customer

        if not customer or not customer.email:
            return Response({'error': 'Customer has no email address'}, status=400)

        # Prepare context
        context = {
            'customer_name': f"{customer.first_name} {customer.last_name}",
            'booking_id': str(booking.id),
            'car_details': f"{booking.car.year} {booking.car.make} {booking.car.model} ({booking.car.license_plate})",
            'booking_dates': f"{booking.start_date} to {booking.end_date}",
            'duration': booking.duration_days,
            'pickup_location': booking.pickup_location or 'N/A',
            'dropoff_location': booking.dropoff_location or 'N/A',
            'daily_rate': booking.daily_rate,
            'discount': booking.discount or 0,
            'total_amount': booking.total_amount,
            'payment_method': booking.get_payment_method_display(),
            'payment_status': booking.get_payment_status_display(),
            'company_name': 'YOS Car Rentals',
        }

        subject = f"Booking Receipt - {booking.id}"
        html_message = render_to_string('emails/booking_receipt.html', context)
        plain_message = strip_tags(html_message)

        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[customer.email],
        )
        email.attach_alternative(html_message, "text/html")
        email.send()

        return Response({'status': 'receipt email sent'})

    @action(detail=True, methods=['post'])
    def send_sms_receipt(self, request, pk=None):
        """Send a concise receipt SMS."""
        booking = self.get_object()
        customer = booking.customer

        if not customer or not customer.phone:
            return Response({'error': 'Customer has no phone number'}, status=400)

        phone = customer.phone
        if phone.startswith('0'):
            phone = '233' + phone[1:]

        message = (
            f"Receipt for booking {str(booking.id)[:8].upper()}: "
            f"GHS {booking.total_amount:.2f} paid via {booking.get_payment_method_display()}. "
            f"Vehicle: {booking.car.make} {booking.car.model}. Thank you!"
        )

        endpoint = 'https://api.mnotify.com/api/sms/quick'
        api_key = settings.MNOTIFY_API_KEY
        url = f"{endpoint}?key={api_key}"

        payload = {
            "recipient": [phone],
            "sender": settings.MNOTIFY_SENDER_ID or "mNotify",
            "message": message,
            "is_schedule": "false",
            "schedule_date": ""
        }

        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                return Response({'status': 'receipt SMS sent'})
            else:
                return Response(
                    {'error': 'SMS sending failed', 'details': response.text},
                    status=500
                )
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    
    @action(detail=True, methods=['post'])
    def send_confirmation_sms(self, request, pk=None):
        """Send a booking confirmation SMS via mNotify."""
        booking = self.get_object()
        customer = booking.customer
        print('booking', booking)

        if not customer or not customer.phone:
            return Response({'error': 'Customer has no phone number'}, status=400)

        phone = customer.phone
        # Convert local format (0XX...) to international (233XX...)
        if phone.startswith('0'):
            phone = '233' + phone[1:]

        # Construct a professional message
        start = booking.start_date.strftime('%d %b %Y')
        end = booking.end_date.strftime('%d %b %Y')
        message = (
            f"Dear {customer.first_name}, your booking for {booking.car.make} {booking.car.model} "
            f"from {start} to {end} has been confirmed. Total: GHS {booking.total_amount:.2f}. "
            f"Pickup: {booking.pickup_location or 'our office'}. Thank you for choosing us!"
        )

        # mNotify API call
        endpoint = 'https://api.mnotify.com/api/sms/quick'
        api_key = settings.MNOTIFY_API_KEY
        url = f"{endpoint}?key={api_key}"

        payload = {
            "recipient": [phone],
            "sender": settings.MNOTIFY_SENDER_ID or "mNotify",
            "message": message,
            "is_schedule": "false",
            "schedule_date": ""
        }

        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                return Response({'status': 'confirmation SMS sent'})
            else:
                return Response(
                    {'error': 'SMS sending failed', 'details': response.text},
                    status=500
                )
        except Exception as e:
            return Response({'error': str(e)}, status=500)