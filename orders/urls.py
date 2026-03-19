from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from . import views


@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'register':       reverse('register', request=request),
        'login':          reverse('login', request=request),
        'orders':         reverse('order-list-create', request=request),
        'orders_summary': reverse('order-summary', request=request),
        'order_detail':   'http://127.0.0.1:8000/api/orders/{id}/',
        'order_status':   'http://127.0.0.1:8000/api/orders/{id}/status/',
        'order_review':   'http://127.0.0.1:8000/api/orders/{id}/review/',
        'notifications':  reverse('notifications', request=request),
        'customers':      reverse('customer-list', request=request),
        'users':          reverse('user-list', request=request),
    })


urlpatterns = [
    path('', api_root, name='api-root'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/',    views.LoginView.as_view(),    name='login'),
    path('auth/logout/',   views.LogoutView.as_view(),   name='logout'),
    path('auth/me/',       views.MeView.as_view(),       name='me'),
    path('orders/',                  views.OrderListCreateView.as_view(),   name='order-list-create'),
    path('orders/summary/',          views.OrderSummaryView.as_view(),      name='order-summary'),
    path('orders/<int:pk>/',         views.OrderDetailView.as_view(),       name='order-detail'),
    path('orders/<int:pk>/status/',  views.OrderStatusUpdateView.as_view(), name='order-status'),
    path('orders/<int:pk>/review/',  views.ReviewView.as_view(),            name='order-review'),
    path('customers/',               views.CustomerListView.as_view(),      name='customer-list'),
    path('users/',                   views.UserListView.as_view(),          name='user-list'),
    path('notifications/',           views.NotificationView.as_view(),      name='notifications'),
]