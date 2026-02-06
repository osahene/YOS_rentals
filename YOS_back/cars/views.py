from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
import json

from .models import Car
from .serializers import CarSerializer, CarDetailSerializer, CreateCarSerializer
from .filters import CarFilter
from events.models import Event
from bookings.models import Booking

class CarViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing cars.
    Main Admin: Full CRUD access
    Transport Manager: Read-only, can update status
    """
    queryset = Car.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CarFilter
    search_fields = ['make', 'model', 'license_plate', 'vin']
    ordering_fields = ['make', 'model', 'year', 'status']
    
    def get_serializer_class(self) -> type:
        if self.action == 'retrieve':
            return CarDetailSerializer
        elif self.action == 'create':
            return CreateCarSerializer
        elif self.action in ['update', 'partial_update']:
            # You might want a different serializer for updates
            return CreateCarSerializer  # or create an UpdateCarSerializer
        return CarSerializer
    
    def get_permissions(self):
        # if self.action in ['create', 'update', 'partial_update', 'destroy']:
        #     return [permissions.IsAdminUser()]
        # return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # serializer.save(registered_by=self.request.user)
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get analytics for a specific car"""
        car = self.get_object()
        
        # Calculate revenue for last 6 months
        six_months_ago = timezone.now() - timedelta(days=180)
        
        revenue_data = []
        for i in range(6):
            month = six_months_ago + timedelta(days=30*i)
            month_bookings = Booking.objects.filter(
                car=car,
                status='completed',
                created_at__month=month.month,
                created_at__year=month.year
            )
            revenue = month_bookings.aggregate(total=Sum('total_amount'))['total'] or 0
            revenue_data.append({
                'month': month.strftime('%b %Y'),
                'revenue': float(revenue)
            })
        
        # Get maintenance costs
        maintenance_cost = car.maintenance_records.aggregate(
            total=Sum('cost')
        )['total'] or 0
        
        # Get insurance cost
        insurance_cost = car.insurance_policies.filter(
            is_current=True
        ).aggregate(total=Sum('premium'))['total'] or 0
        
        # Get booking statistics
        booking_stats = {
            'total': car.bookings.count(),
            'completed': car.bookings.filter(status='completed').count(),
            'active': car.bookings.filter(status='active').count(),
            'cancelled': car.bookings.filter(status='cancelled').count(),
        }
        
        data = {
            'car': CarDetailSerializer(car).data,
            'revenue_trend': revenue_data,
            'maintenance_cost': float(maintenance_cost),
            'insurance_cost': float(insurance_cost),
            'booking_stats': booking_stats,
            'utilization_rate': self.calculate_utilization_rate(car),
            'profit_margin': self.calculate_profit_margin(car),
        }
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update car status with event logging"""
        car = self.get_object()
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        if new_status not in dict(Car.CAR_STATUS):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log the status change
        Event.objects.create(
            car=car,
            event_type='status_change',
            title=f"Status changed to {new_status}",
            description=reason,
            date=timezone.now().date(),
            extra_data={
                'old_status': car.status,
                'new_status': new_status,
                'changed_by': request.user.username
            }
        )
        
        car.status = new_status
        car.save()
        
        return Response({'status': 'updated'})
    
    def calculate_utilization_rate(self, car):
        """Calculate car utilization rate"""
        total_days = 365  # One year period
        booked_days = car.bookings.filter(
            status='completed'
        ).aggregate(
            days=Sum('duration_days')
        )['days'] or 0
        
        return (booked_days / total_days) * 100 if total_days > 0 else 0
    
    def calculate_profit_margin(self, car):
        """Calculate profit margin"""
        revenue = car.total_revenue
        expenses = car.total_expenses
        
        if revenue > 0:
            return ((revenue - expenses) / revenue) * 100
        return 0