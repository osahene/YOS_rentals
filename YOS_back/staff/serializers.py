from rest_framework import serializers
from .models import Staff, SalaryPayment
from bookings.models import Booking
from bookings.serializers import BookingSerializer
from django.db.models import Sum    

class StaffSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Staff
        fields = [
            'id', 'employee_id', 'name', 'email', 'phone', 'role', 'role_display',
            'department', 'employment_type', 'employment_type_display', 'shift',
            'shift_display', 'salary', 'bank_name', 'account_number', 'account_name',
            'status', 'status_display', 'hire_date', 'termination_date',
            'driver_license_id', 'driver_license_class', 'created_at', 'full_name'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.name

class StaffDetailSerializer(StaffSerializer):
    total_bookings = serializers.SerializerMethodField()
    completed_bookings = serializers.SerializerMethodField()
    total_salary_paid = serializers.SerializerMethodField()
    
    class Meta(StaffSerializer.Meta):
        fields = StaffSerializer.Meta.fields + [
            'total_bookings', 'completed_bookings', 'total_salary_paid'
        ]
    
    def get_total_bookings(self, obj):
        if obj.role == 'driver':
            return Booking.objects.filter(driver=obj).count()
        return 0
    
    def get_completed_bookings(self, obj):
        if obj.role == 'driver':
            return Booking.objects.filter(driver=obj, status='completed').count()
        return 0
    
    def get_total_salary_paid(self, obj):
        total = SalaryPayment.objects.filter(
            staff=obj, 
            is_paid=True
        ).aggregate(total=Sum('net_salary'))['total']
        return float(total) if total else 0.0

class SalaryPaymentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    staff_role = serializers.CharField(source='staff.role', read_only=True)
    
    class Meta:
        model = SalaryPayment
        fields = [
            'id', 'staff', 'staff_name', 'staff_role', 'month', 
            'basic_salary', 'overtime', 'bonuses', 'deductions',
            'net_salary', 'is_paid', 'payment_date', 'payment_method',
            'created_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, attrs):
        # Ensure net salary is calculated
        if 'net_salary' not in attrs or not attrs['net_salary']:
            basic = attrs.get('basic_salary', 0)
            overtime = attrs.get('overtime', 0)
            bonuses = attrs.get('bonuses', 0)
            deductions = attrs.get('deductions', 0)
            attrs['net_salary'] = basic + overtime + bonuses - deductions
        return attrs

class StaffWithBookingsSerializer(StaffSerializer):
    driver_bookings = serializers.SerializerMethodField()
    
    class Meta(StaffSerializer.Meta):
        fields = StaffSerializer.Meta.fields + ['driver_bookings']
    
    def get_driver_bookings(self, obj):
        if obj.role == 'driver':
            bookings = Booking.objects.filter(driver=obj).order_by('-created_at')[:10]
            return BookingSerializer(bookings, many=True).data
        return []

class CreateStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            'name', 'email', 'phone', 'role', 'department', 'employment_type',
            'shift', 'salary', 'bank_name', 'account_number', 'account_name',
            'hire_date', 'driver_license_id', 'driver_license_class'
        ]
    
    def validate_email(self, value):
        if Staff.objects.filter(email=value).exists():
            raise serializers.ValidationError("A staff member with this email already exists.")
        return value
    
    def create(self, validated_data):
        # Generate employee ID
        last_staff = Staff.objects.order_by('-id').first()
        if last_staff and last_staff.employee_id:
            last_num = int(last_staff.employee_id.replace('EMP', ''))
            new_num = last_num + 1
        else:
            new_num = 1
        
        validated_data['employee_id'] = f"EMP{new_num:04d}"
        validated_data['status'] = 'active'
        
        return super().create(validated_data)

class UpdateStaffStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Staff.STATUS_CHOICES)
    termination_date = serializers.DateField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True)