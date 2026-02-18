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
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


ROLE_CHOICES = [
        ('ceo', 'CEO'),
        ('accountant', 'Accountant'),
        ('transport_manager', 'Transport Manager'),
        ('customer', 'Customer'),
    ]

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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = EncryptedEmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
        validators=[EmailValidator()],
    )
    email_hash = models.CharField(max_length=128, db_index=True, editable=False)

        # Phone fields
    country_code = EncryptedCharField(max_length=10, default="+233")
    country_code_hash = models.CharField(max_length=128, db_index=True, editable=False)


    phone_number = EncryptedCharField(max_length=50, null=True, blank=True)
    phone_hmac = models.CharField(
        max_length=128, db_index=True, editable=False)

    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    updated_at = EncryptedDateTimeField(auto_now=True)

    auth_provider = models.CharField(
        max_length=255,
        blank=False,
        null=False,
        default=AUTH_PROVIDERS.get("email"),
    )

    USERNAME_FIELD = "email"

    objects = UserManager()
    
    def save(self, *args, **kwargs):
        """
        Auto-compute phone HMAC lookup field whenever phone_number is set or changed.
        """
        if self.email:
            normalized_email = self.email.lower().strip()
            self.email_hash = compute_hmac(normalized_email)

        if self.country_code:
            normlize_cc = self.country_code.replace("+", "").strip()
            self.country_code_hash = compute_hmac(normlize_cc)
        if self.phone_number:
            self.phone_hmac = compute_hmac(self.phone_number)
        else:
            self.phone_hmac = ""

        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class User(AbstractUserProfile):
   
    first_name = EncryptedCharField(max_length=255, null=True, blank=True)
    last_name = EncryptedCharField(max_length=255, null=True, blank=True)
    role = EncryptedCharField(
        max_length=20, choices=ROLE_CHOICES, default='customer')

    first_name_hash = models.CharField(
        max_length=64, editable=False, db_index=True, )
    last_name_hash = models.CharField(
        max_length=64, editable=False, db_index=True)
    role_hash = models.CharField(
        max_length=64, editable=False, db_index=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['first_name_hash', 'last_name_hash'])
        ]
    

    def get_full_name(self):
        # override: prefer decrypted encrypted fields
        first = (self.first_name or '').title()
        last = (self.last_name or '').title()
        return f"{first} {last}".strip()

    def get_short_name(self):
        return self.first_name or self.email

    def save(self, *args, **kwargs):
        if self.first_name:
            self.first_name_hash = compute_hmac(self.first_name)
        else:
            self.first_name_hash = ''
        if self.last_name:
            self.last_name_hash = compute_hmac(self.last_name)
        else:
            self.last_name_hash = ''
        if self.role:
            self.role_hash = compute_hmac(self.role)
        else:
            self.role_hash = ''
        super().save(*args, **kwargs)


class UserSession(models.Model):
    user = models.ForeignKey(
        User,
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

class SecurityQuestion(models.Model):
    question_text = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.question_text


class UserSecurityAnswer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='security_answers')
    question = models.ForeignKey(SecurityQuestion, on_delete=models.CASCADE)
    answer_hash = models.CharField(max_length=128, db_index=True)   # HMAC of answer

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'question')

    def set_answer(self, plain_answer):
        self.answer_hash = compute_hmac(plain_answer)

    def check_answer(self, plain_answer):
        return hmac.compare_digest(self.answer_hash, compute_hmac(plain_answer))