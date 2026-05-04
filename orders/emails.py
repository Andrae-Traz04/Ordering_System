try:
    from djoser import email

    class CustomActivationEmail(email.ActivationEmail):
        template_name = 'emails/activation.html'
except Exception:
    # djoser not installed in this environment; provide a no-op fallback
    class CustomActivationEmail:
        pass