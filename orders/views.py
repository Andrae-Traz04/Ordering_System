from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from .models import Customer, Order, StatusHistory
from .serializers import (
    CustomerSerializer, OrderSerializer,
    OrderCreateSerializer, StatusUpdateSerializer,
)


class OrderListCreateView(APIView):

    def get(self, request):
        orders = Order.objects.select_related('customer').prefetch_related(
            'items', 'status_history'
        ).all()

        status_filter = request.query_params.get('status')
        if status_filter:
            orders = orders.filter(status=status_filter)

        search = request.query_params.get('search')
        if search:
            orders = orders.filter(
                Q(order_number__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(customer__email__icontains=search)
            )

        orders = orders.order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response({'orders': serializer.data, 'count': orders.count()})

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):

    def get_object(self, pk):
        return get_object_or_404(
            Order.objects.select_related('customer').prefetch_related(
                'items', 'status_history'
            ),
            pk=pk,
        )

    def get(self, request, pk):
        order = self.get_object(pk)
        return Response(OrderSerializer(order).data)

    def patch(self, request, pk):
        order = self.get_object(pk)
        if 'notes' in request.data:
            order.notes = request.data['notes']
            order.save()
        return Response(OrderSerializer(order).data)

    def delete(self, request, pk):
        order = self.get_object(pk)
        order_number = order.order_number
        order.delete()
        return Response(
            {'message': f'Order {order_number} deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT,
        )


class OrderStatusUpdateView(APIView):

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        serializer = StatusUpdateSerializer(
            data=request.data, context={'order': order}
        )

        if serializer.is_valid():
            old_status = order.status
            new_status = serializer.validated_data['status']
            note = serializer.validated_data.get('note', '')

            order.status = new_status
            order.save()

            StatusHistory.objects.create(
                order=order,
                from_status=old_status,
                to_status=new_status,
                note=note,
            )

            return Response(OrderSerializer(order).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderSummaryView(APIView):

    def get(self, request):
        orders = Order.objects.all()
        summary = {
            'total_orders': orders.count(),
            'by_status': {
                'pending': orders.filter(status='pending').count(),
                'processing': orders.filter(status='processing').count(),
                'shipped': orders.filter(status='shipped').count(),
                'completed': orders.filter(status='completed').count(),
            },
            'total_revenue': float(
                orders.aggregate(t=Sum('total_amount'))['t'] or 0
            ),
            'completed_revenue': float(
                orders.filter(status='completed').aggregate(
                    t=Sum('total_amount')
                )['t'] or 0
            ),
        }
        return Response(summary)


class CustomerListView(APIView):

    def get(self, request):
        customers = Customer.objects.prefetch_related('orders').order_by('-created_at')
        serializer = CustomerSerializer(customers, many=True)
        return Response({'customers': serializer.data, 'count': customers.count()})