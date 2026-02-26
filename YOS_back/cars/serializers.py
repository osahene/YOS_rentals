from datetime import timedelta
from rest_framework import serializers
from django.db import transaction
from django.db.models import Sum

from .models import Car
# Update the import path below if 'insurance' is a sibling app to 'cars'
from django.core.files.storage import default_storage
import uuid
from insurance.serializers import InsurancePolicySerializer
from insurance.models import InsurancePolicy
import json

class CarSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    fuel_type_display = serializers.CharField(source='get_fuel_type_display', read_only=True)
    transmission_display = serializers.CharField(source='get_transmission_display', read_only=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = [
            'id', 'make', 'model', 'year', 'color', 'color_hex',
            'license_plate', 'vin', 'fuel_type', 'fuel_type_display',
            'transmission', 'transmission_display', 'seats', 'mileage',
            'features', 'description', 'status', 'status_display',
            'images', 'created_at', 'total_revenue', 'total_expenses', 'net_profit',
        ]
        read_only_fields = ['created_at', 'updated_at', 'total_revenue', 'total_expenses', 'net_profit']
    
    def get_images(self, obj):
        request = self.context.get('request')
        images = obj.images or []
        if request:
            return [request.build_absolute_uri(url) for url in images]
        return images
class CarPublicSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = [
            'id', 'make', 'model', 'year', 'color', 'car_type', 'license_plate', 'fuel_type', 
            'transmission', 'seats', 'features', 'description', 'images',
        ]
        read_only_fields = ['created_at', 'updated_at', ]
    
    def get_images(self, obj):
        request = self.context.get('request')
        images = obj.images or []
        
        processed_images = []
        for url in images:
            # Check if the URL is already absolute (Cloudinary URLs start with http)
            if url.startswith('http'):
                processed_images.append(url)
            elif request:
                # Fallback for old local images if any exist
                processed_images.append(request.build_absolute_uri(url))
            else:
                processed_images.append(url)
                
        return processed_images

class CarDetailSerializer(CarSerializer):
    current_insurance = serializers.SerializerMethodField()
    insurance_policies = InsurancePolicySerializer(many=True, read_only=True)
    maintenance_records = serializers.SerializerMethodField()
    bookings = serializers.SerializerMethodField()
    timeline_events = serializers.SerializerMethodField()
    analytics_data = serializers.SerializerMethodField()  
    
    class Meta(CarSerializer.Meta):
        fields = CarSerializer.Meta.fields + [
            'purchase_price', 'purchase_date', 'current_value',
            'current_insurance', 'insurance_policies', 'maintenance_records',
            'bookings', 'is_active', 'timeline_events', 'analytics_data'
        ]
    
    def get_current_insurance(self, obj):
        current = obj.insurance_policies.filter(is_current=True).first()
        if current:
            return InsurancePolicySerializer(current).data
        return None
    
    def get_maintenance_records(self, obj):
        from events.serializers import MaintenanceRecordSerializer
        records = obj.maintenance_records.all()[:10]  # Limit to 10 records
        return MaintenanceRecordSerializer(records, many=True).data
    
    
    
    def get_bookings(self, obj):
        from bookings.serializers import BookingSerializer
        bookings = obj.bookings.all()[:10]  # Limit to 10 records
        return BookingSerializer(bookings, many=True).data
    
    def get_timeline_events(self, obj):
        from events.models import Event
        from events.serializers import EventSerializer
        """
        Combine events from different models into a unified timeline
        Ordered by date (newest first)
        """
        timeline = []
        
        # 1. Get Events from Event model
        events = Event.objects.filter(car=obj).order_by('-created_at')[:20]
        for event in events:
            timeline.append({
                'id': str(event.id),
                'type': 'event',
                'event_type': event.event_type,
                'title': event.title,
                'description': event.description,
                'date': event.created_at.isoformat(),
                'created_at': event.created_at.isoformat(),
                'extra_data': event.extra_data,
                'icon': self.get_event_icon(event.event_type)
            })
        
        # 2. Get Maintenance Records
        maintenance_records = obj.maintenance_records.all().order_by('-start_date')[:20]
        for record in maintenance_records:
            timeline.append({
                'id': str(record.id),
                'type': 'maintenance',
                'event_type': 'maintenance',
                'title': f"{record.get_type_display()}: {record.title}",
                'description': record.description,
                'date': record.start_date.isoformat(),
                'created_at': record.created_at.isoformat(),
                'status': record.status,
                'cost': float(record.cost) if record.cost else 0,
                'garage': record.garage,
                'icon': 'wrench'
            })
        
        # 3. Get Bookings
        bookings = obj.bookings.all().order_by('-created_at')[:20]
        for booking in bookings:
            customer_name = booking.customer.full_name if booking.customer else "Unknown"
            timeline.append({
                'id': str(booking.id),
                'type': 'booking',
                'event_type': 'booking',
                'title': f"Booking: {customer_name}",
                'description': f"{booking.start_date} to {booking.end_date}",
                'date': booking.created_at.isoformat(),
                'created_at': booking.created_at.isoformat(),
                'status': booking.status,
                'amount': float(booking.total_amount) if booking.total_amount else 0,
                'duration': booking.duration_days,
                'icon': 'calendar'
            })
        
        # 4. Get Insurance Policies
        insurance_policies = obj.insurance_policies.all().order_by('-created_at')[:20]
        for policy in insurance_policies:
            timeline.append({
                'id': str(policy.id),
                'type': 'insurance',
                'event_type': 'insurance',
                'title': f"Insurance: {policy.insurance_company}",
                'description': f"Policy #{policy.policy_number} ({policy.get_policy_type_display()})",
                'date': policy.start_date.isoformat(),
                'created_at': policy.created_at.isoformat(),
                'end_date': policy.end_date.isoformat(),
                'amount': float(policy.insurance_amount) if policy.insurance_amount else 0,
                'icon': 'shield'
            })
        
        # Sort by date (newest first)
        timeline.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Return only latest 20 events for performance
        return timeline[:20]
    
    def get_analytics_data(self, obj):
        """
        Generate analytics data for the car
        - Monthly revenue and booking counts for the last 12 months
        - Performance metrics
        """
        from bookings.models import Booking
        from django.utils import timezone
        
        # Get data for last 12 months
        analytics = {
            'monthly_data': [],
            'summary': {},
            'performance_metrics': {}
        }
        
        # Generate monthly data for last 12 months
        for i in range(12):
            month_date = timezone.now() - timedelta(days=30 * i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            # Get bookings for this month
            month_bookings = Booking.objects.filter(
                car=obj,
                payment_status='paid',
                created_at__range=[month_start, month_end]
            )
            
            # Calculate revenue
            month_revenue = month_bookings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            # Count bookings
            booking_count = month_bookings.count()
            
            # Calculate average booking value
            avg_booking_value = month_revenue / booking_count if booking_count > 0 else 0
            
            analytics['monthly_data'].append({
                'month': month_start.strftime('%b %Y'),
                'month_short': month_start.strftime('%b'),
                'year': month_start.year,
                'revenue': float(month_revenue),
                'bookings': booking_count,
                'average_booking_value': float(avg_booking_value)
            })
        
        # Reverse to show oldest first (for charts)
        analytics['monthly_data'].reverse()
        
        # Calculate summary
        total_bookings = Booking.objects.filter(car=obj, payment_status='paid').count()
        total_revenue = float(obj.total_revenue) if obj.total_revenue else 0
        total_expenses = float(obj.total_expenses) if obj.total_expenses else 0
        
        analytics['summary'] = {
            'total_bookings': total_bookings,
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'net_profit': total_revenue - total_expenses,
            'average_revenue_per_booking': total_revenue / total_bookings if total_bookings > 0 else 0
        }
        
        # Calculate performance metrics
        current_month = timezone.now().replace(day=1)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        # Current month bookings
        current_month_bookings = Booking.objects.filter(
            car=obj,
            payment_status='paid',
            created_at__gte=current_month
        )
        current_month_revenue = current_month_bookings.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Last month bookings
        last_month_bookings = Booking.objects.filter(
            car=obj,
            payment_status='paid',
            created_at__range=[last_month, current_month - timedelta(days=1)]
        )
        last_month_revenue = last_month_bookings.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Calculate growth
        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = ((float(current_month_revenue) - float(last_month_revenue)) / float(last_month_revenue)) * 100
        
        booking_growth = 0
        if last_month_bookings.count() > 0:
            booking_growth = ((current_month_bookings.count() - last_month_bookings.count()) / last_month_bookings.count()) * 100
        
        analytics['performance_metrics'] = {
            'current_month_revenue': float(current_month_revenue),
            'last_month_revenue': float(last_month_revenue),
            'revenue_growth': revenue_growth,
            'booking_growth': booking_growth,
            'utilization_rate': self.calculate_utilization_rate(obj),
            'customer_satisfaction': 4.5,  # Placeholder - you can calculate from reviews
            'maintenance_cost_per_km': self.calculate_maintenance_cost_per_km(obj)
        }
        
        return analytics
    
    def get_event_icon(self, event_type):
        """Map event type to icon name"""
        icon_map = {
            'maintenance': 'wrench',
            'insurance': 'shield',
            'accident': 'alert-triangle',
            'status_change': 'refresh-cw',
            'booking': 'calendar',
            'revenue': 'dollar-sign',
            'other': 'info'
        }
        return icon_map.get(event_type, 'info')
    
    def calculate_utilization_rate(self, car):
        from bookings.models import Booking
        total_days = 365
        # Sum duration_days by iterating (property cannot be used in aggregate)
        bookings = Booking.objects.filter(car=car, payment_status='paid')
        booked_days = sum(booking.duration_days for booking in bookings)
        return (booked_days / total_days) * 100 if total_days > 0 else 0
    
    def calculate_maintenance_cost_per_km(self, car):
        from events.models import MaintenanceRecord
        """Calculate maintenance cost per kilometer"""
        total_maintenance_cost = MaintenanceRecord.objects.filter(
            car=car,
            status='completed'
        ).aggregate(
            total=Sum('cost')
        )['total'] or 0
        
        if car.mileage > 0:
            return float(total_maintenance_cost) / car.mileage
        return 0
    
class CreateCarSerializer(serializers.ModelSerializer):
    features = serializers.JSONField(required=False)
    insurance_company = serializers.CharField(write_only=True)
    policy_number = serializers.CharField(write_only=True)
    policy_type = serializers.CharField(write_only=True)
    insurance_amount = serializers.DecimalField(max_digits=12, decimal_places=2, write_only=True)
    insurance_start_date = serializers.DateField(write_only=True)
    insurance_end_date = serializers.DateField(write_only=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0)
    images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        required=False,
        write_only=True
    )
   
    image_urls = serializers.SerializerMethodField()
    class Meta:
        model = Car
        fields = [
            'make', 'model', 'year', 'color', 'color_hex', 'license_plate',
            'vin', 'purchase_price', 'purchase_date', 'fuel_type',
            'transmission', 'seats', 'mileage', 'features', 'description',
            'images', 'image_urls', 'insurance_company', 'policy_number', 'policy_type',
            'insurance_amount', 'insurance_start_date', 'insurance_end_date', 'total_revenue', 'total_expenses', 'net_profit',
        ]
    
    def validate_features(self, value):
        """Convert features to proper JSON format"""
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return value
    
    def create(self, validated_data):
        insurance_payload = {
            'insurance_company': validated_data.pop('insurance_company'),
            'policy_number': validated_data.pop('policy_number'),
            'policy_type': validated_data.pop('policy_type'),
            'insurance_amount': validated_data.pop('insurance_amount'),
            'start_date': validated_data.pop('insurance_start_date'),
            'end_date': validated_data.pop('insurance_end_date'),
        }
        images_data = validated_data.pop('images', [])

        with transaction.atomic():
            car = Car.objects.create(**validated_data)
            
            InsurancePolicy.objects.create(
                car=car,
                is_current=True,
                status='active',
                **insurance_payload
            )

            image_urls = []
            for image in images_data:
                ext = image.name.split('.')[-1]
                filename = f"{uuid.uuid4()}.{ext}"
                path = default_storage.save(f'cars/{filename}', image)
                url = default_storage.url(path)
                image_urls.append(url)
            
            # Save the list of URLs to the car's JSONField
            car.images = image_urls
            car.save()

        return car
    
    def validate_license_plate(self, value):
        if Car.objects.filter(license_plate=value).exists():
            raise serializers.ValidationError("A car with this license plate already exists.")
        return value
    
    def validate_vin(self, value):
        if value and Car.objects.filter(vin=value).exists():
            raise serializers.ValidationError("A car with this VIN already exists.")
        return value
    
    def get_image_urls(self, obj):
        # Return the list of URLs stored in obj.images (default to empty list)
        return obj.images or []