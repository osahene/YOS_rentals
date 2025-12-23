# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate, password_validation, get_user_model
from django.core.validators import validate_email

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    For returning user data to frontend. Encrypted fields (email, phone_number, ...)
    will be decrypted automatically by the field implementation when accessed.
    """
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "country_code", "phone_number", "role",
                  "email_verified", "phone_verified")
        read_only_fields = ("id", "email_verified", "phone_verified")


class RegistrationSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    country_code = serializers.CharField(
        max_length=10, required=False, default='+233')
    phone_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=[c[0] for c in User.ROLE_CHOICES], required=False, default='customer')

    def validate_email(self, value):
        validate_email(value)
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with that email already exists.")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        # ensure phone_hmac computed on save (model save override)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")
        user = authenticate(username=email, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()


class SendPhoneOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    country_code = serializers.CharField(
        max_length=10, required=False, default='+233')


class VerifyPhoneOTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp = serializers.CharField(max_length=10)
