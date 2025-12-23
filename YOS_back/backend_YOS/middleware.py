# core/security/middleware.py
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
import time
import hashlib


class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Set security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"

        # Add request fingerprint
        response['X-Request-ID'] = self._generate_request_id(request)

        return response

    def _generate_request_id(self, request):
        fingerprint = f"{request.META.get('REMOTE_ADDR')}{time.time()}{request.path}"
        return hashlib.sha256(fingerprint.encode()).hexdigest()[:16]
