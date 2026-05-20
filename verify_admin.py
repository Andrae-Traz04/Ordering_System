import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from orders.models import UserProfile

email = 'admin@gmail.com'
try:
    user = User.objects.get(email=email)
    print(f"Found user: {user.username}")
    print(f"Email: {user.email}")
    print(f"Is staff: {user.is_staff}")
    print(f"Is superuser: {user.is_superuser}")
    
    profile = UserProfile.objects.get(user=user)
    print(f"Role: {profile.role}")
    
    if user.is_staff and user.is_superuser and profile.role == 'admin':
        print("\n✓ Admin account verified successfully!")
    else:
        print("\n✗ Admin account verification failed!")
except User.DoesNotExist:
    print(f"No user found with email: {email}")
except UserProfile.DoesNotExist:
    print(f"UserProfile does not exist for user: {user.username}")