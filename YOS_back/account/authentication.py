# accounts/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware
from django.utils.deprecation import MiddlewareMixin


class CSRFCheck(MiddlewareMixin):
    def process_request(self, request):
        reason = CsrfViewMiddleware().process_view(request, None, (), {})
        if reason:
            raise AuthenticationFailed(f'CSRF Failed: {reason}')


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Try to get token from cookies first
        access_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)

        if not access_token:
            # Fall back to Authorization header
            header = self.get_header(request)
            if header is None:
                return None

            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None
        else:
            raw_token = access_token.encode('utf-8')

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
