from django.urls import path
from .views import RegistrationView, LoginView, LogoutView, ChangePasswordView, VerifyEmailView, SendPhoneOTPView, VerifyPhoneOTPView

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("send-phone-otp/", SendPhoneOTPView.as_view(), name="send_phone_otp"),
    path("verify-phone-otp/", VerifyPhoneOTPView.as_view(), name="verify_phone_otp"),
]
