from rest_framework import serializers
from .models import Event, MaintenanceRecord
class EventSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'car', 'event_type', 'event_type_display', 'title',
            'description', 'date', 'extra_data', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']
        
class CreateEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'car', 'event_type', 'title', 'description', 'date', 'extra_data'
        ]
        
class MaintenanceRecordSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    date = serializers.DateField(source='start_date')  # For frontend compatibility
    
    class Meta:
        model = MaintenanceRecord
        fields = [
            'id', 'car', 'type', 'type_display', 'title', 'description',
            'date', 'estimated_end_date', 'actual_end_date', 'cost',
            'garage', 'garage_contact', 'status', 'status_display',
            'notes', 'documents', 'created_at'
        ]