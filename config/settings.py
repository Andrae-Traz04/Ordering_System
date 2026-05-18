from pathlib import Path
import os



BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-order-system-key-2024')  # Change this in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'orders',
    'chatbot',
]

# Optionally include cloudinary apps when the package is installed in the environment
try:
    import cloudinary  # type: ignore
    INSTALLED_APPS.insert(6, 'cloudinary')
    INSTALLED_APPS.insert(7, 'cloudinary_storage')
except Exception:
    # Cloudinary not installed; skip those apps
    pass

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
FRONTEND_URL = 'http://localhost:5173'
# Default to local filesystem storage; if cloudinary is installed we'll override below
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME', ''),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET', ''),
}

# Try to use Cloudinary storage when available, otherwise fall back to local storage
try:
    from cloudinary_storage.storage import MediaCloudinaryStorage
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    storage = MediaCloudinaryStorage()
except Exception:
    # Cloudinary not installed or not configured in this environment; use local storage
    storage = None



MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'orders' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

DJOSER = {
    'SEND_ACTIVATION_EMAIL': True,
    'USER_CREATE_PASSWORD_RETYPE': True,
    'ACTIVATION_URL': 'activate/{uid}/{token}',
    'EMAIL_FRONTEND_DOMAIN': 'localhost:5173',
    'EMAIL_FRONTEND_PROTOCOL': 'http',
    'EMAIL_FRONTEND_SITE_NAME': 'AMU Bowls',
    'SERIALIZERS': {
        'user_create': 'orders.serializers.DjoserUserCreateSerializer',
        'user_create_password_retype': 'orders.serializers.DjoserUserCreateSerializer',
        'user': 'orders.serializers.UserSerializer',
        'current_user': 'orders.serializers.UserSerializer',
    },
    'EMAIL': {'activation': 'orders.emails.CustomActivationEmail'},
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Order Processing Workflow API',
    'DESCRIPTION': 'API for managing orders with workflow state machine.',
    'VERSION': '1.0.0',
}

# ─────────────────────────────────────────────
#  EMAIL CONFIGURATION (Gmail SMTP)
# ─────────────────────────────────────────────

# Control email backend via environment variable
# USE_CONSOLE_EMAIL=True  -> prints to console (development, no SMTP needed)
# USE_CONSOLE_EMAIL=False -> sends real emails via Gmail SMTP (production/testing)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'mathewpolinar5@gmail.com'
EMAIL_HOST_PASSWORD = 'xgjd mzku sulm mbwi'
DEFAULT_FROM_EMAIL = 'mathewpolinar5@gmail.com' # Must match EMAIL_HOST_USER for Gmail

# ⚠️  IMPORTANT FOR GMAIL - FOLLOW THESE STEPS:
# 1. Enable 2-Factor Authentication on your Google Account: https://myaccount.google.com/security
# 2. Generate an App Password: https://myaccount.google.com/apppasswords
#    - Select "Mail" and "Windows Computer" (or your platform)
#    - Google will generate a 16-character password
# 3. Copy that password to your .env file:
#    EMAIL_HOST_USER=your-email@gmail.com
#    EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  (the 16-char password from Google)
# 4. Set USE_CONSOLE_EMAIL=False in .env to use real SMTP
# 5. Test with: python manage.py shell
#    >>> from django.core.mail import send_mail
#    >>> send_mail('Test', 'Test message', 'from@gmail.com', ['to@gmail.com'], fail_silently=False)

# ─────────────────────────────────────────────
#  FRONTEND URL (for activation links)
# ─────────────────────────────────────────────

FRONTEND_URL = 'http://localhost:5173'  # Vite dev server

# ─────────────────────────────────────────────
#  ACTIVATION TOKEN TIMEOUT (seconds)
# ─────────────────────────────────────────────

ACTIVATION_TOKEN_EXPIRE_HOURS = 24

# Backend URL used for activation fallback links (change if your API runs on a different host/port)
BACKEND_URL = 'http://localhost:8000'