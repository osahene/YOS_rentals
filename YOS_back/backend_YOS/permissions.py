

from rest_framework.permissions import BasePermission
from django.conf import settings


class IsTransportManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'transport_manager'


class IsAccountant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'accountant'


class IsCEO(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ceo'


class HasAPIKey(BasePermission):
    def has_permission(self, request, view):
        if request.headers.get('X-API-KEY') == settings.FRONTEND_API_KEY:
            return True
        return False
