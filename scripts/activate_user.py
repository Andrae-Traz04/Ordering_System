import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()

# Activate user by email or id passed as argument
if len(sys.argv) < 2:
    print('Usage: python activate_user.py <email|id>')
    sys.exit(1)
key = sys.argv[1]
user = None
if key.isdigit():
    user = User.objects.filter(pk=int(key)).first()
else:
    user = User.objects.filter(email__iexact=key).first()

if not user:
    print('User not found for:', key)
    sys.exit(2)

user.is_active = True
user.save()
print('Activated user:', user.id, user.username, user.email)
