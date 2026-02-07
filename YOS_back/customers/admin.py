from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Customer, Guarantor

class GuarantorInline(admin.StackedInline):
    """Allows editing Guarantor details directly on the Customer page."""
    model = Guarantor
    can_delete = False
    verbose_name_plural = 'Guarantor Information'
    extra = 1 # Show one empty form if no guarantor exists
    fields = (
        ('first_name', 'last_name'),
        ('email', 'phone'),
        'ghana_card_id',
        'relationship',
        'occupation',
        'gps_address',
        ('address_city', 'address_region', 'address_country'),
    )

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    # --- LIST VIEW CONFIGURATION ---
    list_display = (
        'full_name', 
        'email', 
        'phone', 
        'loyalty_tier', 
        'status', 
        'total_bookings_count', 
        'created_at'
    )
    list_filter = ('status', 'loyalty_tier', 'address_region', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'ghana_card_id')
    ordering = ('-created_at',)
    list_editable = ('status', 'loyalty_tier') # Quick updates from the list view

    # --- DETAIL VIEW CONFIGURATION ---
    inlines = [GuarantorInline]
    readonly_fields = (
        'id', 'created_at', 'updated_at', 
        'last_booking_date', 'get_total_spent', 
        'get_total_bookings'
    )
    
    fieldsets = (
        ('Personal Details', {
            'fields': (('first_name', 'last_name'), ('email', 'phone'), 'id')
        }),
        ('Identification', {
            'fields': (
                'ghana_card_id', 
                ('driver_license_id', 'driver_license_class'),
                ('driver_license_issue_date', 'driver_license_expiry_date')
            )
        }),
        ('Location & Demographics', {
            'fields': (
                'occupation', 
                'gps_address', 
                ('address_city', 'address_region', 'address_country')
            )
        }),
        ('Status & Loyalty', {
            'fields': (('status', 'loyalty_tier'), 'last_booking_date')
        }),
        ('Activity Stats (Read-only)', {
            'classes': ('collapse',), # Hide by default to keep it clean
            'fields': ('get_total_bookings', 'get_total_spent'),
        }),
        ('JSON Preferences', {
            'classes': ('collapse',),
            'fields': ('preferred_vehicle_type', 'communication_preferences'),
        }),
    )

    # --- CUSTOM METHODS FOR PROPERTIES ---
    def total_bookings_count(self, obj):
        """Return the total bookings count."""
        return obj.total_bookings
    total_bookings_count.short_description = 'Bookings'  # type: ignore

    def get_total_bookings(self, obj):
        """Return the total bookings count."""
        return obj.total_bookings
    get_total_bookings.short_description = 'Total Bookings Count'  # type: ignore

    def get_total_spent(self, obj):
        """Return the total spent formatted as currency."""
        return f"GHS {obj.total_spent:,.2f}"
    get_total_spent.short_description = 'Total Revenue'  # type: ignore

# Also register Guarantor separately in case you need to find one specifically
@admin.register(Guarantor)
class GuarantorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'customer', 'phone', 'relationship')
    search_fields = ('first_name', 'last_name', 'customer__first_name', 'customer__last_name')