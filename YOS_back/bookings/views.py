from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Exists, OuterRef
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
    
    # def get_serializer_class(self) -> Type[serializers.Serializer]:
    #     if self.action == 'create':
    #         return CreateBookingSerializer
    #     elif self.action == 'retrieve':
    #         return BookingDetailSerializer
    #     return BookingSerializer
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]  # Only admin can create/update bookings
    
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