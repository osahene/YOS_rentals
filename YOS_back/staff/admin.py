from django.contrib import admin
from .models import Staff, SalaryPayment

@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = (
        'name', 
        'role', 
        'employee_id', 
        'department', 
        'status', 
        'employment_type',
        'shift'
    )
    list_filter = ('role', 'status', 'employment_type', 'shift', 'department', 'hire_date')
    search_fields = ('name', 'email', 'employee_id', 'phone', 'driver_license_id')
    readonly_fields = ('created_at', 'updated_at', 'id')
    ordering = ('name',)
    
    # Organize the form into logical sections
    fieldsets = (
        ('Account Info', {
            'fields': ('id', 'user', 'status')
        }),
        ('Personal Details', {
            'fields': ('name', 'employee_id', 'email', 'phone')
        }),
        ('Employment Details', {
            'fields': ('role', 'department', 'employment_type', 'shift', 'hire_date', 'termination_date')
        }),
        ('Financial Information', {
            'classes': ('collapse',),  # Collapsible section
            'fields': ('salary', 'bank_name', 'account_number', 'account_name')
        }),
        ('Driver Specific', {
            'classes': ('collapse',),
            'fields': ('driver_license_id', 'driver_license_class'),
            'description': 'Fill this section only if the staff member is a driver.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = (
        'get_staff_name', 
        'month_display', 
        'net_salary', 
        'is_paid', 
        'payment_date', 
        'payment_method'
    )
    list_filter = ('is_paid', 'month', 'payment_method', 'staff__department')
    search_fields = ('staff__name', 'staff__employee_id')
    readonly_fields = ('created_at', 'updated_at', 'id')
    autocomplete_fields = ['staff']  # Improves performance if you have many staff members
    date_hierarchy = 'month'
    
    fieldsets = (
        ('Recipient', {
            'fields': ('staff', 'month')
        }),
        ('Salary Breakdown', {
            'fields': ('basic_salary', 'overtime', 'bonuses', 'deductions', 'net_salary')
        }),
        ('Payment Status', {
            'fields': ('is_paid', 'payment_date', 'payment_method', 'paid_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    # Custom method to display staff name in list view
    @admin.display(description='Staff Name', ordering='staff__name')
    def get_staff_name(self, obj):
        return obj.staff.name

    # Custom method to format the month nicely
    @admin.display(description='Month', ordering='month')
    def month_display(self, obj):
        return obj.month.strftime('%B %Y')