import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from orders.models import UserProfile

email = 'adminconey@gmail.com'
try:
    user = User.objects.get(email=email)
    print(f"Found user: {user.username}")
    print(f"Email: {user.email}")
    print(f"Is staff: {user.is_staff}")
    print(f"Is superuser: {user.is_superuser}")
    
    profile = UserProfile.objects.get(user=user)
    profile.role = 'admin' # Force set to admin
    profile.save()
    print(f"Updated Role: {profile.role}")
    
    print("\n✓ Admin account restored and verified successfully!")

except User.DoesNotExist:
    print(f"No user found with email: {email}. Try running create_admin_account.py first.")
except UserProfile.DoesNotExist:
    print(f"UserProfile does not exist for user: {user.username}")