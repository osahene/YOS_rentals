from django.contrib import admin
from .models import Event, MaintenanceRecord, MaintenanceExtension

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'car', 'title', 'created_by', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('title', 'car__registration_number', 'description') # Assumes Car has registration_number
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)

class MaintenanceExtensionInline(admin.TabularInline):
    model = MaintenanceExtension
    extra = 1
    readonly_fields = ('extended_at',)

@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ('type', 'car', 'status', 'start_date', 'estimated_end_date', 'cost', 'is_overdue_display')
    list_filter = ('status', 'type', 'start_date')
    search_fields = ('title', 'garage', 'car__registration_number')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [MaintenanceExtensionInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('car', 'type', 'title', 'description', 'status')
        }),
        ('Schedule & Dates', {
            'fields': ('start_date', 'estimated_end_date', 'actual_end_date')
        }),
        ('Financials & Location', {
            'fields': ('cost', 'garage', 'garage_contact')
        }),
        ('Additional Data', {
            'fields': ('notes', 'documents', 'created_by', 'id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    @admin.display(boolean=True, description='Overdue?')
    def is_overdue_display(self, obj):
        return obj.is_overdue

    actions = ['mark_as_completed']

    @admin.action(description='Mark selected records as completed')
    def mark_as_completed(self, request, queryset):
        for record in queryset:
            record.complete_maintenance()
        self.message_user(request, f"Successfully updated {queryset.count()} records.")

@admin.register(MaintenanceExtension)
class MaintenanceExtensionAdmin(admin.ModelAdmin):
    list_display = ('maintenance_record', 'previous_end_date', 'new_end_date', 'extended_by', 'extended_at')
    readonly_fields = ('extended_at',)