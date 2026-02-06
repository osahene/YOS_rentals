from rest_framework import serializers
from .models import Event
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