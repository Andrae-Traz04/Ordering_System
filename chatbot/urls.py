from django.urls import path
from .views import ChatbotView, KnowledgeBaseView

urlpatterns = [
    path('chat/', ChatbotView.as_view()),
    path('knowledge/', KnowledgeBaseView.as_view()),
]