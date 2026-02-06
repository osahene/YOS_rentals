from django.contrib import admin
from .models import ( User )
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name',
                    'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name',
         'last_name', 'email', 'phone', 'profile_image')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff',
         'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

# class CustomerAdmin(admin.ModelAdmin):
#     list_display = ('full_name', 'email', 'phone', 'ghana_card_id',
#                     'status', 'total_bookings', 'total_spent')
#     list_filter = ('status', 'loyalty_tier', 'country', 'region')
#     search_fields = ('first_name', 'last_name',
#                      'email', 'phone', 'ghana_card_id')
#     readonly_fields = ('total_bookings', 'total_spent', 'average_rating')
#     fieldsets = (
#         ('Personal Information', {
#             'fields': ('user', 'first_name', 'last_name', 'email', 'phone', 'address', 'ghana_card_id', 'occupation')
#         }),
#         ('Address Details', {
#             'fields': ('gps_address', 'locality', 'town', 'city', 'region', 'country')
#         }),
#         ('Customer Details', {
#             'fields': ('join_date', 'status', 'total_bookings', 'total_spent', 'average_rating',
#                        'preferred_vehicle_type', 'notes', 'tags', 'communication_preferences', 'loyalty_tier')
#         }),
#         ('Guarantor Information', {
#             'fields': ('guarantor_first_name', 'guarantor_last_name', 'guarantor_phone', 'guarantor_email',
#                        'guarantor_ghana_card_id', 'guarantor_occupation', 'guarantor_gps_address',
#                        'guarantor_relationship', 'guarantor_locality', 'guarantor_town',
#                        'guarantor_city', 'guarantor_region', 'guarantor_country')
#         }),
#         ('Dates', {
#             'fields': ('created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )


admin.site.register(User)
