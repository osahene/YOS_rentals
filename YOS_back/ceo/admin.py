from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from .models import (
    User, Customer, Car, Driver, Payment, Booking,
    BookingHistory, Invoice, SMSLog, EmailLog
)


class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name',
                    'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name',
         'last_name', 'email', 'phone', 'profile_image')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff',
         'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)


class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone', 'ghana_card_id',
                    'status', 'total_bookings', 'total_spent')
    list_filter = ('status', 'loyalty_tier', 'country', 'region')
    search_fields = ('first_name', 'last_name',
                     'email', 'phone', 'ghana_card_id')
    readonly_fields = ('total_bookings', 'total_spent', 'average_rating')
    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'first_name', 'last_name', 'email', 'phone', 'address', 'ghana_card_id', 'occupation')
        }),
        ('Address Details', {
            'fields': ('gps_address', 'locality', 'town', 'city', 'region', 'country')
        }),
        ('Customer Details', {
            'fields': ('join_date', 'status', 'total_bookings', 'total_spent', 'average_rating',
                       'preferred_vehicle_type', 'notes', 'tags', 'communication_preferences', 'loyalty_tier')
        }),
        ('Guarantor Information', {
            'fields': ('guarantor_first_name', 'guarantor_last_name', 'guarantor_phone', 'guarantor_email',
                       'guarantor_ghana_card_id', 'guarantor_occupation', 'guarantor_gps_address',
                       'guarantor_relationship', 'guarantor_locality', 'guarantor_town',
                       'guarantor_city', 'guarantor_region', 'guarantor_country')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class CarAdmin(admin.ModelAdmin):
    list_display = ('make', 'model', 'year', 'license_plate',
                    'daily_rate', 'status', 'fuel_type')
    list_filter = ('status', 'make', 'fuel_type', 'transmission')
    search_fields = ('make', 'model', 'license_plate', 'vin')
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
        ('Maintenance', {
            'fields': ('insurance_expiry', 'last_service_date', 'next_service_date')
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
    readonly_fields = ('subtotal', 'total_amount', 'duration_days')
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

    view_history.short_description = "View booking history"
    actions = [view_history]


# Register models
admin.site.register(User, UserAdmin)
admin.site.register(Customer, CustomerAdmin)
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
