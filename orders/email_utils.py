"""
Email utilities for sending activation and notification emails.
"""

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.urls import reverse


def send_activation_email(user):
    """
    Send account activation email to user with Gmail SMTP.
    Generates a unique token for email verification.
    """
    try:
        # Generate activation token
        token = default_token_generator.make_token(user)
        
        # Build activation links
        activation_url = f"{settings.FRONTEND_URL}/activate/{user.pk}/{token}/"
        backend_activation_url = f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/auth/activate/{user.pk}/{token}/"
        
        # Email context
        context = {
            'user': user,
            'activation_url': activation_url,
            'backend_activation_url': backend_activation_url,
            'frontend_url': settings.FRONTEND_URL,
            'token': token,
        }
        
        # Render HTML email
        html_message = render_to_string('emails/activation_email.html', context)
        plain_message = strip_tags(html_message)
        
        # Send email
        subject = 'Activate Your Ordering System Account'
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"✓ Activation email sent to {user.email}")
        return True, activation_url
        
    except Exception as e:
        print(f"✗ Failed to send activation email: {str(e)}")
        # Ensure we still return the activation URL for development fallback
        token = default_token_generator.make_token(user)
        activation_url = f"{settings.FRONTEND_URL}/activate/{user.pk}/{token}/"
        return False, activation_url


def send_password_reset_email(user):
    """
    Send password reset email to user.
    """
    try:
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{user.pk}/{token}/"
        
        context = {
            'user': user,
            'reset_url': reset_url,
        }
        
        html_message = render_to_string('emails/password_reset_email.html', context)
        plain_message = strip_tags(html_message)
        
        subject = 'Reset Your Ordering System Password'
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"✓ Password reset email sent to {user.email}")
        return True, reset_url
        
    except Exception as e:
        print(f"✗ Failed to send password reset email: {str(e)}")
        # Ensure we still return the reset URL for development fallback
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{user.pk}/{token}/"
        return False, reset_url


def send_order_notification_email(user, order):
    """
    Send order notification email to user.
    """
    try:
        context = {
            'user': user,
            'order': order,
            'order_url': f"{settings.FRONTEND_URL}/orders/{order.id}",
        }
        
        html_message = render_to_string('emails/order_notification.html', context)
        plain_message = strip_tags(html_message)
        
        subject = f'Order {order.order_number} Confirmation'
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"✓ Order notification sent to {user.email}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to send order notification: {str(e)}")
        return False
