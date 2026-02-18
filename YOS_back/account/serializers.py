# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate, password_validation
from django.core.validators import validate_email
from .models import User, ROLE_CHOICES, UserSecurityAnswer, compute_hmac, SecurityQuestion



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
    country_code = serializers.CharField(max_length=10, default='+233')
    phone_number = serializers.CharField(max_length=50, allow_blank=True)
    role = serializers.ChoiceField(choices=[c[0] for c in ROLE_CHOICES], default='ceo')
    security_answers = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=True
    )

    def validate_email(self, value):
        validate_email(value)
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        security_answers = validated_data.pop('security_answers')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        # Save security answers
        for ans in security_answers:
            qid = ans['question_id']
            answer = ans['answer']
            UserSecurityAnswer.objects.create(
                user=user,
                question_id=qid,
                answer_hash=compute_hmac(answer)   # hash immediately
            )
        return user
    
    
class SecurityQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityQuestion
        fields = ('id', 'question_text')
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(username=email, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        attrs['user'] = user
        return attrs


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
