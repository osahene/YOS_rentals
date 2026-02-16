from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    # --- List View Configuration ---
    list_display = (
        'id_short', 'customer', 'car', 'start_date', 
        'end_date', 'booking_duration', 'status', 
        'payment_status', 'total_amount'
    )
    list_filter = (
        'status', 'payment_status', 'payment_method', 
        'is_self_drive', 'start_date', 'created_at'
    )
    search_fields = (
        'id', 'customer__first_name', 'customer__last_name', 
        'car__make', 'car__model', 'car__license_plate',
        'mobile_money_transaction_id', 'pay_in_slip_reference'
    )
    ordering = ('-created_at',)
    readonly_fields = ('id', 'total_amount', 'created_at', 'updated_at', 'duration_days_display')
    
    # Use raw_id_fields for relationships to prevent slow loading if you have thousands of records
    raw_id_fields = ('customer', 'car', 'guarantor', 'driver', 'created_by', 'cancelled_by')

    # --- Form Layout Configuration ---
    fieldsets = (
        ('Core Information', {
            'fields': (('id', 'status'), ('customer', 'car'), 'is_self_drive')
        }),
        ('Schedule & Logistics', {
            'fields': (
                ('start_date', 'end_date'),
                'duration_days_display',
                ('pickup_location', 'dropoff_location'),
                'special_requests'
            )
        }),
        ('Self-Drive / Driver Details', {
            'classes': ('collapse',),
            'description': 'Fill these if is_self_drive is True or if a driver is assigned.',
            'fields': (
                'driver',
                ('driver_license_id', 'driver_license_class'),
                ('driver_license_issue_date', 'driver_license_expiry_date'),
            )
        }),
        ('Financials', {
            'fields': (
                ('daily_rate', 'discount'),
                ('total_amount', 'amount_paid', 'refund_amount'),
            )
        }),
        ('Payment Details', {
            'fields': (
                ('payment_method', 'payment_status'),
                # Mobile Money
                ('mobile_money_provider', 'mobile_money_number', 'mobile_money_transaction_id'),
                # Bank / Pay-in-Slip
                ('pay_in_slip_bank', 'pay_in_slip_branch'),
                ('pay_in_slip_payee', 'pay_in_slip_reference', 'pay_in_slip_number', 'pay_in_slip_date'),
            )
        }),
        ('Return & Penalties', {
            'fields': (
                ('actual_return_time', 'return_mileage'),
                ('late_fee', 'penalty_amount'),
            )
        }),
        ('Cancellation Info', {
            'classes': ('collapse',),
            'fields': ('cancelled_at', 'cancelled_by', 'cancellation_reason'),
        }),
        ('System Metadata', {
            'fields': (('created_by', 'created_at'), 'updated_at'),
        }),
    )

    # --- Custom Display Methods ---
    
    def id_short(self, obj):
        return f"...{str(obj.id)[-6:]}"
    id_short.short_description = "Booking ID"

    def booking_duration(self, obj):
        return f"{obj.duration_days} days"
    booking_duration.short_description = "Duration"

    def duration_days_display(self, obj):
        return f"{obj.duration_days} days (Calculated from dates)"
    duration_days_display.short_description = "Calculated Duration"

    # --- Logic Hooks ---
    
    def save_model(self, request, obj, form, change):
        """Automatically set the created_by user on first save"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)