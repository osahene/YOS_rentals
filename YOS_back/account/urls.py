from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegistrationView, LoginView, 
    LogoutView, ChangePasswordView, 
    VerifyEmailView, SendPhoneOTPView, 
    VerifyPhoneOTPView, RequestPasswordResetView, 
    VerifySecurityAnswersView, ResetPasswordView, 
    SecurityQuestionListView
)
urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("send-phone-otp/", SendPhoneOTPView.as_view(), name="send_phone_otp"),
    path("verify-phone-otp/", VerifyPhoneOTPView.as_view(), name="verify_phone_otp"),
    
    
    # Added on 17th Feb
    path("password-reset/request/", RequestPasswordResetView.as_view(), name="password_reset_request"),
    path("password-reset/verify-answers/", VerifySecurityAnswersView.as_view(), name="password_reset_verify"),
    path("password-reset/confirm/", ResetPasswordView.as_view(), name="password_reset_confirm"),
    path("security-questions/", SecurityQuestionListView.as_view(), name="security_questions"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
