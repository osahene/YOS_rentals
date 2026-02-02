from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from account.models import compute_hmac, User


class EncryptedEmailBackend(ModelBackend):
    def authenticate(self, request, username, password, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD)
        
        try:
            # 1. Hash the incoming email attempt
            target_hash = compute_hmac(username.lower().strip())
            
            # 2. Search by the HASH, not the encrypted email field
            user = User.objects.get(email_hash=target_hash)
            
            # 3. Check the password
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            return None