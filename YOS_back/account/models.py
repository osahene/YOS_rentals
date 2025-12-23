# accounts/models.py
# accounts/models.py
from django.db import models
from django.core.validators import EmailValidator
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from encrypted_fields.fields import (
    EncryptedCharField, EncryptedEmailField, EncryptedDateTimeField
)
import uuid
import hmac
import hashlib
from django.conf import settings


AUTH_PROVIDERS = {
    'facebook': 'facebook',
    'google': 'google',
    'twitter': 'twitter',
    'email': 'email',
    'otp': 'otp',
}


def compute_hmac(value: str) -> str:
    """Return HMAC-SHA256 digest (hex) of value using SECRET_KEY.
       Used for irreversible lookup fields."""
    if not value:
        return ""
    key = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(key, value.encode("utf-8"), digestmod=hashlib.sha256).hexdigest()


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email field must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not email:
            raise ValueError("Superusers must have an email")
        if not password:
            raise ValueError("Superusers must have a password")

        return self.create_user(email, password, **extra_fields)


class AbstractUserProfile(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('ceo', 'CEO'),
        ('accountant', 'Accountant'),
        ('transport_manager', 'Transport Manager'),
        ('customer', 'Customer'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Encrypted Personally Identifiable Info
    first_name = EncryptedCharField(max_length=150)
    last_name = EncryptedCharField(max_length=150)

    email = EncryptedEmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
        validators=[EmailValidator()],
    )

    role = models.CharField(
        max_length=32, choices=ROLE_CHOICES, default="customer")

    # Phone fields
    country_code = EncryptedCharField(max_length=10, default="+233")
    phone_number = EncryptedCharField(max_length=50, null=True, blank=True)

    # Non-reversible HMAC lookup (stored in plaintext)
    phone_hmac = models.CharField(
        max_length=128, db_index=True, editable=False)

    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    updated_at = EncryptedDateTimeField(auto_now=True)

    auth_provider = models.CharField(
        max_length=255,
        blank=False,
        null=False,
        default=AUTH_PROVIDERS.get("email"),
    )

    # Django Auth
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def save(self, *args, **kwargs):
        """
        Auto-compute phone HMAC lookup field whenever phone_number is set or changed.
        """
        if self.phone_number:
            self.phone_hmac = compute_hmac(self.phone_number)
        else:
            self.phone_hmac = ""

        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class UserSession(models.Model):
    user = models.ForeignKey(
        AbstractUserProfile,
        on_delete=models.CASCADE,
        related_name="sessions"
    )
    session_key = models.CharField(max_length=255)
    user_agent = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["user", "session_key"]

    def __str__(self):
        return f"Session for {self.user.email} - {self.session_key}"


class UserSession(models.Model):
    user = models.ForeignKey(
        AbstractUserProfile, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=255)
    user_agent = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'session_key']
