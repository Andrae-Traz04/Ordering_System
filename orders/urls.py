from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from . import views


@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'orders': reverse('order-list-create', request=request, format=format),
        'orders_summary': reverse('order-summary', request=request, format=format),
        'customers': reverse('customer-list', request=request, format=format),
    })


urlpatterns = [
    path('', api_root, name='api-root'),
    path('orders/', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/summary/', views.OrderSummaryView.as_view(), name='order-summary'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', views.OrderStatusUpdateView.as_view(), name='order-status'),
    path('customers/', views.CustomerListView.as_view(), name='customer-list'),
]