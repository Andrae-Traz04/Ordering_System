import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from orders.models import Product
from django.conf import settings
products = Product.objects.all()[:10]
print('Found', products.count(), 'products')
for p in products:
    print('---')
    print('id:', p.id, 'name:', p.name)
    print('image field:', getattr(p, 'image'))
    if p.image:
        try:
            print('image.url:', p.image.url)
        except Exception as e:
            print('image.url error:', e)
        img_path = os.path.join(settings.MEDIA_ROOT, p.image.name)
        print('image.name:', p.image.name)
        print('file exists:', os.path.exists(img_path), 'on disk at', img_path)
    else:
        print('no image set')
