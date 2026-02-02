from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import ( Car, Driver, Payment, Booking,
    BookingHistory, Invoice, SMSLog, EmailLog
)

class CarAdmin(admin.ModelAdmin):
    list_display = ('make', 'model', 'year', 'license_plate',
                    'daily_rate', 'status', 'fuel_type')
    list_filter = ('status', 'make', 'fuel_type', 'transmission')
    search_fields = ('make', 'model', 'license_plate', 'vin')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('make', 'model', 'year', 'color', 'license_plate', 'vin')
        }),
        ('Pricing', {
            'fields': ('daily_rate', 'weekly_rate', 'monthly_rate', 'status')
        }),
        ('Technical Details', {
            'fields': ('fuel_type', 'transmission', 'seats', 'mileage')
        }),
        ('Features & Images', {
            'fields': ('features', 'images', 'description'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'car', 'start_date',
                    'end_date', 'status', 'total_amount')
    list_filter = ('status', 'is_self_drive', 'start_date', 'end_date')
    search_fields = ('customer__first_name',
                     'customer__last_name', 'car__make', 'car__model')
    readonly_fields = ('subtotal', 'total_amount', 'duration_days', 'created_at', 'updated_at')
    fieldsets = (
        ('Booking Information', {
            'fields': ('customer', 'car', 'driver', 'payment', 'status')
        }),
        ('Dates & Locations', {
            'fields': ('start_date', 'end_date', 'pickup_location', 'dropoff_location')
        }),
        ('Self-Drive Details', {
            'fields': ('is_self_drive', 'driver_license_id', 'driver_license_class',
                       'driver_license_issue_date', 'driver_license_expiry_date'),
            'classes': ('collapse',)
        }),
        ('Pricing', {
            'fields': ('daily_rate', 'duration_days', 'subtotal', 'tax_amount', 'total_amount')
        }),
        ('Additional Information', {
            'fields': ('special_requests', 'notes', 'cancellation_reason')
        }),
        ('Check-in/Check-out', {
            'fields': ('checked_out_by', 'checked_in_by', 'checked_out_at', 'checked_in_at', 'cancellation_date'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def view_history(self, request, queryset):
        # Custom admin action to view booking history
        pass


# Register models

admin.site.register(Car, CarAdmin)
admin.site.register(Driver)
admin.site.register(Payment)
admin.site.register(Booking, BookingAdmin)
admin.site.register(BookingHistory)
admin.site.register(Invoice)
admin.site.register(SMSLog)
admin.site.register(EmailLog)

# Unregister default Group model
admin.site.unregister(Group)
