"""
Quick script to activate all existing users so they can log in.
Run with: python manage.py shell < activate_users.py
Or: python -c "exec(open('activate_users.py').read())"
"""
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, '.')
django.setup()

from django.contrib.auth.models import User

activated = 0
for user in User.objects.filter(is_active=False):
    user.is_active = True
    user.save()
    activated += 1
    print(f"Activated: {user.username} ({user.email})")

print(f"\nTotal users activated: {activated}")