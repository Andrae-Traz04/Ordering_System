import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from orders.models import UserProfile

def create_admin():
    username = 'adminconey'
    email = 'adminconey@gmail.com'
    password = 'adminconey'

    # Create the base User as a superuser
    if not User.objects.filter(username=username).exists():
        user = User.objects.create_superuser(username=username, email=email, password=password)
        print(f"✓ Superuser '{username}' created successfully.")
    else:
        user = User.objects.get(username=username)
        print(f"ℹ User '{username}' already exists.")

    # Ensure the UserProfile exists and has the 'admin' role
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.role = 'admin'
    profile.save()
    print(f"✓ Role 'admin' assigned to UserProfile for '{username}'.")

if __name__ == '__main__':
    create_admin()