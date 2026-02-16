from django.contrib.auth.backends import ModelBackend
from account.models import compute_hmac, User
from typing import Any


class EncryptedEmailBackend(ModelBackend):
    def authenticate(self, request: Any, username: str | None = None, password: str | None = None, **kwargs: Any) -> Any:
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        
        if not username:
            return None
        
        try:
            target_hash = compute_hmac(username.lower().strip())
            
            user = User.objects.get(email_hash=target_hash)
            
            if password and user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            return None
        
        return None