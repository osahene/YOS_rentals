from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Event, MaintenanceRecord, MaintenanceExtension
from .serializers import EventSerializer, CreateEventSerializer, MaintenanceRecordSerializer

class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint for logging events (maintenance, insurance, accidents, etc.)
    Transport Manager: Full CRUD access
    """
    queryset = Event.objects.all()
    
    def get_serializer_class(self) -> type:
        if self.action == 'create':
            return CreateEventSerializer
        return EventSerializer
    
    def get_permissions(self):
        return [permissions.AllowAny()]  
    
    def perform_create(self, serializer):
        event = serializer.save(created_by=self.request.user)
        
        # Update car status based on event type
        self.update_car_status(event)
        
        # If maintenance, create maintenance record
        if event.event_type == 'maintenance':
            self.create_maintenance_record(event)
        
        # If insurance update, update insurance policy
        elif event.event_type == 'insurance':
            self.update_insurance_policy(event)
    
    def update_car_status(self, event):
        """Update car status based on event"""
        car = event.car
        
        status_map = {
            'maintenance': 'maintenance',
            'accident': 'accident',
            'insurance': 'insurance_expired' if event.extra_data.get('is_expired') else car.status,
        }
        
        if event.event_type in status_map:
            new_status = status_map[event.event_type]
            if car.status != new_status:
                car.status = new_status
                car.save()
                
    def create_maintenance_record(self, event):
        """Create maintenance record from event"""
        
        MaintenanceRecord.objects.create(
            car=event.car,
            type=event.extra_data.get('type', 'routine'),
            title=event.title,
            description=event.description,
            start_date=event.date,
            estimated_end_date=event.extra_data.get('estimated_end_date'),
            cost=event.amount or 0,
            garage=event.extra_data.get('garage', ''),
            status='scheduled',
            created_by=event.created_by
        )
    
    def update_insurance_policy(self, event):
        """Update or create insurance policy"""
        from insurance.models import InsurancePolicy
        
        policy_data = event.extra_data
        
        # If policy_number exists, update existing policy
        if policy_data.get('policy_number'):
            try:
                policy = InsurancePolicy.objects.get(
                    policy_number=policy_data['policy_number'],
                    car=event.car
                )
                for field in ['end_date', 'insurance_amount', 'status']:
                    if field in policy_data:
                        setattr(policy, field, policy_data[field])
                policy.save()
            except InsurancePolicy.DoesNotExist:
                # Create new policy
                InsurancePolicy.objects.create(
                    car=event.car,
                    policy_number=policy_data['policy_number'],
                    provider=policy_data.get('provider', ''),
                    policy_type=policy_data.get('policy_type', 'comprehensive'),
                    coverage_amount=policy_data.get('coverage_amount', 0),
                    insurance_amount=policy_data.get('insurance_amount', 0),
                    start_date=policy_data.get('start_date', event.date),
                    end_date=policy_data.get('end_date'),
                    is_current=True,
                    created_by=event.created_by
                )
                
class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing maintenance records.
    Provides additional actions: complete, extend_deadline.
    """
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['car', 'status']
    search_fields = ['title', 'description', 'garage']
    ordering_fields = ['start_date', 'estimated_end_date', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark maintenance as completed."""
        record = self.get_object()
        actual_end_date = request.data.get('actual_end_date')
        if actual_end_date:
            # You may want to validate date format
            record.complete_maintenance(actual_end_date)
        else:
            record.complete_maintenance()  # uses today
        return Response({
            'status': 'completed',
            'record': MaintenanceRecordSerializer(record).data
        })

    @action(detail=True, methods=['post'])
    def extend_deadline(self, request, pk=None):
        """Extend the estimated end date and log the reason."""
        record = self.get_object()
        new_end_date = request.data.get('new_estimated_date')
        reason = request.data.get('reason', '')

        if not new_end_date:
            return Response(
                {'error': 'new_estimated_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create an extension log
        MaintenanceExtension.objects.create(
            maintenance_record=record,
            previous_end_date=record.estimated_end_date,
            new_end_date=new_end_date,
            reason=reason,
            extended_by=request.user
        )

        # Update the record's estimated end date
        record.estimated_end_date = new_end_date
        record.save()

        return Response({
            'status': 'extended',
            'record': MaintenanceRecordSerializer(record).data
        })