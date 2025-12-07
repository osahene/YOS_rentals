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
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"

        # Add request fingerprint
        response['X-Request-ID'] = self._generate_request_id(request)

        return response

    def _generate_request_id(self, request):
        fingerprint = f"{request.META.get('REMOTE_ADDR')}{time.time()}{request.path}"
        return hashlib.sha256(fingerprint.encode()).hexdigest()[:16]


class RateLimitMiddleware(MiddlewareMixin):
    def __init__(self, get_response):
        super().__init__(get_response)
        self.requests = {}

    def process_request(self, request):
        ip = self._get_client_ip(request)
        path = request.path

        key = f"{ip}:{path}"
        current_time = time.time()

        # Clean old requests (older than 1 minute)
        self.requests = {
            k: v for k, v in self.requests.items()
            if current_time - v['timestamp'] < 60
        }

        if key in self.requests:
            # 100 requests per minute per endpoint
            if self.requests[key]['count'] > 100:
                from django.http import HttpResponseForbidden
                return HttpResponseForbidden('Rate limit exceeded')
            self.requests[key]['count'] += 1
        else:
            self.requests[key] = {'count': 1, 'timestamp': current_time}

        return None

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
