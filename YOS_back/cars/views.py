from rest_framework import viewsets, permissions, filters as filtre, status
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Prefetch
from django.utils import timezone
from datetime import timedelta
import json

from insurance.models import InsurancePolicy
from .models import Car
from .serializers import CarPublicSerializer, CarSerializer, CarDetailSerializer, CreateCarSerializer
from .filters import CarFilter
from events.models import Event, MaintenanceRecord
from bookings.models import Booking

class CarViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing cars.
    Main Admin: Full CRUD access
    Transport Manager: Read-only, can update status
    """
    queryset = Car.objects.all()
    filter_backends = [DjangoFilterBackend, filtre.SearchFilter, filtre.OrderingFilter]
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
    
    def get_queryset(self): #type: ignore
        """
        Optimize queries based on the action.
        For list: return basic queryset
        For retrieve: prefetch all related data
        """
        if self.action == 'retrieve':
            # Prefetch all related data for detail view
            return Car.objects.prefetch_related(
                Prefetch('insurance_policies', queryset=InsurancePolicy.objects.all().order_by('-start_date')),
                Prefetch('maintenance_records', queryset=MaintenanceRecord.objects.all().order_by('-start_date')),
                Prefetch('bookings', queryset=Booking.objects.all().order_by('-created_at')),
                Prefetch('events', queryset=Event.objects.all().order_by('-created_at'))
            ).all()
        return Car.objects.all()
    
    
    def get_permissions(self):
        # if self.action in ['create', 'update', 'partial_update', 'destroy']:
        #     return [permissions.IsAdminUser()]
        # return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        # serializer.save(registered_by=self.request.user)
        serializer.save()
    
    def analytics(self, request, pk=None):
        """Get detailed analytics for a specific car"""
        car = self.get_object()
        
        # Use the same analytics data from serializer
        serializer = CarDetailSerializer(car, context={'request': request})
        analytics_data = serializer.get_analytics_data(car)
        
        # Add additional analytics if needed
        from datetime import datetime, timedelta
        
        # Get booking trends for the last 6 months
        six_months_ago = timezone.now() - timedelta(days=180)
        
        booking_trends = []
        for i in range(6):
            month = six_months_ago + timedelta(days=30 * i)
            month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_bookings = Booking.objects.filter(
                car=car,
                created_at__range=[month_start, month_end]
            )
            
            completed = month_bookings.filter(status='completed').count()
            cancelled = month_bookings.filter(status='cancelled').count()
            active = month_bookings.filter(status='active').count()
            
            booking_trends.append({
                'month': month_start.strftime('%b %Y'),
                'completed': completed,
                'cancelled': cancelled,
                'active': active,
                'total': month_bookings.count()
            })
        
        # Get revenue by booking status
        revenue_by_status = {
            'completed': float(Booking.objects.filter(
                car=car, status='completed'
            ).aggregate(total=Sum('total_amount'))['total'] or 0),
            'active': float(Booking.objects.filter(
                car=car, status='active'
            ).aggregate(total=Sum('total_amount'))['total'] or 0),
            'cancelled': float(Booking.objects.filter(
                car=car, status='cancelled'
            ).aggregate(total=Sum('total_amount'))['total'] or 0),
        }
        
        # Get maintenance cost breakdown
        maintenance_by_type = MaintenanceRecord.objects.filter(
            car=car
        ).values('type').annotate(
            total_cost=Sum('cost'),
            count=Count('id')
        ).order_by('-total_cost')
        
        data = {
            'car': CarDetailSerializer(car).data,
            'analytics': analytics_data,
            'booking_trends': booking_trends,
            'revenue_by_status': revenue_by_status,
            'maintenance_breakdown': list(maintenance_by_type),
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
            extra_data={
                'old_status': car.status,
                'new_status': new_status,
                'changed_by': request.user.username if request.user.is_authenticated else 'system'
            }
        )
        
        car.status = new_status
        car.save()
        
        return Response({'status': 'updated', 'car': CarSerializer(car).data})
    
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
    
    @action(detail=True, methods=['patch'], url_path='payload')
    def update_with_event(self, request, pk=None):
        """Handle event payload from frontend (maintenance, insurance, accident, etc.)"""
        car = self.get_object()
        payload = request.data

        # Extract common fields
        event_type = payload.get('type')
        title = payload.get('title')
        description = payload.get('description', '')
        date = payload.get('date')
        amount = payload.get('amount', 0)

        # Create base Event record
        event = Event.objects.create(
            car=car,
            event_type=event_type,
            title=title,
            description=description,
            created_by=request.user if request.user.is_authenticated else None,
            extra_data=payload
        )

        # Handle specific event types
        if event_type == 'maintenance':
            MaintenanceRecord.objects.create(
                car=car,
                type='routine',  # you can add a subtype field in payload if needed
                title=title,
                description=description,
                start_date=date,
                estimated_end_date=payload.get('returnDate'),
                cost=amount,
                garage=payload.get('garage', ''),
                status='scheduled',
                created_by=request.user if request.user.is_authenticated else None
            )
            # Update car status to maintenance
            if car.status != 'maintenance':
                car.status = 'maintenance'
                car.save()

        elif event_type == 'insurance':
            InsurancePolicy.objects.create(
                car=car,
                policy_number=payload.get('policyNumber'),
                insurance_company=payload.get('provider'),
                policy_type=payload.get('type', 'comprehensive'),  # fallback
                insurance_amount=amount,
                start_date=payload.get('startDate'),
                end_date=payload.get('endDate'),
                is_current=True,
                created_by=request.user if request.user.is_authenticated else None
            )
            # Car status may remain unchanged unless insurance expired

        elif event_type == 'accident':
            severity = payload.get('severity')
            if severity == 'total':
                car.status = 'retired'
                car.save()
            else:
                # Create maintenance record for repairs
                MaintenanceRecord.objects.create(
                    car=car,
                    type='accident',
                    title=title,
                    description=description,
                    start_date=date,
                    estimated_end_date=payload.get('returnDate'),
                    cost=amount,
                    garage=payload.get('garage', ''),
                    status='scheduled',
                    created_by=request.user if request.user.is_authenticated else None
                )
                if car.status != 'maintenance':
                    car.status = 'maintenance'
                    car.save()

        elif event_type == 'revenue':
            # Just log the event; no further action
            pass

        # Return updated car data so frontend can refresh
        serializer = CarDetailSerializer(car, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_cars_list(request):
    """Public endpoint to get all available cars"""
    cars = Car.objects.all()
    serializer = CarPublicSerializer(cars, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def public_car_detail(request, car_id):
    """Public endpoint to get car details"""
    try:
        car = Car.objects.get(id=car_id, is_active=True)
        serializer = CarPublicSerializer(car, context={'request': request})
        return Response(serializer.data)
    except Car.DoesNotExist:
        return Response({'error': 'Car not found'}, status=404)