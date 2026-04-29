from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-order-system-key-2024'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'cloudinary',
    'cloudinary_storage',
    'djoser',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'orders',
]

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
FRONTEND_URL = 'http://localhost:5173'
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': '123',
    'API_KEY': '123',
    'API_SECRET': '_123',
}

from cloudinary_storage.storage import MediaCloudinaryStorage

storage = MediaCloudinaryStorage()

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = '@email.com'
EMAIL_HOST_PASSWORD = 'app-password'
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = '@email.com'

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
        'DIRS': [],
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