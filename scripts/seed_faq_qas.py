import os
import sys
import django
import json

# Ensure project root is first on sys.path so Django can import config.settings
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from orders.models import KnowledgeBase

FRONTEND = getattr(settings, 'FRONTEND_URL', 'https://www.example.com')

FAQ_ITEMS = [
    {
        'title': 'FAQ: Login',
        'text_content': (
            'Question: How do I log in to my account?\n\n'
            'Answer: On the login page, enter the email address you registered with and your password, then click "Log in". '
            'If you forgot your password, use the "Forgot password" link to request a reset email.\n\n'
            'Steps:\n'
            '- Go to the login page: {frontend}/login\n'
            '- Enter your registered email and password\n'
            '- Click "Log in"\n'
            'If you do not receive a reset email, check your spam folder or contact support.'
        ).format(frontend=FRONTEND),
        'website_url': f'{FRONTEND}/login'
    },
    {
        'title': 'FAQ: Register',
        'text_content': (
            'Question: How do I create a new account?\n\n'
            'Answer: On the registration page, fill in the required fields (name, email, password) and submit the form. '
            'You will receive an activation email — click the activation link to enable your account.\n\n'
            'Steps:\n'
            '- Go to the registration page: {frontend}/register\n'
            '- Complete the form and submit\n'
            '- Open the activation email and click the link to activate your account'
        ).format(frontend=FRONTEND),
        'website_url': f'{FRONTEND}/register'
    },
    {
        'title': 'FAQ: Activation Link',
        'text_content': (
            'Question: What is the activation link and how do I use it?\n\n'
            'Answer: After registering, you will receive an activation email containing a unique activation link. '
            'Click the link to verify your email and activate your account. The link expires after 24 hours; if expired, request a new activation email from the site.\n\n'
            'Steps:\n'
            '- Open the activation email sent to your address\n'
            '- Click the activation link (if it fails, request a new activation email from the login page)\n'
            '- After activation, log in using your email and password\n'
        ),
        'website_url': f'{FRONTEND}/activate'
    },
    {
        'title': 'FAQ: Ordering Process',
        'text_content': (
            'Question: How do I place an order?\n\n'
            'Answer: Browse products, add desired items to your cart, then proceed to checkout to enter delivery and payment details. Review your order and confirm to place it. You will receive an order confirmation email with details and an order number.\n\n'
            'Steps:\n'
            '- Browse products and click "Add to cart" for items you want\n'
            '- Open your cart and click "Checkout"\n'
            '- Enter shipping and payment information\n'
            '- Confirm the order and wait for the confirmation email'
        ),
        'website_url': f'{FRONTEND}/orders'
    },
    {
        'title': 'FAQ: Ordering Process Variant 1',
        'text_content': (
            'Question: What is the process of ordering?\n\n'
            'Answer: Browse products, add desired items to your cart, then proceed to checkout to enter delivery and payment details. Review your order and confirm to place it. You will receive an order confirmation email with details and an order number.\n\n'
            'Steps:\n'
            '- Browse products and click "Add to cart" for items you want\n'
            '- Open your cart and click "Checkout"\n'
            '- Enter shipping and payment information\n'
            '- Confirm the order and wait for the confirmation email'
        ),
        'website_url': f'{FRONTEND}/orders'
    },
    {
        'title': 'FAQ: Ordering Process Variant 2',
        'text_content': (
            'Question: How do I order?\n\n'
            'Answer: Browse products, add desired items to your cart, then proceed to checkout to enter delivery and payment details. Review your order and confirm to place it. You will receive an order confirmation email with details and an order number.\n\n'
            'Steps:\n'
            '- Browse products and click "Add to cart" for items you want\n'
            '- Open your cart and click "Checkout"\n'
            '- Enter shipping and payment information\n'
            '- Confirm the order and wait for the confirmation email'
        ),
        'website_url': f'{FRONTEND}/orders'
    },
    {
        'title': 'FAQ: Ordering Process Variant 3',
        'text_content': (
            'Question: How do I checkout?\n\n'
            'Answer: Browse products, add desired items to your cart, then proceed to checkout to enter delivery and payment details. Review your order and confirm to place it. You will receive an order confirmation email with details and an order number.\n\n'
            'Steps:\n'
            '- Browse products and click "Add to cart" for items you want\n'
            '- Open your cart and click "Checkout"\n'
            '- Enter shipping and payment information\n'
            '- Confirm the order and wait for the confirmation email'
        ),
        'website_url': f'{FRONTEND}/orders'
    }
]

created = []
updated = []
for item in FAQ_ITEMS:
    obj, created_flag = KnowledgeBase.objects.update_or_create(
        title=item['title'],
        defaults={
            'text_content': item['text_content'],
            'website_url': item.get('website_url', ''),
        }
    )
    if created_flag:
        created.append(item['title'])
    else:
        updated.append(item['title'])

print(json.dumps({'created': created, 'updated': updated}, indent=2))
