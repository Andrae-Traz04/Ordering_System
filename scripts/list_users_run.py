import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
print('id | username | email | is_active')
for u in User.objects.all().order_by('-id')[:50]:
    print(u.id, u.username, u.email, u.is_active)
