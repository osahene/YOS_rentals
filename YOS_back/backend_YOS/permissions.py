

from rest_framework.permissions import BasePermission
from django.conf import settings


class RolePermission(BasePermission):
    """
    Example usage:
      permission_classes = [RolePermission]
      and set on the view: view.allowed_roles = ['ceo', 'accountant']
    If view.allowed_roles is not set, falls back to IsAuthenticated behavior.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        allowed = getattr(view, "allowed_roles", None)
        if allowed is None:
            # no role restriction on this view
            return True
        return request.user.role in allowed


class HasAPIKey(BasePermission):
    def has_permission(self, request, view):
        key = request.headers.get('X-API-KEY') or request.GET.get('api_key')
        if not key:
            return False
        return key == getattr(settings, "FRONTEND_API_KEY", None)
