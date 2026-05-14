from django.db import models

class KnowledgeBase(models.Model):
    title = models.CharField(max_length=255)

    text_content = models.TextField(blank=True, null=True)

    pdf_file = models.FileField(upload_to='pdfs/', null=True, blank=True)

    website_url = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.role