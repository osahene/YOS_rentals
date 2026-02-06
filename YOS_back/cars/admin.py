from django.contrib import admin
from .models import Car

@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    # Fields to display in the main list view
    list_display = (
        'license_plate', 
        'make', 
        'model', 
        'year', 
        'status', 
        'daily_rate', 
        'is_active',
        'registered_by'
    )
    
    # Right-hand sidebar filters
    list_filter = ('status', 'make', 'fuel_type', 'transmission', 'is_active', 'year')
    
    # Search bar configuration
    search_fields = ('license_plate', 'vin', 'make', 'model', 'description')
    
    # Organizes the detail view into logical sections
    fieldsets = (
        ('Basic Information', {
            'fields': ('make', 'model', 'year', 'color', 'color_hex', 'license_plate', 'vin')
        }),
        ('Technical Specs', {
            'fields': ('fuel_type', 'transmission', 'seats', 'mileage', 'features', 'description')
        }),
        ('Financials', {
            'fields': ('purchase_price', 'purchase_date', 'daily_rate', 'current_value')
        }),
        ('Status & Media', {
            'fields': ('status', 'is_active', 'images', 'registered_by')
        }),
    )
    
    # Sets read-only fields for the admin form
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    # Automatically assigns the logged-in user to the 'registered_by' field
    # def save_model(self, request, obj, form, change):
    #     if not obj.registered_by:
    #         obj.registered_by = request.user
    #     super().save_model(request, obj, form, change)

    # Optional: Logic to sort the list by creation date by default
    ordering = ('-created_at',)