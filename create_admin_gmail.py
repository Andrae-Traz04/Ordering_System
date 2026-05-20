import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from orders.models import UserProfile

email = 'admin@gmail.com'
password = 'admin123'
username = 'admin'  # using admin as username

if not User.objects.filter(email=email).exists():
    user = User.objects.create_superuser(username=username, email=email, password=password)
    user.save()
    print(f"Created superuser: {username}")
else:
    user = User.objects.get(email=email)
    print(f"User with email {email} already exists.")

# Update or create the UserProfile
profile, created = UserProfile.objects.get_or_create(user=user)
profile.role = 'admin'
profile.save()
print(f"UserProfile role set to 'admin' (created: {created})")