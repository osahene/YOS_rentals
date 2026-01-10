from rest_framework import permissions


class IsAdminOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'staff']


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'customer'


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Check if user is admin or staff
        if request.user.role in ['admin', 'staff']:
            return True

        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'customer'):
            return obj.customer.user == request.user

        return False
