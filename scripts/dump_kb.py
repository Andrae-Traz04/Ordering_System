import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from orders.models import KnowledgeBase
for kb in KnowledgeBase.objects.all():
    print('---')
    print('id:', kb.id)
    print('title:', kb.title)
    print('url:', kb.website_url)
    print('text_content snippet:', (kb.text_content or '')[:400])
