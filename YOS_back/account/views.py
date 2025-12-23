import random
import hmac
import hashlib
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.core import signing
from django.core.mail import send_mail
from django.core.cache import cache
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegistrationSerializer, LoginSerializer, UserSerializer,
    ChangePasswordSerializer, EmailVerificationSerializer,
    SendPhoneOTPSerializer, VerifyPhoneOTPSerializer
)

User = get_user_model()


# ---------- Helpers ----------
def generate_email_token(user_id: str) -> str:
    """
    Create a timestamped signed token for email verification.
    Expires after EMAIL_VERIFICATION_TIMEOUT (seconds).
    """
    signer = signing.TimestampSigner(salt="email-verification")
    token = signer.sign(str(user_id))
    return token


def verify_email_token(token: str, max_age_seconds: int = 60 * 60 * 24):
    """
    Verify signed token and return user_id if valid. Raises signing.BadSignature or signing.SignatureExpired.
    """
    signer = signing.TimestampSigner(salt="email-verification")
    unsigned = signer.unsign(token, max_age=max_age_seconds)
    return unsigned  # string user_id


def generate_otp(length: int = 6) -> str:
    fmt = "{:0" + str(length) + "d}"
    return fmt.format(random.randint(0, 10**length - 1))


def _hash_otp(otp: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), otp.encode(), hashlib.sha256).hexdigest()


def _phone_cache_key(phone_number: str) -> str:
    return f"phone_otp:{phone_number}"


def cookie_settings():
    """Return cookie attributes from settings (used to set JWT cookies)."""
    return {
        "access_name": getattr(settings, "JWT_AUTH_COOKIE", "access_token"),
        "refresh_name": getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "refresh_token"),
        "secure": getattr(settings, "JWT_AUTH_SECURE", False),
        "samesite": getattr(settings, "JWT_AUTH_SAMESITE", "Lax"),
    }


def set_jwt_cookies(response, refresh_token_obj: RefreshToken):
    s = cookie_settings()
    access_token = str(refresh_token_obj.access_token)
    refresh_token = str(refresh_token_obj)

    # set cookies, httponly True
    response.set_cookie(s["access_name"], access_token,
                        httponly=True, secure=s["secure"], samesite=s["samesite"],
                        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()))
    response.set_cookie(s["refresh_name"], refresh_token,
                        httponly=True, secure=s["secure"], samesite=s["samesite"],
                        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()))
    return response


def unset_jwt_cookies(response):
    s = cookie_settings()
    response.delete_cookie(s["access_name"])
    response.delete_cookie(s["refresh_name"])
    return response


# ---------- Views ----------
class RegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # send email verification
        try:
            token = generate_email_token(str(user.id))
            verify_url = request.build_absolute_uri(
                f"/api/accounts/verify-email/?token={token}")
            send_mail(
                subject="Verify your email",
                message=f"Please verify your email by visiting: {verify_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[str(user.email)],
                fail_silently=True
            )
        except Exception:
            # Do not fail registration for email delivery problems
            pass

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        resp = Response({
            "detail": "Login successful",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

        set_jwt_cookies(resp, refresh)
        return resp


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Blacklist the refresh token if provided in cookie
        cookie_name = cookie_settings()["refresh_name"]
        refresh_token = request.COOKIES.get(cookie_name, None)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # blacklist may fail if token invalid — ignore
                pass

        resp = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
        unset_jwt_cookies(resp)
        return resp


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        old = serializer.validated_data['old_password']
        new = serializer.validated_data['new_password']
        if not user.check_password(old):
            return Response({"detail": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new)
        user.save()
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response({"detail": "Token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_id = verify_email_token(token)
            user = get_object_or_404(User, pk=user_id)
            user.email_verified = True
            user.save(update_fields=["email_verified"])
            return Response({"detail": "Email verified."}, status=status.HTTP_200_OK)
        except signing.SignatureExpired:
            return Response({"detail": "Token expired."}, status=status.HTTP_400_BAD_REQUEST)
        except signing.BadSignature:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class SendPhoneOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendPhoneOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']
        country = serializer.validated_data.get('country_code', '+233')
        full_phone = f"{country}{phone}" if not phone.startswith(
            '+') else phone

        otp = generate_otp(6)
        otp_hash = _hash_otp(otp)
        cache_key = _phone_cache_key(full_phone)
        cache.set(cache_key, otp_hash, timeout=300)  # 5 minutes

        # Send SMS (hook to your Celery task or provider)
        # from .tasks import send_sms_task
        # send_sms_task.delay(full_phone, f"Your OTP is {otp}")   # recommended
        # For now, use send_mail or logger or fail_silently
        try:
            # If you don't have SMS provider, email the OTP if email present in request
            if request.data.get("email"):
                send_mail(
                    subject="Your OTP",
                    message=f"Your OTP is {otp}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[request.data.get("email")],
                    fail_silently=True
                )
        except Exception:
            pass

        # never return the OTP in response in production
        return Response({"detail": "OTP sent (if provider configured)."}, status=status.HTTP_200_OK)


class VerifyPhoneOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyPhoneOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone_number']
        otp = serializer.validated_data['otp']
        full_phone = phone  # expect full phone or pass country + phone from frontend
        cache_key = _phone_cache_key(full_phone)
        stored_hash = cache.get(cache_key)
        if not stored_hash:
            return Response({"detail": "OTP expired or not found."}, status=status.HTTP_400_BAD_REQUEST)

        if hmac.compare_digest(stored_hash, _hash_otp(otp)):
            # mark user as phone_verified if a user exists with that phone_hmac
            # We compute phone_hmac for lookup: store HMAC of phone in model
            phone_lookup_hmac = hmac.new(settings.SECRET_KEY.encode(
            ), full_phone.encode(), hashlib.sha256).hexdigest()
            user_qs = User.objects.filter(phone_hmac=phone_lookup_hmac)
            if user_qs.exists():
                user = user_qs.first()
                # ensure phone_verified field exists on model
                user.phone_verified = True
                user.save(update_fields=["phone_verified"])
                cache.delete(cache_key)
                return Response({"detail": "Phone verified and linked to account."}, status=status.HTTP_200_OK)
            else:
                # phone verified but not linked to an account
                cache.delete(cache_key)
                return Response({"detail": "Phone verified."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
