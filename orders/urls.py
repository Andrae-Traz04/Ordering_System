from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from . import views


@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'panel':          request.build_absolute_uri('/api/panel/'),
        'register':       reverse('register',          request=request),
        'login':          reverse('login',             request=request),
        'logout':         reverse('logout',            request=request),
        'me':             reverse('me',                request=request),
        'orders':         reverse('order-list-create', request=request),
        'orders_summary': reverse('order-summary',     request=request),
        'order_detail':   'http://127.0.0.1:8000/api/orders/{id}/',
        'order_status':   'http://127.0.0.1:8000/api/orders/{id}/status/',
        'order_review':   'http://127.0.0.1:8000/api/orders/{id}/review/',
        'customers':      reverse('customer-list',     request=request),
        'users':          reverse('user-list',         request=request),
        'notifications':  reverse('notifications',     request=request),
    })


urlpatterns = [
    # API root
    path('', api_root, name='api-root'),

    # Admin panel HTML
    path('panel/', views.admin_panel, name='admin-panel'),

    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/',    views.LoginView.as_view(),    name='login'),
    path('auth/logout/',   views.LogoutView.as_view(),   name='logout'),
    path('auth/me/',       views.MeView.as_view(),       name='me'),

    # Orders
    path('orders/',                 views.OrderListCreateView.as_view(),   name='order-list-create'),
    path('orders/summary/',         views.OrderSummaryView.as_view(),      name='order-summary'),
    path('orders/<int:pk>/',        views.OrderDetailView.as_view(),       name='order-detail'),
    path('orders/<int:pk>/status/', views.OrderStatusUpdateView.as_view(), name='order-status'),
    path('orders/<int:pk>/review/', views.ReviewView.as_view(),            name='order-review'),

    # Customers & Users
    path('customers/',  views.CustomerListView.as_view(), name='customer-list'),
    path('users/',      views.UserListView.as_view(),     name='user-list'),

    # Notifications
    path('notifications/', views.NotificationView.as_view(), name='notifications'),
]