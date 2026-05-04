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
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'orders',
]

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

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'mathewpolinar5@gmail.com'  # Replace with your Gmail
EMAIL_HOST_PASSWORD = 'jmgr clbt nfcm euja'  # Replace with App Password (not regular password)
DEFAULT_FROM_EMAIL = 'mathewpolinar5@gmail.com'

# Optional: For development, use console backend (prints emails to console)
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

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