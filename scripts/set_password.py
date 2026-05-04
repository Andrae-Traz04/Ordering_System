import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if len(sys.argv) < 3:
    print('Usage: python set_password.py <email|id> <new_password>')
    sys.exit(1)
key = sys.argv[1]
new_password = sys.argv[2]
user = None
if key.isdigit():
    user = User.objects.filter(pk=int(key)).first()
else:
    user = User.objects.filter(email__iexact=key).first()
if not user:
    print('User not found for:', key)
    sys.exit(2)
user.set_password(new_password)
user.save()
print('Password set for user:', user.id, user.username, user.email)
