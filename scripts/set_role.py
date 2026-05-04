import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
from orders.models import UserProfile
User = get_user_model()
if len(sys.argv) < 3:
    print('Usage: python set_role.py <email|id> <role>')
    sys.exit(1)
key = sys.argv[1]
new_role = sys.argv[2]
user = None
if key.isdigit():
    user = User.objects.filter(pk=int(key)).first()
else:
    user = User.objects.filter(email__iexact=key).first()
if not user:
    print('User not found for:', key)
    sys.exit(2)
if new_role not in ['customer', 'owner', 'admin']:
    print('Invalid role. Must be customer, owner, or admin.')
    sys.exit(3)
profile, _ = UserProfile.objects.get_or_create(user=user)
profile.role = new_role
profile.save()
print(f'Updated {user.username} ({user.email}) role to {new_role}')
