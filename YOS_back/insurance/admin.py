from django.contrib import admin

from .models import InsurancePolicy, InsuranceRenewal

class InsuranceRenewalInline(admin.TabularInline):
    model = InsuranceRenewal
    extra = 0
    readonly_fields = ('renewed_at', 'renewed_by')
    fields = ('previous_end_date', 'new_end_date', 'new_insurance_amount', 'renewed_at', 'renewed_by')
    can_delete = False

@admin.register(InsurancePolicy)
class InsurancePolicyAdmin(admin.ModelAdmin):
    # What shows up in the main list view
    list_display = (
        'policy_number', 
        'insurance_company', 
        'policy_type', 
        'end_date', 
        'status', 
        'is_current'
    )
    
    # Filters on the right side
    list_filter = ('status', 'policy_type', 'is_current', 'insurance_company')
    
    # Search functionality (traverses to the Car model for license plate)
    search_fields = ('policy_number', 'insurance_company', 'car__license_plate', 'car__vin')
    
    # Organize the detail page
    fieldsets = (
        ('Car & Policy Info', {
            'fields': ('car', 'policy_number', 'insurance_company', 'policy_type')
        }),
        ('Coverage & Financials', {
            'fields': ('insurance_amount', 'status', 'is_current')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Audit Trail', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',) # Hide this by default
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    inlines = [InsuranceRenewalInline]

  
    
@admin.register(InsuranceRenewal)
class InsuranceRenewalAdmin(admin.ModelAdmin):
    list_display = ('policy', 'previous_end_date', 'new_end_date', 'new_insurance_amount', 'renewed_at')
    list_filter = ('renewed_at',)
    search_fields = ('policy__policy_number', 'policy__car__license_plate')
    readonly_fields = ('renewed_at',)