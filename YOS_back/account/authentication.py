# accounts/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware


class CSRFCheck:
    """Utility to run Django's CSRF validation for cookie-based JWT auth.
       Usage: call .enforce(request) before accepting cookie-authenticated requests."""
    @staticmethod
    def enforce(request):
        reason = CsrfViewMiddleware().process_view(request, None, (), {})
        if reason:
            raise AuthenticationFailed(f'CSRF Failed: {reason}')


class CookieJWTAuthentication(JWTAuthentication):
    """
    Read access token from cookie first (settings.JWT_AUTH_COOKIE) or fall back to Authorization header.
    If using cookies for auth, the frontend must:
      - send cookies (fetch with credentials: 'include'),
      - include CSRF token for unsafe methods.
    """

    def authenticate(self, request):
        # 1) read token from cookie
        token = None
        cookie_name = getattr(settings, "JWT_AUTH_COOKIE", "access_token")
        token = request.COOKIES.get(cookie_name)

        # 2) fallback: Authorization header Bearer <token>
        if not token:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None
        else:
            raw_token = token  # DO NOT encode to bytes; JWT library expects str

        try:
            validated_token = self.get_validated_token(raw_token)
            # If token is in cookie and method is unsafe, enforce CSRF
            if token and request.method not in ('GET', 'HEAD', 'OPTIONS'):
                CSRFCheck.enforce(request)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except InvalidToken as exc:
            # Let DRF report as unauthenticated; raising AuthenticationFailed will stop middleware flow.
            raise AuthenticationFailed(str(exc))
